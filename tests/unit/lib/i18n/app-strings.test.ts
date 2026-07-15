import { describe, expect, it } from "vitest";
import { AppStrings, formatAppString } from "@/lib/i18n/app-strings";
import { localeCodes } from "@/lib/i18n/locales";

describe("AppStrings", () => {
  it("returns English strings for the default locale", () => {
    const strings = AppStrings.forLocale("en");

    expect(strings.app.title).toBe("Astriq");
    expect(strings.form.submit).toBe("Generate kundli");
    expect(strings.landing.generate).toBe("Generate kundli");
    expect(strings.landing.workspaceEyebrow).toBe("Kundli workspace");
    expect(strings.auth.signInTitle).toBe("Sign in");
    expect(strings.account.logout).toBe("Log out");
    expect(strings.history.title).toBe("Saved kundlis");
    expect(strings.states.chartNotFound).toBe(
      "That saved kundli could not be found.",
    );
  });

  it("applies Hindi locale overrides across all sections", () => {
    const strings = AppStrings.forLocale("hi");

    expect(strings.app.title).toBe("Astriq");
    expect(strings.table.retrograde).toBe("वक्री");
    expect(strings.landing.signIn).toBe("साइन इन");
    expect(strings.auth.registerTitle).toBe("खाता बनाएँ");
    expect(strings.account.logout).toBe("लॉग आउट");
    expect(strings.history.empty).toBe("अभी कोई सहेजी हुई कुंडली नहीं है।");
    expect(strings.form.chartName).toBe("कुंडली का नाम");
    expect(strings.chart.downloadPdf).toBe("PDF डाउनलोड करें");
  });

  it("uses dedicated Marathi copy for mr locale", () => {
    const strings = AppStrings.forLocale("mr");
    const hindi = AppStrings.forLocale("hi");

    expect(strings.form.submit).toBe("कुंडली तयार करा");
    expect(strings.form.submit).not.toBe(hindi.form.submit);
    expect(strings.landing.generate).toBe("कुंडली तयार करा");
  });

  it("uses dedicated copy for former alias locales", () => {
    const hindi = AppStrings.forLocale("hi");
    const bengali = AppStrings.forLocale("bn");
    const urdu = AppStrings.forLocale("ur");

    expect(AppStrings.forLocale("sa").form.submit).not.toBe(hindi.form.submit);
    expect(AppStrings.forLocale("ne").form.submit).not.toBe(hindi.form.submit);
    expect(AppStrings.forLocale("as").form.submit).not.toBe(
      bengali.form.submit,
    );
    expect(AppStrings.forLocale("ks").form.submit).not.toBe(urdu.form.submit);
    expect(AppStrings.forLocale("sd").form.submit).not.toBe(urdu.form.submit);
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
      expect(strings.landing.headline).not.toBe(english.landing.headline);
      expect(strings.auth.signInTitle).not.toBe(english.auth.signInTitle);
      expect(strings.account.logout).not.toBe(english.account.logout);
      expect(strings.history.title).not.toBe(english.history.title);
      expect(strings.chart.downloadPdf).not.toBe(english.chart.downloadPdf);
    }
  });

  it("formats template placeholders", () => {
    expect(formatAppString("Welcome, {name}", { name: "Chahat" })).toBe(
      "Welcome, Chahat",
    );
    expect(
      formatAppString("{used} of {limit} kundlis used.", {
        used: 2,
        limit: 5,
      }),
    ).toBe("2 of 5 kundlis used.");
  });
});
