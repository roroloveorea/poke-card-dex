import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";

const appPort = 3100;
const providerPort = 3199;
const credential = "e2e-server-only-secret";
let englishRetryFailures = 0;
let japaneseRetryFailures = 0;

const englishSet = (id, name, releaseDate) => ({ id, name, releaseDate, total: 100 });
const englishCards = [
  { id: "rocket-01", name: "Charizard", number: "01", images: {}, set: englishSet("rocket", "Team Rocket", "2025/04/01"), tcgplayer: { updatedAt: "2026/08/24", prices: { holofoil: { market: 50 } } } },
  { id: "rocket-02", name: "Charizard", number: "02", images: {}, set: englishSet("rocket", "Team Rocket", "2025/04/01") },
  { id: "rocket-ex-01", name: "Charizard ex", number: "01a", images: {}, set: englishSet("rocket-new", "Team Rocket Returns", "2026/04/01") },
  { id: "base-01", name: "Pikachu", number: "01", images: {}, set: englishSet("base", "Base Set", "1999/01/09") },
];
const japaneseSet = { code: "sv", name: "未来の一閃", releaseDate: "2025-01-01T00:00:00.000Z", cardCount: 100, printRegion: "EAST" };
const japaneseCard = { id: "jp-01", name: "ピカチュウex", number: "011", printedNumber: "011/100", gameCode: "pokemon_tcg", availableLanguages: ["ja"], set: { code: "sv", name: japaneseSet.name, printRegion: "EAST" } };

function send(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

const provider = createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://127.0.0.1:${providerPort}`);
  if (url.pathname === "/ecb.xml") {
    response.writeHead(200, { "Content-Type": "text/xml", "Last-Modified": "Mon, 24 Aug 2026 14:00:00 GMT" });
    response.end(`<?xml version="1.0"?><Envelope><Cube><Cube time="2026-08-24"><Cube currency="USD" rate="1.2"/><Cube currency="JPY" rate="180"/></Cube></Cube></Envelope>`);
    return;
  }
  if (!url.pathname.startsWith("/tcgdex/") && request.headers["x-api-key"] !== credential) return send(response, 401, {});

  if (url.pathname === "/v2/cards") {
    const query = url.searchParams.get("q") ?? "";
    if (query.includes("timeout")) return send(response, 504, { message: "provider timed out" });
    if (query.includes("retry") && englishRetryFailures++ < 5) return send(response, 503, {});
    const page = Number(url.searchParams.get("page") ?? "1");
    const cards = [...englishCards, englishCards[0]];
    return send(response, 200, { data: page === 1 ? cards : [], count: page === 1 ? cards.length : 0, totalCount: cards.length });
  }
  if (url.pathname === "/v2/sets") return send(response, 200, { data: [englishCards[2].set, englishCards[0].set, englishCards[3].set], count: 3, totalCount: 3 });
  if (url.pathname.startsWith("/v2/sets/")) {
    const id = url.pathname.split("/").at(-1);
    return send(response, 200, { data: englishCards.map((card) => card.set).find((set) => set.id === id) ?? englishCards[0].set });
  }
  if (url.pathname.startsWith("/v2/cards/")) return send(response, 200, { data: englishCards.find((card) => card.id === url.pathname.split("/").at(-1)) ?? englishCards[0] });

  if (url.pathname === "/api/v1/public/catalog/cards") {
    if (url.searchParams.get("q") === "timeout") return send(response, 504, { message: "provider timed out" });
    if (url.searchParams.get("q") === "retry" && japaneseRetryFailures++ < 1) return send(response, 503, {});
    return send(response, 200, { data: [japaneseCard], pagination: { limit: 100, offset: 0, total: 1, hasMore: false } });
  }
  if (url.pathname === "/api/v1/public/catalog/sets/sv") return send(response, 200, japaneseSet);
  if (url.pathname === "/api/v1/public/catalog/images") return send(response, 200, { data: [] });
  if (url.pathname === "/api/v1/public/prices/CARD/jp-01/current") return send(response, 200, { sources: [{ source: "YUYUTEI", variant: "LOWEST", language: "ja", price: 880, currency: "JPY", condition: "NEAR_MINT", printing: "NORMAL", grading: null, capturedAt: "2026-08-24T00:00:00.000Z" }] });
  return send(response, 404, {});
});

provider.listen(providerPort, "127.0.0.1");
await once(provider, "listening");

const environment = {
  ...process.env,
  POKEMON_TCG_API_KEY: credential,
  POKEMON_TCG_API_BASE_URL: `http://127.0.0.1:${providerPort}/v2`,
  RAREBIT_API_KEY: credential,
  RAREBIT_API_BASE_URL: `http://127.0.0.1:${providerPort}/api`,
  ECB_EXCHANGE_RATES_URL: `http://127.0.0.1:${providerPort}/ecb.xml`,
  CATALOG_REFRESH_SECONDS: "1",
};
const build = spawn("npm", ["run", "build"], { env: environment, stdio: "inherit" });
const [buildCode] = await once(build, "exit");
if (buildCode !== 0) {
  await new Promise((resolve) => provider.close(resolve));
  process.exit(buildCode ?? 1);
}

const app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(appPort)], {
  env: environment,
  stdio: "inherit",
});

async function close() {
  if (app.exitCode === null) app.kill("SIGTERM");
  await new Promise((resolve) => provider.close(resolve));
}

process.on("SIGINT", () => void close().finally(() => process.exit(0)));
process.on("SIGTERM", () => void close().finally(() => process.exit(0)));
const [code] = await once(app, "exit");
await close();
process.exit(code ?? 0);
