import { createHash } from "node:crypto";
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  statSync,
} from "node:fs";
import { rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const assetDir = join(root, "services", "astrology-engine", "assets", "jpl");
const force = process.argv.includes("--force");
const dryRun = process.argv.includes("--dry-run");

const assets = [
  {
    fileName: "naif0012.tls",
    label: "NAIF leap-second kernel",
    url: "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls",
  },
  {
    fileName: "de442s.bsp",
    label: "JPL DE442s planetary and lunar SPK kernel",
    url: "https://naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/de442s.bsp",
  },
];

mkdirSync(assetDir, { recursive: true });

const manifest = {
  generatedAt: new Date().toISOString(),
  source: "NASA/JPL NAIF generic kernels",
  assets: [],
};

for (const asset of assets) {
  const destination = join(assetDir, asset.fileName);

  if (dryRun) {
    manifest.assets.push({
      fileName: asset.fileName,
      label: asset.label,
      url: asset.url,
      status: existsSync(destination) ? "existing" : "missing",
      destination,
    });
    continue;
  }

  if (!force && existsSync(destination) && statSync(destination).size > 0) {
    manifest.assets.push(await describeAsset(asset, destination, "existing"));
    continue;
  }

  await downloadAsset(asset.url, destination);
  manifest.assets.push(await describeAsset(asset, destination, "downloaded"));
}

await writeFile(
  join(assetDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

if (dryRun) {
  console.log(
    `JPL/SPICE asset dry run wrote ${join(assetDir, "manifest.json")}`,
  );
} else {
  console.log(`JPL/SPICE assets are ready in ${assetDir}`);
}

async function downloadAsset(url, destination) {
  console.log(`Downloading ${url}`);

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

async function describeAsset(asset, path, status) {
  const hash = createHash("sha256");
  const stream = createReadStream(path);

  await finished(
    stream.on("data", (chunk) => {
      hash.update(chunk);
    }),
  );

  return {
    fileName: asset.fileName,
    label: asset.label,
    url: asset.url,
    status,
    sizeBytes: statSync(path).size,
    sha256: hash.digest("hex"),
  };
}
