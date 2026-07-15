import { describe, expect, it } from "vitest";
import { getGlossary, localizeTerm } from "@/lib/i18n/glossary";
import { localeCodes } from "@/lib/i18n/locales";

describe("glossary", () => {
  it("localizes engine IDs into Hindi labels", () => {
    expect(localizeTerm("hi", "sun")).toBe("सूर्य");
    expect(localizeTerm("hi", "aries")).toBe("मेष");
    expect(localizeTerm("hi", "nakshatra")).toBe("नक्षत्र");
  });

  it("localizes glossary terms for all supported locales", () => {
    for (const localeCode of localeCodes) {
      if (localeCode === "en") {
        continue;
      }

      expect(localizeTerm(localeCode, "sun")).not.toBe("Sun");
      expect(getGlossary(localeCode)).toBeTruthy();
    }
  });

  it("uses a dedicated Marathi glossary dictionary", () => {
    expect(localizeTerm("mr", "rashi")).toBe("राशी");
    expect(getGlossary("mr")).not.toBe(getGlossary("hi"));
  });

  it("uses dedicated glossaries for former alias locales", () => {
    expect(localizeTerm("sa", "sun")).toBe("सूर्यः");
    expect(localizeTerm("sa", "sun")).not.toBe(localizeTerm("hi", "sun"));
    expect(getGlossary("as")).not.toBe(getGlossary("bn"));
    expect(localizeTerm("ks", "sun")).not.toBe(localizeTerm("ur", "sun"));
    expect(localizeTerm("sd", "sun")).not.toBe(localizeTerm("ur", "sun"));
  });

  it("echoes unknown term IDs so nothing renders empty", () => {
    expect(localizeTerm("en", "uranus")).toBe("uranus");
  });
});
