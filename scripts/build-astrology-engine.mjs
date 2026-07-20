import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const engineRoot = join(root, "services", "astrology-engine");
const binDir = join(engineRoot, "bin");
const cspiceRoot = join(engineRoot, "vendor", "cspice");
const cspiceInclude = join(cspiceRoot, "include");
const cspiceLibDir = join(cspiceRoot, "lib");
const cspiceLib = join(cspiceLibDir, "cspice.a");
const compiler = process.env.CXX ?? "g++";
const commonFlags = ["-std=c++17", "-O2", "-Wall", "-Wextra", "-pedantic"];

if (!existsSync(cspiceLib) || !existsSync(join(cspiceInclude, "SpiceUsr.h"))) {
  console.error(
    "CSPICE toolkit is missing. Run: pnpm cspice:download\n" +
      `Expected library at ${cspiceLib}`,
  );
  process.exit(1);
}

mkdirSync(binDir, { recursive: true });

const sources = [
  join(engineRoot, "src", "main.cpp"),
  join(engineRoot, "src", "kundli_engine.cpp"),
  join(engineRoot, "src", "spice_ephemeris.cpp"),
];

const testSources = [
  join(engineRoot, "tests", "kundli_engine_test.cpp"),
  join(engineRoot, "src", "kundli_engine.cpp"),
  join(engineRoot, "src", "spice_ephemeris.cpp"),
];

// NAIF ships `cspice.a` (not `libcspice.a`), so pass the archive path directly.
const linkFlags = [`-I${cspiceInclude}`, cspiceLib, "-lm"];

compile("kundli-engine", sources);
compile("kundli-engine-tests", testSources);

function compile(name, inputSources) {
  const output = join(binDir, name);
  const result = spawnSync(
    compiler,
    [...commonFlags, ...inputSources, ...linkFlags, "-o", output],
    {
      cwd: root,
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
