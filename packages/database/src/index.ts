import type { DatabaseConnectionConfig, DatabaseRuntime } from "./types";

type EnvironmentRecord = Record<string, string | undefined>;

function normalizeRuntime(value: string | undefined): DatabaseRuntime {
  if (value === "production" || value === "test" || value === "development") {
    return value;
  }

  if (!value) {
    return "development";
  }

  throw new Error(
    `Unsupported database runtime "${value}". Expected development, test, or production.`,
  );
}

export function getDatabaseConfig(
  env: EnvironmentRecord = process.env,
): DatabaseConnectionConfig {
  const runtime = normalizeRuntime(env.APP_ENV ?? env.NODE_ENV);
  const url = env.DATABASE_URL ?? "";

  return {
    runtime,
    url,
    ssl: runtime === "production",
    isConfigured: url.length > 0,
  };
}

export type { DatabaseConnectionConfig, DatabaseRuntime } from "./types";
