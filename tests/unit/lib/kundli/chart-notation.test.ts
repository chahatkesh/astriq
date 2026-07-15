import { describe, expect, it } from "vitest";
import {
  formatChartDegrees,
  formatChartNumber,
} from "@/lib/kundli/chart-notation";

describe("chart notation formatting", () => {
  it("uses stable Latin digits regardless of locale context", () => {
    expect(formatChartNumber(23)).toBe("23");
    expect(formatChartNumber(1)).toBe("1");
  });

  it("formats degrees and minutes with a fixed degree unit", () => {
    expect(formatChartDegrees(23.68, "deg")).toBe("23deg 41'");
  });
});
