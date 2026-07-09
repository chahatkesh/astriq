import { describe, expect, it } from "vitest";
import { getDatabaseConfig } from "@/packages/database/src";

describe("getDatabaseConfig", () => {
  it("marks the database as unconfigured without DATABASE_URL", () => {
    expect(getDatabaseConfig({ APP_ENV: "test" })).toEqual({
      runtime: "test",
      url: "",
      ssl: false,
      isConfigured: false,
    });
  });

  it("uses production SSL for the production runtime", () => {
    expect(
      getDatabaseConfig({
        APP_ENV: "production",
        DATABASE_URL: "postgresql://example.invalid/app",
      }),
    ).toMatchObject({
      runtime: "production",
      ssl: true,
      isConfigured: true,
    });
  });

  it("rejects staging as a runtime contract", () => {
    expect(() => getDatabaseConfig({ APP_ENV: "staging" })).toThrow(
      /Expected development, test, or production/,
    );
  });
});
