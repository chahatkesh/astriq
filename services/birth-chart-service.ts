import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type {
  AyanamshaMode,
  BirthChartFormPayload,
  BirthChartResult,
  EngineBackend,
  HouseSystem,
} from "@/lib/kundli/types";
import { normalizeBirthLocation } from "@/services/location-service";

type ValidationResult =
  | { ok: true; value: BirthChartFormPayload }
  | { ok: false; fields: Record<string, string> };

const localDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const localTimePattern = /^(\d{2}):(\d{2})$/;

export class BirthChartValidationError extends Error {
  readonly fields: Record<string, string>;

  constructor(fields: Record<string, string>) {
    super("Check the highlighted birth details.");
    this.name = "BirthChartValidationError";
    this.fields = fields;
  }
}

export class EngineExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EngineExecutionError";
  }
}

export async function generateBirthChart(payload: unknown) {
  const validation = validateBirthChartPayload(payload);

  if (!validation.ok) {
    throw new BirthChartValidationError(validation.fields);
  }

  let normalizedLocation;
  try {
    normalizedLocation = normalizeBirthLocation(validation.value);
  } catch (error) {
    throw new BirthChartValidationError({
      location:
        error instanceof Error
          ? error.message
          : "Birthplace details could not be normalized.",
    });
  }

  const chartInput = {
    ...validation.value,
    ...normalizedLocation,
    subjectName: validation.value.subjectName?.trim() || undefined,
    ayanamsha: validation.value.ayanamsha ?? "lahiri",
    houseSystem: validation.value.houseSystem ?? "whole_sign",
    engineBackend: validation.value.engineBackend ?? getDefaultEngineBackend(),
  };

  return runNativeEngine(chartInput);
}

export function validateBirthChartPayload(payload: unknown): ValidationResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      ok: false,
      fields: {
        form: "Send the birth details as a JSON object.",
      },
    };
  }

  const input = payload as Record<string, unknown>;
  const fields: Record<string, string> = {};
  const subjectName = optionalString(input.subjectName);
  const birthDate = requiredString(
    input.birthDate,
    "birthDate",
    "Date of birth",
    fields,
  );
  const birthTime = requiredString(
    input.birthTime,
    "birthTime",
    "Time of birth",
    fields,
  );
  const placeName = requiredString(
    input.placeName,
    "placeName",
    "Birthplace",
    fields,
  );
  const latitude = requiredNumber(
    input.latitude,
    "latitude",
    "Latitude",
    fields,
  );
  const longitude = requiredNumber(
    input.longitude,
    "longitude",
    "Longitude",
    fields,
  );
  const timeZone = requiredString(
    input.timeZone,
    "timeZone",
    "Time zone",
    fields,
  );
  const timezoneOffsetMinutes = optionalInteger(input.timezoneOffsetMinutes);
  const ayanamsha = optionalAyanamsha(input.ayanamsha, fields);
  const houseSystem = optionalHouseSystem(input.houseSystem, fields);
  const engineBackend = optionalEngineBackend(input.engineBackend, fields);

  if (birthDate && !localDatePattern.test(birthDate)) {
    fields.birthDate = "Use YYYY-MM-DD.";
  }

  if (birthTime && !localTimePattern.test(birthTime)) {
    fields.birthTime = "Use HH:mm in 24-hour time.";
  }

  if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
    fields.latitude = "Latitude must be from -90 to 90.";
  }

  if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
    fields.longitude = "Longitude must be from -180 to 180.";
  }

  if (
    input.timezoneOffsetMinutes !== undefined &&
    timezoneOffsetMinutes === undefined
  ) {
    fields.timezoneOffsetMinutes = "Time-zone offset must be whole minutes.";
  }

  if (timezoneOffsetMinutes !== undefined) {
    if (timezoneOffsetMinutes < -14 * 60 || timezoneOffsetMinutes > 14 * 60) {
      fields.timezoneOffsetMinutes =
        "Time-zone offset must be between UTC-14:00 and UTC+14:00.";
    }
  }

  if (Object.keys(fields).length > 0) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    value: {
      subjectName,
      birthDate: birthDate as string,
      birthTime: birthTime as string,
      placeName: placeName as string,
      latitude: latitude as number,
      longitude: longitude as number,
      timeZone: timeZone as string,
      timezoneOffsetMinutes,
      ayanamsha,
      houseSystem,
      engineBackend,
    },
  };
}

async function runNativeEngine(
  input: BirthChartFormPayload,
): Promise<BirthChartResult> {
  const enginePath = resolveEngineBinaryPath();
  const kernelDir = resolveSpiceKernelDir();

  if (!existsSync(enginePath)) {
    throw new EngineExecutionError(
      `Kundli engine binary not found at ${enginePath}. Run pnpm build:engine.`,
    );
  }

  if (
    !existsSync(join(kernelDir, "naif0012.tls")) ||
    !existsSync(join(kernelDir, "de442s.bsp"))
  ) {
    throw new EngineExecutionError(
      `JPL/SPICE kernels missing in ${kernelDir}. Run pnpm engine:deps.`,
    );
  }

  if (typeof input.timezoneOffsetMinutes !== "number") {
    throw new EngineExecutionError(
      "Timezone offset must be resolved before invoking the engine.",
    );
  }

  const payload = JSON.stringify({
    subjectName: input.subjectName,
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    placeName: input.placeName,
    latitude: input.latitude,
    longitude: input.longitude,
    timeZone: input.timeZone,
    timezoneOffsetMinutes: input.timezoneOffsetMinutes,
    ayanamsha: input.ayanamsha ?? "lahiri",
    houseSystem: input.houseSystem ?? "whole_sign",
    engineBackend: input.engineBackend ?? "jpl_spice",
  });

  const { stdout, stderr, exitCode } = await spawnEngine(
    enginePath,
    payload,
    kernelDir,
  );

  if (exitCode !== 0) {
    throw new EngineExecutionError(
      stderr.trim() ||
        `Kundli engine exited with code ${exitCode ?? "unknown"}.`,
    );
  }

  try {
    const chart = JSON.parse(stdout) as BirthChartResult;
    assertChartShape(chart);
    return chart;
  } catch (error) {
    throw new EngineExecutionError(
      error instanceof Error
        ? `Kundli engine returned invalid JSON: ${error.message}`
        : "Kundli engine returned invalid JSON.",
    );
  }
}

function spawnEngine(enginePath: string, payload: string, kernelDir: string) {
  return new Promise<{
    stdout: string;
    stderr: string;
    exitCode: number | null;
  }>((resolve, reject) => {
    const child = spawn(enginePath, [], {
      env: {
        ...process.env,
        KUNDLI_SPICE_KERNEL_DIR: kernelDir,
      },
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      reject(
        new EngineExecutionError(
          `Failed to start kundli engine: ${error.message}`,
        ),
      );
    });
    child.on("close", (exitCode) => {
      resolve({ stdout, stderr, exitCode });
    });

    child.stdin.write(payload);
    child.stdin.end();
  });
}

function assertChartShape(chart: BirthChartResult) {
  if (
    !chart ||
    typeof chart !== "object" ||
    !chart.metadata ||
    !Array.isArray(chart.planets) ||
    !Array.isArray(chart.houses) ||
    !chart.ascendant
  ) {
    throw new Error("Chart JSON is missing required fields.");
  }

  if (chart.metadata.engineBackend !== "jpl_spice") {
    throw new Error("Chart metadata.engineBackend must be jpl_spice.");
  }
}

function resolveEngineBinaryPath() {
  if (process.env.KUNDLI_ENGINE_BIN) {
    return process.env.KUNDLI_ENGINE_BIN;
  }

  return join(
    process.cwd(),
    "services",
    "astrology-engine",
    "bin",
    "kundli-engine",
  );
}

function resolveSpiceKernelDir() {
  if (process.env.KUNDLI_SPICE_KERNEL_DIR) {
    return process.env.KUNDLI_SPICE_KERNEL_DIR;
  }

  return join(process.cwd(), "services", "astrology-engine", "assets", "jpl");
}

function getDefaultEngineBackend(): EngineBackend {
  const configured = process.env.KUNDLI_ENGINE_BACKEND;

  if (!configured) {
    return "jpl_spice";
  }

  if (configured === "jpl_spice") {
    return configured;
  }

  throw new EngineExecutionError(
    `Unsupported KUNDLI_ENGINE_BACKEND "${configured}". Expected jpl_spice.`,
  );
}

function optionalAyanamsha(
  value: unknown,
  fields: Record<string, string>,
): AyanamshaMode | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value === "lahiri") {
    return value;
  }

  fields.ayanamsha = "Only Lahiri ayanamsha is currently supported.";
  return undefined;
}

function optionalHouseSystem(
  value: unknown,
  fields: Record<string, string>,
): HouseSystem | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value === "whole_sign") {
    return value;
  }

  fields.houseSystem = "Only whole sign houses are currently supported.";
  return undefined;
}

function optionalEngineBackend(
  value: unknown,
  fields: Record<string, string>,
): EngineBackend | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value === "jpl_spice") {
    return value;
  }

  fields.engineBackend = "Engine backend must be jpl_spice.";
  return undefined;
}

function requiredString(
  value: unknown,
  key: string,
  label: string,
  fields: Record<string, string>,
) {
  if (typeof value !== "string" || !value.trim()) {
    fields[key] = `${label} is required.`;
    return undefined;
  }

  return value.trim();
}

function requiredNumber(
  value: unknown,
  key: string,
  label: string,
  fields: Record<string, string>,
) {
  if (typeof value === "string" && !value.trim()) {
    fields[key] = `${label} must be a number.`;
    return undefined;
  }

  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numberValue)) {
    fields[key] = `${label} must be a number.`;
    return undefined;
  }

  return numberValue;
}

function optionalString(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return typeof value === "string" ? value.trim() || undefined : undefined;
}

function optionalInteger(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isInteger(numberValue) ? numberValue : undefined;
}
