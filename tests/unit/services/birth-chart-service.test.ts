import { describe, expect, it } from "vitest";
import {
  BirthChartValidationError,
  generateBirthChart,
  validateBirthChartPayload,
} from "@/services/birth-chart-service";

const delhiPayload = {
  subjectName: "Ada",
  birthDate: "1990-08-15",
  birthTime: "14:30",
  placeName: "Delhi, India",
  latitude: 28.6139,
  longitude: 77.209,
  timeZone: "Asia/Kolkata",
  ayanamsha: "lahiri",
  houseSystem: "whole_sign",
};

describe("generateBirthChart", () => {
  it("normalizes the location and returns C++ engine chart data", async () => {
    const chart = await generateBirthChart(delhiPayload);

    expect(chart.subjectName).toBe("Ada");
    expect(chart.metadata.utcIso).toBe("1990-08-15T09:00:00.000Z");
    expect(chart.metadata.timezoneOffsetMinutes).toBe(330);
    expect(chart.metadata.engineBackend).toBe("prototype");
    expect(chart.metadata.ayanamsha).toBe("lahiri");
    expect(chart.metadata.houseSystem).toBe("whole_sign");
    expect(chart.metadata.calculationProfile).toMatchObject({
      id: "vedic-lahiri-prototype-v1",
      precision: "prototype",
      ephemeris: "deterministic-low-precision-formulae",
      nodeModel: "Mean lunar nodes",
    });
    expect(chart.houses).toHaveLength(12);
    expect(chart.planets.map((planet) => planet.key)).toEqual([
      "sun",
      "moon",
      "mars",
      "mercury",
      "jupiter",
      "venus",
      "saturn",
      "rahu",
      "ketu",
    ]);
  });

  it("returns validation errors before invoking the engine", async () => {
    await expect(
      generateBirthChart({ ...delhiPayload, latitude: 91 }),
    ).rejects.toThrow(BirthChartValidationError);
  });

  it("validates requested engine backends", () => {
    expect(
      validateBirthChartPayload({
        ...delhiPayload,
        engineBackend: "jpl_spice",
      }),
    ).toMatchObject({
      ok: true,
      value: {
        engineBackend: "jpl_spice",
      },
    });

    expect(
      validateBirthChartPayload({
        ...delhiPayload,
        engineBackend: "paid_backend",
      }),
    ).toMatchObject({
      ok: false,
      fields: {
        engineBackend: "Engine backend must be prototype or jpl_spice.",
      },
    });
  });
});
