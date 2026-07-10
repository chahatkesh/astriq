import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const engineRoot = join(root, "services", "astrology-engine");
const binDir = join(engineRoot, "bin");
const compiler = process.env.CXX ?? "g++";
const commonFlags = ["-std=c++17", "-O2", "-Wall", "-Wextra", "-pedantic"];

mkdirSync(binDir, { recursive: true });

compile("kundli-engine", [
  join(engineRoot, "src", "main.cpp"),
  join(engineRoot, "src", "kundli_engine.cpp"),
]);

compile("kundli-engine-tests", [
  join(engineRoot, "tests", "kundli_engine_test.cpp"),
  join(engineRoot, "src", "kundli_engine.cpp"),
]);

function compile(name, sources) {
  const output = join(binDir, name);
  const result = spawnSync(
    compiler,
    [...commonFlags, ...sources, "-o", output],
    {
      cwd: root,
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
