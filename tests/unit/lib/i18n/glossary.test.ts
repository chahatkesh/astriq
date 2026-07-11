import { describe, expect, it } from "vitest";
import { getGlossary, localizeTerm } from "@/lib/i18n/glossary";

describe("glossary", () => {
  it("localizes engine IDs into Hindi labels", () => {
    expect(localizeTerm("hi", "sun")).toBe("सूर्य");
    expect(localizeTerm("hi", "aries")).toBe("मेष");
    expect(localizeTerm("hi", "nakshatra")).toBe("नक्षत्र");
  });

  it("falls back to English for locales without a reviewed glossary", () => {
    expect(localizeTerm("ta", "moon")).toBe("Moon");
    expect(getGlossary("ta")).toEqual(getGlossary("en"));
  });

  it("echoes unknown term IDs so nothing renders empty", () => {
    expect(localizeTerm("en", "uranus")).toBe("uranus");
  });
});
