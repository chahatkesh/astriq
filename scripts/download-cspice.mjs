import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  createReadStream,
} from "node:fs";
import { rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { tmpdir } from "node:os";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const vendorRoot = join(root, "services", "astrology-engine", "vendor");
const cspiceRoot = join(vendorRoot, "cspice");
const force = process.argv.includes("--force");
const dryRun = process.argv.includes("--dry-run");

const platformKey = resolvePlatformKey();
const packageUrl = `https://naif.jpl.nasa.gov/pub/naif/toolkit/C/${platformKey}/packages/cspice.tar.Z`;

mkdirSync(vendorRoot, { recursive: true });

const libraryPath = join(cspiceRoot, "lib", "cspice.a");
const headerPath = join(cspiceRoot, "include", "SpiceUsr.h");

if (!force && existsSync(libraryPath) && existsSync(headerPath)) {
  const manifest = await describeExisting();
  await writeFile(
    join(vendorRoot, "cspice-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(`CSPICE already present at ${cspiceRoot}`);
  process.exit(0);
}

if (dryRun) {
  const manifest = {
    generatedAt: new Date().toISOString(),
    platformKey,
    packageUrl,
    status: existsSync(libraryPath) ? "existing" : "missing",
    destination: cspiceRoot,
  };
  await writeFile(
    join(vendorRoot, "cspice-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(
    `CSPICE dry run wrote ${join(vendorRoot, "cspice-manifest.json")}`,
  );
  process.exit(0);
}

const archivePath = join(tmpdir(), `cspice-${platformKey}.tar.Z`);
console.log(`Downloading ${packageUrl}`);
await downloadFile(packageUrl, archivePath);

if (existsSync(cspiceRoot)) {
  rmSync(cspiceRoot, { recursive: true, force: true });
}

const extractDir = join(tmpdir(), `cspice-extract-${Date.now()}`);
mkdirSync(extractDir, { recursive: true });

const extractCommands = [
  ["tar", ["-xzf", archivePath, "-C", extractDir]],
  ["tar", ["-xf", archivePath, "-C", extractDir]],
  [
    "bash",
    [
      "-lc",
      `gzip -dc ${JSON.stringify(archivePath)} | tar -xf - -C ${JSON.stringify(extractDir)}`,
    ],
  ],
  [
    "bash",
    [
      "-lc",
      `uncompress -c ${JSON.stringify(archivePath)} | tar -xf - -C ${JSON.stringify(extractDir)}`,
    ],
  ],
];

let extracted = null;
for (const [command, args] of extractCommands) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) {
    continue;
  }
  extracted = findCspiceRoot(extractDir);
  if (extracted) {
    break;
  }
}

if (!extracted) {
  console.error("Failed to extract CSPICE archive.");
  process.exit(1);
}

mkdirSync(vendorRoot, { recursive: true });
await rename(extracted, cspiceRoot);

const manifest = {
  generatedAt: new Date().toISOString(),
  platformKey,
  packageUrl,
  status: "downloaded",
  destination: cspiceRoot,
  library: libraryPath,
  sha256: await sha256File(libraryPath),
  sizeBytes: statSync(libraryPath).size,
};

await writeFile(
  join(vendorRoot, "cspice-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(`CSPICE ready at ${cspiceRoot}`);

function resolvePlatformKey() {
  if (process.platform === "linux" && process.arch === "x64") {
    return "PC_Linux_GCC_64bit";
  }

  if (process.platform === "linux" && process.arch === "arm64") {
    // NAIF does not ship a dedicated aarch64 Linux package; CI uses x64.
    throw new Error(
      "No official NAIF CSPICE package for Linux arm64. Build on x64 Linux or provide vendor/cspice manually.",
    );
  }

  if (process.platform === "darwin" && process.arch === "arm64") {
    return "MacM1_OSX_clang_64bit";
  }

  if (process.platform === "darwin" && process.arch === "x64") {
    return "MacIntel_OSX_AppleC_64bit";
  }

  throw new Error(
    `Unsupported platform for CSPICE download: ${process.platform}/${process.arch}`,
  );
}

async function downloadFile(url, destination) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(
      `Failed to download ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const temporaryPath = `${destination}.part`;
  const fileStream = createWriteStream(temporaryPath);
  await finished(Readable.fromWeb(response.body).pipe(fileStream));
  await rename(temporaryPath, destination);
}

function findCspiceRoot(directory) {
  const direct = join(directory, "cspice");
  if (existsSync(join(direct, "include", "SpiceUsr.h"))) {
    return direct;
  }

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const nested = findCspiceRoot(join(directory, entry.name));
    if (nested) {
      return nested;
    }
  }

  return null;
}

async function sha256File(path) {
  const hash = createHash("sha256");
  const stream = createReadStream(path);
  await finished(
    stream.on("data", (chunk) => {
      hash.update(chunk);
    }),
  );
  return hash.digest("hex");
}

async function describeExisting() {
  return {
    generatedAt: new Date().toISOString(),
    platformKey,
    packageUrl,
    status: "existing",
    destination: cspiceRoot,
    library: libraryPath,
    sha256: await sha256File(libraryPath),
    sizeBytes: statSync(libraryPath).size,
  };
}
