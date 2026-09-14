import { createHash } from "node:crypto";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";
import { build } from "vite";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const outputRoot = path.join(root, "dist");
const packageDirectory = path.join(outputRoot, "isoline-player");
const version = "1.0.0";

function checksum(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function copyExamples() {
  const source = path.join(root, "examples", "isoline-player");
  const destination = path.join(packageDirectory, "example");
  await mkdir(destination, { recursive: true });
  for (const fileName of await readdir(source)) {
    await copyFile(path.join(source, fileName), path.join(destination, fileName));
  }
}

async function collectPackageFiles(directory, prefix = "") {
  const result = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      Object.assign(result, await collectPackageFiles(absolute, relative));
    } else {
      result[relative] = new Uint8Array(await readFile(absolute));
    }
  }
  return result;
}

await rm(packageDirectory, { force: true, recursive: true });
await mkdir(packageDirectory, { recursive: true });

await build({
  build: {
    emptyOutDir: false,
    lib: {
      entry: path.join(root, "src", "player", "isoline-player.ts"),
      fileName: () => "isoline-player.iife.js",
      formats: ["iife"],
      name: "IsolinePlayerBundle",
    },
    minify: "esbuild",
    outDir: packageDirectory,
    sourcemap: true,
  },
  configFile: false,
  logLevel: "warn",
});

await copyFile(
  path.join(root, "src", "player", "isoline-player.d.ts"),
  path.join(packageDirectory, "isoline-player.d.ts"),
);
await copyFile(
  path.join(root, "docs", "isoline-player.md"),
  path.join(packageDirectory, "README.md"),
);
await copyExamples();

const filesBeforeManifest = await collectPackageFiles(packageDirectory);
const manifest = {
  appId: "intermission-graphics",
  files: Object.fromEntries(
    Object.entries(filesBeforeManifest).map(([fileName, bytes]) => [
      fileName,
      { bytes: bytes.byteLength, sha256: checksum(bytes) },
    ]),
  ),
  playerVersion: version,
  protocolVersion: 1,
};
await writeFile(
  path.join(packageDirectory, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

const files = await collectPackageFiles(packageDirectory);
const archive = zipSync(files, { level: 9 });
const archivePath = path.join(outputRoot, `isoline-player-${version}.zip`);
await writeFile(archivePath, archive);

console.log(
  JSON.stringify({
    archive: path.relative(root, archivePath),
    archiveSha256: checksum(archive),
    files: Object.keys(files).length,
    output: path.relative(root, packageDirectory),
  }),
);
