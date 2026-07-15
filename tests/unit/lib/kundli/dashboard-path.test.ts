import { describe, expect, it } from "vitest";
import { getDashboardPath } from "@/lib/kundli/dashboard-path";

describe("getDashboardPath", () => {
  it("returns the locale dashboard path without query params", () => {
    expect(getDashboardPath("en")).toBe("/en/dashboard");
  });

  it("adds chart and draft query params when provided", () => {
    expect(
      getDashboardPath("hi", {
        chart: "chart-1",
        draft: "draft-token",
      }),
    ).toBe("/hi/dashboard?chart=chart-1&draft=draft-token");
  });

  it("supports chart-only deep links", () => {
    expect(getDashboardPath("mr", { chart: "chart-9" })).toBe(
      "/mr/dashboard?chart=chart-9",
    );
  });
});
