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
