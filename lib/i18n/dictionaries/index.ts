import type { LocaleCode } from "@/lib/i18n/locales";
import type { AppStringsOverrides } from "./types";
import { englishAppStrings } from "./en";
import { assameseAppStrings } from "./as";
import { bengaliAppStrings } from "./bn";
import { bodoAppStrings } from "./brx";
import { dogriAppStrings } from "./doi";
import { gujaratiAppStrings } from "./gu";
import { hindiAppStrings } from "./hi";
import { kannadaAppStrings } from "./kn";
import { kashmiriAppStrings } from "./ks";
import { konkaniAppStrings } from "./kok";
import { maithiliAppStrings } from "./mai";
import { malayalamAppStrings } from "./ml";
import { manipuriAppStrings } from "./mni";
import { marathiAppStrings } from "./mr";
import { nepaliAppStrings } from "./ne";
import { odiaAppStrings } from "./or";
import { punjabiAppStrings } from "./pa";
import { sanskritAppStrings } from "./sa";
import { santaliAppStrings } from "./sat";
import { sindhiAppStrings } from "./sd";
import { tamilAppStrings } from "./ta";
import { teluguAppStrings } from "./te";
import { urduAppStrings } from "./ur";

export const localeAppStringOverrides: Record<
  Exclude<LocaleCode, "en">,
  AppStringsOverrides
> = {
  as: assameseAppStrings,
  bn: bengaliAppStrings,
  brx: bodoAppStrings,
  doi: dogriAppStrings,
  gu: gujaratiAppStrings,
  hi: hindiAppStrings,
  kn: kannadaAppStrings,
  ks: kashmiriAppStrings,
  kok: konkaniAppStrings,
  mai: maithiliAppStrings,
  ml: malayalamAppStrings,
  mni: manipuriAppStrings,
  mr: marathiAppStrings,
  ne: nepaliAppStrings,
  or: odiaAppStrings,
  pa: punjabiAppStrings,
  sa: sanskritAppStrings,
  sat: santaliAppStrings,
  sd: sindhiAppStrings,
  ta: tamilAppStrings,
  te: teluguAppStrings,
  ur: urduAppStrings,
};

export { englishAppStrings };
export type { AppStringsDictionary, AppStringsOverrides } from "./types";
