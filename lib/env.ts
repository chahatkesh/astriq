import {
  appConfig,
  getAppEnvironment,
  type EnvironmentRecord,
} from "@/lib/app-config";

export function getRequiredEnv(
  name: string,
  env: EnvironmentRecord = process.env,
) {
  const value = env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const publicEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? appConfig.name,
} as const;

export const env = {
  appEnvironment: getAppEnvironment(),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL,
} as const;

export function getAuthSessionSecret(
  envRecord: EnvironmentRecord = process.env,
) {
  const configured = envRecord.AUTH_SESSION_SECRET?.trim();

  if (configured) {
    return configured;
  }

  const runtime = getAppEnvironment(envRecord);
  if (runtime === "production") {
    throw new Error("AUTH_SESSION_SECRET is required in production.");
  }

  return "birth-chart-dev-session-secret";
}

export function getMaxChartsPerUser(
  envRecord: EnvironmentRecord = process.env,
) {
  const configured = envRecord.MAX_CHARTS_PER_USER?.trim();

  if (!configured) {
    return 3;
  }

  const parsed = Number(configured);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error("MAX_CHARTS_PER_USER must be a positive integer.");
  }

  return parsed;
}
