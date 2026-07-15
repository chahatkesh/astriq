import { defaultLocale, type LocaleCode } from "@/lib/i18n/locales";
import type { GlossaryDictionary, GlossaryTermId } from "./types";
import { englishGlossary } from "./en";
import { assameseGlossary } from "./as";
import { bengaliGlossary } from "./bn";
import { bodoGlossary } from "./brx";
import { dogriGlossary } from "./doi";
import { gujaratiGlossary } from "./gu";
import { hindiGlossary } from "./hi";
import { kannadaGlossary } from "./kn";
import { kashmiriGlossary } from "./ks";
import { konkaniGlossary } from "./kok";
import { maithiliGlossary } from "./mai";
import { malayalamGlossary } from "./ml";
import { manipuriGlossary } from "./mni";
import { marathiGlossary } from "./mr";
import { nepaliGlossary } from "./ne";
import { odiaGlossary } from "./or";
import { punjabiGlossary } from "./pa";
import { sanskritGlossary } from "./sa";
import { santaliGlossary } from "./sat";
import { sindhiGlossary } from "./sd";
import { tamilGlossary } from "./ta";
import { teluguGlossary } from "./te";
import { urduGlossary } from "./ur";

export const localeGlossaries: Record<LocaleCode, GlossaryDictionary> = {
  en: englishGlossary,
  as: assameseGlossary,
  bn: bengaliGlossary,
  brx: bodoGlossary,
  doi: dogriGlossary,
  gu: gujaratiGlossary,
  hi: hindiGlossary,
  kn: kannadaGlossary,
  ks: kashmiriGlossary,
  kok: konkaniGlossary,
  mai: maithiliGlossary,
  ml: malayalamGlossary,
  mni: manipuriGlossary,
  mr: marathiGlossary,
  ne: nepaliGlossary,
  or: odiaGlossary,
  pa: punjabiGlossary,
  sa: sanskritGlossary,
  sat: santaliGlossary,
  sd: sindhiGlossary,
  ta: tamilGlossary,
  te: teluguGlossary,
  ur: urduGlossary,
};

/**
 * Resolve the glossary dictionary for a locale, falling back to English for
 * unknown locale codes outside the registered locale set.
 */
export function getGlossary(localeCode: LocaleCode): GlossaryDictionary {
  return (
    localeGlossaries[localeCode] ??
    localeGlossaries[defaultLocale] ??
    englishGlossary
  );
}

/**
 * Look up a single localized term by its stable glossary ID. Unknown IDs echo
 * back the raw ID so new engine vocabulary never renders as empty text.
 */
export function localizeTerm(localeCode: LocaleCode, termId: string): string {
  const dictionary = getGlossary(localeCode);
  return dictionary[termId as GlossaryTermId] ?? termId;
}

export type { GlossaryDictionary, GlossaryTermId } from "./types";
