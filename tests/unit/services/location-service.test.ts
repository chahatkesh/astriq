import { describe, expect, it } from "vitest";
import {
  normalizeBirthLocation,
  resolveTimeZoneOffsetMinutes,
} from "@/services/location-service";

describe("resolveTimeZoneOffsetMinutes", () => {
  it("resolves a fixed historical offset for Asia/Kolkata", () => {
    expect(
      resolveTimeZoneOffsetMinutes("1990-08-15", "14:30", "Asia/Kolkata"),
    ).toBe(330);
  });

  it("resolves daylight-saving offsets for America/New_York", () => {
    expect(
      resolveTimeZoneOffsetMinutes("2024-01-15", "12:00", "America/New_York"),
    ).toBe(-300);
    expect(
      resolveTimeZoneOffsetMinutes("2024-07-15", "12:00", "America/New_York"),
    ).toBe(-240);
  });

  it("rejects nonexistent local times during daylight-saving gaps", () => {
    expect(() =>
      resolveTimeZoneOffsetMinutes("2024-03-10", "02:30", "America/New_York"),
    ).toThrow(/does not exist/);
  });

  it("rejects ambiguous local times during daylight-saving overlaps", () => {
    expect(() =>
      resolveTimeZoneOffsetMinutes("2024-11-03", "01:30", "America/New_York"),
    ).toThrow(/ambiguous/);
  });
});

describe("normalizeBirthLocation", () => {
  it("normalizes location coordinates and computes the birth offset", () => {
    expect(
      normalizeBirthLocation({
        birthDate: "1990-08-15",
        birthTime: "14:30",
        placeName: " Delhi, India ",
        latitude: 28.6139123,
        longitude: 77.2090456,
        timeZone: "Asia/Kolkata",
      }),
    ).toEqual({
      placeName: "Delhi, India",
      latitude: 28.613912,
      longitude: 77.209046,
      timeZone: "Asia/Kolkata",
      timezoneOffsetMinutes: 330,
    });
  });

  it("rejects unknown IANA time zones", () => {
    expect(() =>
      normalizeBirthLocation({
        birthDate: "1990-08-15",
        birthTime: "14:30",
        placeName: "Delhi, India",
        latitude: 28.6139,
        longitude: 77.209,
        timeZone: "Not/AZone",
      }),
    ).toThrow(/valid IANA time zone/);
  });

  it("accepts a manual offset for ambiguous clock-change times", () => {
    expect(
      normalizeBirthLocation({
        birthDate: "2024-11-03",
        birthTime: "01:30",
        placeName: "New York, United States",
        latitude: 40.7128,
        longitude: -74.006,
        timeZone: "America/New_York",
        timezoneOffsetMinutes: -300,
      }),
    ).toMatchObject({
      timeZone: "America/New_York",
      timezoneOffsetMinutes: -300,
    });
  });
});
