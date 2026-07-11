import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type {
  AyanamshaMode,
  BirthChartFormPayload,
  BirthChartResult,
  HouseSystem,
} from "@/lib/kundli/types";
import { normalizeBirthLocation } from "@/services/location-service";

type ValidationResult =
  | { ok: true; value: BirthChartFormPayload }
  | { ok: false; fields: Record<string, string> };

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
  const engineInput = {
    ...validation.value,
    ...normalizedLocation,
    subjectName: validation.value.subjectName?.trim() || undefined,
    ayanamsha: validation.value.ayanamsha ?? "lahiri",
    houseSystem: validation.value.houseSystem ?? "whole_sign",
  };

  return runKundliEngine(engineInput);
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

  if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    fields.birthDate = "Use YYYY-MM-DD.";
  }

  if (birthTime && !/^\d{2}:\d{2}$/.test(birthTime)) {
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
    },
  };
}

function runKundliEngine(input: BirthChartFormPayload) {
  return new Promise<BirthChartResult>((resolve, reject) => {
    const enginePath = getKundliEnginePath();

    if (!existsSync(enginePath)) {
      reject(
        new EngineExecutionError(
          `Kundli engine binary is missing at ${enginePath}. Run pnpm build:engine.`,
        ),
      );
      return;
    }

    const child = spawn(enginePath, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new EngineExecutionError("Kundli engine timed out."));
    }, 8_000);

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
      clearTimeout(timeout);
      reject(new EngineExecutionError(error.message));
    });

    child.on("close", (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        reject(
          new EngineExecutionError(
            stderr.trim() ||
              `Kundli engine exited with code ${code ?? "null"}.`,
          ),
        );
        return;
      }

      try {
        resolve(JSON.parse(stdout) as BirthChartResult);
      } catch (error) {
        reject(
          new EngineExecutionError(
            error instanceof Error
              ? `Kundli engine returned invalid JSON: ${error.message}`
              : "Kundli engine returned invalid JSON.",
          ),
        );
      }
    });

    child.stdin.end(JSON.stringify(input));
  });
}

function getKundliEnginePath() {
  return (
    process.env.KUNDLI_ENGINE_PATH ??
    join(process.cwd(), "services", "astrology-engine", "bin", "kundli-engine")
  );
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

function optionalString(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return typeof value === "string" ? value.trim() || undefined : undefined;
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

function optionalInteger(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isInteger(numberValue) ? numberValue : undefined;
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
