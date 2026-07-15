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
  | "arabic"
  | "olChiki"
  | "meeteiMayek";

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
  mni: "meeteiMayek",
  mr: "devanagari",
  ne: "devanagari",
  or: "oriya",
  pa: "gurmukhi",
  sa: "devanagari",
  sat: "olChiki",
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
  gujarati: "var(--font-noto-gujarati)",
  gurmukhi: "var(--font-noto-gurmukhi)",
  kannada: "var(--font-noto-kannada)",
  malayalam: "var(--font-noto-malayalam)",
  oriya: "var(--font-noto-oriya)",
  tamil: "var(--font-noto-tamil)",
  telugu: "var(--font-noto-telugu)",
  arabic: "var(--font-noto-arabic)",
  olChiki: "var(--font-noto-ol-chiki)",
  meeteiMayek: "var(--font-noto-meetei-mayek)",
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
