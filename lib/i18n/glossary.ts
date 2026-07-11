import { defaultLocale, type LocaleCode } from "@/lib/i18n/locales";

/**
 * Stable astrology glossary term identifiers.
 *
 * These IDs are the localization boundary for Vedic astrology vocabulary. The
 * calculation engine always emits stable English IDs (for example `sun`,
 * `aries`, `ashwini`); the UI maps those IDs to localized labels through this
 * glossary. Never translate the engine IDs themselves.
 */
export type GlossaryTermId =
  // Core concepts
  | "graha"
  | "rashi"
  | "lagna"
  | "bhava"
  | "nakshatra"
  | "pada"
  | "ayanamsha"
  | "retrograde"
  // Grahas (planets / luminaries / nodes)
  | "sun"
  | "moon"
  | "mars"
  | "mercury"
  | "jupiter"
  | "venus"
  | "saturn"
  | "rahu"
  | "ketu"
  // Rashis (zodiac signs)
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

export type GlossaryDictionary = Record<GlossaryTermId, string>;

const englishGlossary: GlossaryDictionary = {
  graha: "Graha",
  rashi: "Rashi",
  lagna: "Lagna",
  bhava: "Bhava",
  nakshatra: "Nakshatra",
  pada: "Pada",
  ayanamsha: "Ayanamsha",
  retrograde: "Retrograde",
  sun: "Sun",
  moon: "Moon",
  mars: "Mars",
  mercury: "Mercury",
  jupiter: "Jupiter",
  venus: "Venus",
  saturn: "Saturn",
  rahu: "Rahu",
  ketu: "Ketu",
  aries: "Aries",
  taurus: "Taurus",
  gemini: "Gemini",
  cancer: "Cancer",
  leo: "Leo",
  virgo: "Virgo",
  libra: "Libra",
  scorpio: "Scorpio",
  sagittarius: "Sagittarius",
  capricorn: "Capricorn",
  aquarius: "Aquarius",
  pisces: "Pisces",
};

const hindiGlossary: GlossaryDictionary = {
  graha: "ग्रह",
  rashi: "राशि",
  lagna: "लग्न",
  bhava: "भाव",
  nakshatra: "नक्षत्र",
  pada: "पाद",
  ayanamsha: "अयनांश",
  retrograde: "वक्री",
  sun: "सूर्य",
  moon: "चंद्र",
  mars: "मंगल",
  mercury: "बुध",
  jupiter: "गुरु",
  venus: "शुक्र",
  saturn: "शनि",
  rahu: "राहु",
  ketu: "केतु",
  aries: "मेष",
  taurus: "वृषभ",
  gemini: "मिथुन",
  cancer: "कर्क",
  leo: "सिंह",
  virgo: "कन्या",
  libra: "तुला",
  scorpio: "वृश्चिक",
  sagittarius: "धनु",
  capricorn: "मकर",
  aquarius: "कुंभ",
  pisces: "मीन",
};

const glossaries: Partial<Record<LocaleCode, GlossaryDictionary>> = {
  en: englishGlossary,
  hi: hindiGlossary,
};

/**
 * Resolve the glossary dictionary for a locale, falling back to English for
 * locales that do not yet have a reviewed astrology glossary.
 */
export function getGlossary(localeCode: LocaleCode): GlossaryDictionary {
  return glossaries[localeCode] ?? glossaries[defaultLocale] ?? englishGlossary;
}

/**
 * Look up a single localized term by its stable glossary ID. Unknown IDs echo
 * back the raw ID so new engine vocabulary never renders as empty text.
 */
export function localizeTerm(localeCode: LocaleCode, termId: string): string {
  const dictionary = getGlossary(localeCode);
  return dictionary[termId as GlossaryTermId] ?? termId;
}
