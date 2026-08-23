import { readdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const roots = [".next/static", ".next/server/app"];
const browserExtensions = new Set([".js", ".html", ".rsc"]);
const forbidden = [process.env.BROWSER_SAFETY_MARKER, "api.pokemontcg.io", "X-Api-Key", "set.id:"]
  .filter(Boolean);

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  }))).flat();
}

for (const root of roots) {
  for (const path of await filesBelow(root)) {
    if (!browserExtensions.has(extname(path))) continue;
    const contents = await readFile(path, "utf8");
    const leaked = forbidden.find((value) => contents.includes(value));
    if (leaked) throw new Error(`Browser artifact ${path} contains forbidden server-only data: ${leaked}`);
  }
}

console.log("Browser artifacts contain no provider credential, API endpoint, header, or query syntax.");
