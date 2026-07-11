import type { LocaleCode } from "@/lib/i18n/locales";

/**
 * Script families used to pick an appropriate Indic webfont per locale.
 *
 * The font foundation ships a curated set of Noto Sans scripts. Locales whose
 * script is not yet bundled fall back to the base Latin UI font, so adding a
 * new script only requires wiring one more `next/font` variable here and in the
 * root layout.
 */
export type FontScript =
  | "latin"
  | "devanagari"
  | "bengali"
  | "gujarati"
  | "gurmukhi"
  | "kannada"
  | "malayalam"
  | "oriya"
  | "tamil"
  | "telugu"
  | "arabic";

const localeScripts: Record<LocaleCode, FontScript> = {
  en: "latin",
  as: "bengali",
  bn: "bengali",
  brx: "devanagari",
  doi: "devanagari",
  gu: "gujarati",
  hi: "devanagari",
  kn: "kannada",
  ks: "arabic",
  kok: "devanagari",
  mai: "devanagari",
  ml: "malayalam",
  mni: "bengali",
  mr: "devanagari",
  ne: "devanagari",
  or: "oriya",
  pa: "gurmukhi",
  sa: "devanagari",
  sat: "devanagari",
  sd: "arabic",
  ta: "tamil",
  te: "telugu",
  ur: "arabic",
};

/**
 * CSS custom properties registered in the root layout for each bundled script.
 * The value is `var(--font-*)` so the class can be composed with the base font.
 */
const scriptFontVariables: Record<FontScript, string | null> = {
  latin: null,
  devanagari: "var(--font-noto-devanagari)",
  bengali: "var(--font-noto-bengali)",
  gujarati: null,
  gurmukhi: null,
  kannada: null,
  malayalam: null,
  oriya: null,
  tamil: null,
  telugu: null,
  arabic: null,
};

export function getFontScript(localeCode: LocaleCode): FontScript {
  return localeScripts[localeCode] ?? "latin";
}

/**
 * Inline `font-family` stack for a locale, prepending the bundled script font
 * (when available) ahead of the base UI font variable.
 */
export function getLocaleFontFamily(
  localeCode: LocaleCode,
): string | undefined {
  const scriptFont = scriptFontVariables[getFontScript(localeCode)];

  if (!scriptFont) {
    return undefined;
  }

  return `${scriptFont}, var(--font-geist-sans), sans-serif`;
}
