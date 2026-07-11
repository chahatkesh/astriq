import { describe, expect, it } from "vitest";
import { findPlaceById, searchPlaces } from "@/services/location-service";

describe("searchPlaces", () => {
  it("returns no candidates for short queries", () => {
    const result = searchPlaces("d");
    expect(result.candidates).toHaveLength(0);
    expect(result.ambiguous).toBe(false);
  });

  it("ranks the most populous exact match first with its time zone", () => {
    const result = searchPlaces("Delhi");
    const first = result.candidates[0];

    expect(first?.name).toBe("Delhi");
    expect(first?.timeZone).toBe("Asia/Kolkata");
    expect(first?.countryCode).toBe("IN");
    expect(first?.label).toContain("India");
  });

  it("derives the time zone from coordinates for global cities", () => {
    const result = searchPlaces("Kathmandu");
    const first = result.candidates[0];

    expect(first?.name).toBe("Kathmandu");
    expect(first?.timeZone).toBe("Asia/Kathmandu");
  });

  it("flags ambiguous queries with multiple matching places", () => {
    const result = searchPlaces("Hyderabad");

    expect(result.candidates.length).toBeGreaterThan(1);
    expect(result.ambiguous).toBe(true);
    expect(result.candidates.map((candidate) => candidate.countryCode)).toEqual(
      expect.arrayContaining(["IN", "PK"]),
    );
  });

  it("is deterministic and case-insensitive", () => {
    expect(searchPlaces("LONDON").candidates).toEqual(
      searchPlaces("london").candidates,
    );
  });

  it("caps the number of returned candidates", () => {
    expect(searchPlaces("san").candidates.length).toBeLessThanOrEqual(8);
  });
});

describe("findPlaceById", () => {
  it("round-trips an id returned from search", () => {
    const candidate = searchPlaces("Kathmandu").candidates[0];
    expect(candidate).toBeDefined();

    const found = findPlaceById(candidate!.id);
    expect(found).toMatchObject({
      name: candidate!.name,
      timeZone: candidate!.timeZone,
      latitude: candidate!.latitude,
      longitude: candidate!.longitude,
    });
  });

  it("returns null for an unknown id", () => {
    expect(findPlaceById("nonexistent-id")).toBeNull();
  });
});
