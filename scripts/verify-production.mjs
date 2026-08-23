import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

const credentialMarker = "pokecarddex-browser-safety-marker";
const refreshSeconds = 2;
const providerCalls = new Map();

function providerResponse(url) {
  const set = { id: "base1", name: "Base", releaseDate: "1999/01/09", total: 102 };
  const card = {
    id: "base1-4", name: "Charizard", number: "4", rarity: "Rare Holo", images: {}, set,
    tcgplayer: { updatedAt: "2026/08/23", prices: { holofoil: { market: 321.5 } } },
  };
  if (url.pathname === "/v2/sets/base1") return { data: set };
  if (url.pathname === "/v2/cards/base1-4") return { data: card };
  if (url.pathname === "/v2/cards") return { data: [card], count: 1, totalCount: 1 };
  if (url.pathname === "/v2/sets") return { data: [set], count: 1, totalCount: 1 };
  return undefined;
}

const provider = createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://provider.test");
  const key = `${url.pathname}?${url.searchParams}`;
  const body = providerResponse(url);
  if (!body) {
    response.writeHead(404).end();
    return;
  }
  if (request.headers["x-api-key"] !== credentialMarker) {
    response.writeHead(401).end();
    return;
  }
  providerCalls.set(key, (providerCalls.get(key) ?? 0) + 1);
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
});

async function listen(server) {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Could not allocate a verification port.");
  return address.port;
}

async function run(command, args, environment) {
  const child = spawn(command, args, { env: environment, stdio: "inherit" });
  const [code] = await once(child, "exit");
  if (code !== 0) throw new Error(`${command} ${args.join(" ")} exited with ${code}`);
}

async function waitForApp(origin) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error("Production app did not start in time.");
}

async function visitEveryJourney(origin, providerOrigin) {
  for (const path of ["/sets", "/sets/base1", "/search?q=Charizard", "/card-printings/base1-4"]) {
    const response = await fetch(`${origin}${path}`);
    const body = await response.text();
    if (!response.ok) throw new Error(`${path} returned ${response.status}`);
    if (body.includes(credentialMarker) || body.includes(providerOrigin)) {
      throw new Error(`${path} exposed server-only provider data.`);
    }
  }
}

function snapshotCalls() {
  return new Map(providerCalls);
}

function assertUnchanged(before) {
  for (const [url, count] of providerCalls) {
    if ((before.get(url) ?? 0) !== count) throw new Error(`Provider response was not reused for ${url}.`);
  }
}

function allCallsRefreshed(before) {
  return [...before].every(([url, count]) => (providerCalls.get(url) ?? 0) > count);
}

let app;
try {
  const providerPort = await listen(provider);
  const providerOrigin = `http://127.0.0.1:${providerPort}`;
  const portProbe = createServer();
  const appPort = await listen(portProbe);
  await new Promise((resolve, reject) => portProbe.close((error) => error ? reject(error) : resolve()));
  const appOrigin = `http://127.0.0.1:${appPort}`;
  const environment = {
    ...process.env,
    POKEMON_TCG_API_KEY: credentialMarker,
    POKEMON_TCG_API_BASE_URL: `${providerOrigin}/v2`,
    CATALOG_REFRESH_SECONDS: String(refreshSeconds),
  };

  await run("npm", ["run", "build"], environment);
  await run(process.execPath, ["scripts/verify-browser-safety.mjs"], {
    ...environment,
    BROWSER_SAFETY_MARKER: credentialMarker,
    BROWSER_PROVIDER_ORIGIN: providerOrigin,
  });

  app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(appPort)], { env: environment, stdio: "inherit" });
  await waitForApp(appOrigin);
  await visitEveryJourney(appOrigin, providerOrigin);
  const firstVisit = snapshotCalls();
  await visitEveryJourney(appOrigin, providerOrigin);
  assertUnchanged(firstVisit);

  await delay((refreshSeconds * 1_000) + 250);
  await visitEveryJourney(appOrigin, providerOrigin);
  for (let attempt = 0; attempt < 20 && !allCallsRefreshed(firstVisit); attempt += 1) await delay(250);
  if (!allCallsRefreshed(firstVisit)) throw new Error("Not every catalog journey refreshed after the boundary.");
  console.log("Production journeys reuse and refresh server-only provider data without browser leakage.");
} finally {
  if (app && app.exitCode === null) {
    app.kill("SIGTERM");
    await Promise.race([once(app, "exit"), delay(2_000)]);
    if (app.exitCode === null) app.kill("SIGKILL");
  }
  await new Promise((resolve) => provider.close(() => resolve()));
}
