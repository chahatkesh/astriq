import { describe, expect, it } from "vitest";
import { getLocaleFontFamily } from "@/lib/i18n/fonts";
import { localeCodes } from "@/lib/i18n/locales";

describe("fonts", () => {
  it("returns a script font stack for every non-English locale", () => {
    for (const localeCode of localeCodes) {
      if (localeCode === "en") {
        expect(getLocaleFontFamily(localeCode)).toBeUndefined();
        continue;
      }

      expect(getLocaleFontFamily(localeCode)).toMatch(/^var\(--font-noto-/);
    }
  });
});
