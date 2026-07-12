import { describe, expect, it } from "vitest";
import { AppStrings } from "@/lib/i18n/app-strings";
import { localeCodes } from "@/lib/i18n/locales";

describe("AppStrings", () => {
  it("returns English strings for the default locale", () => {
    const strings = AppStrings.forLocale("en");

    expect(strings.app.title).toBe("Birth Chart Generator");
    expect(strings.form.submit).toBe("Generate Kundli");
  });

  it("applies Hindi locale overrides", () => {
    const strings = AppStrings.forLocale("hi");

    expect(strings.app.title).toBe("जन्म कुंडली जनरेटर");
    expect(strings.table.retrograde).toBe("वक्री");
  });

  it("uses dedicated Marathi copy for mr locale", () => {
    const strings = AppStrings.forLocale("mr");
    const hindi = AppStrings.forLocale("hi");

    expect(strings.form.submit).toBe("कुंडली तयार करा");
    expect(strings.form.submit).not.toBe(hindi.form.submit);
  });

  it("provides localized dictionaries for all supported locale codes", () => {
    const english = AppStrings.forLocale("en");

    for (const localeCode of localeCodes) {
      if (localeCode === "en") {
        continue;
      }

      const strings = AppStrings.forLocale(localeCode);
      expect(strings.app.language).not.toBe(english.app.language);
      expect(strings.form.submit).not.toBe(english.form.submit);
    }
  });
});
