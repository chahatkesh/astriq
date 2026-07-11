import { describe, expect, it } from "vitest";
import referenceFixture from "@/tests/fixtures/kundli/jpl-horizons-de441.json";
import { generateBirthChart } from "@/services/birth-chart-service";

type ReferenceBody = {
  tropicalLongitude: number;
  latitude: number;
  maxLongitudeErrorDegrees: number;
  maxLatitudeErrorDegrees: number;
};

describe("Kundli reference accuracy", () => {
  for (const referenceCase of referenceFixture.cases) {
    it(`keeps ${referenceCase.id} within ${referenceFixture.source.ephemeris} reference tolerances`, async () => {
      const chart = await generateBirthChart(referenceCase.input);

      expect(chart.metadata.utcIso).toBe(referenceCase.expected.utcIso);

      for (const [bodyKey, referenceBody] of Object.entries(
        referenceCase.expected.bodies,
      )) {
        const planet = chart.planets.find((item) => item.key === bodyKey);
        const expected = referenceBody as ReferenceBody;

        expect(planet, `Expected ${bodyKey} in chart output`).toBeDefined();

        if (!planet) {
          continue;
        }

        const longitudeError = angularDifferenceDegrees(
          planet.tropicalLongitude,
          expected.tropicalLongitude,
        );
        const latitudeError = Math.abs(planet.latitude - expected.latitude);

        expect(
          longitudeError,
          `${bodyKey} tropical longitude error in degrees`,
        ).toBeLessThanOrEqual(expected.maxLongitudeErrorDegrees);
        expect(
          latitudeError,
          `${bodyKey} ecliptic latitude error in degrees`,
        ).toBeLessThanOrEqual(expected.maxLatitudeErrorDegrees);
      }
    });
  }
});

function angularDifferenceDegrees(actual: number, expected: number) {
  const difference = Math.abs(actual - expected) % 360;
  return difference > 180 ? 360 - difference : difference;
}
