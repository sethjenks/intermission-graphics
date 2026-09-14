import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const resources = path.join(
  root,
  "ios",
  "IsolinePlayerHarness",
  "IsolinePlayerHarness",
  "Resources",
);

await mkdir(resources, { recursive: true });
await copyFile(
  path.join(root, "dist", "isoline-player", "isoline-player.iife.js"),
  path.join(resources, "isoline-player.iife.js"),
);
await copyFile(
  path.join(root, "examples", "isoline-player", "settings.json"),
  path.join(resources, "settings.json"),
);

console.log(path.relative(root, resources));
