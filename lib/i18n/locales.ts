export type LocaleCode =
  | "en"
  | "as"
  | "bn"
  | "brx"
  | "doi"
  | "gu"
  | "hi"
  | "kn"
  | "ks"
  | "kok"
  | "mai"
  | "ml"
  | "mni"
  | "mr"
  | "ne"
  | "or"
  | "pa"
  | "sa"
  | "sat"
  | "sd"
  | "ta"
  | "te"
  | "ur";

export type SupportedLocale = {
  code: LocaleCode;
  englishName: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  translationStatus: "complete" | "draft" | "planned";
};

export const defaultLocale: LocaleCode = "en";

export const supportedLocales: SupportedLocale[] = [
  {
    code: "en",
    englishName: "English",
    nativeName: "English",
    direction: "ltr",
    translationStatus: "complete",
  },
  {
    code: "as",
    englishName: "Assamese",
    nativeName: "অসমীয়া",
    direction: "ltr",
    translationStatus: "draft",
  },
  {
    code: "bn",
    englishName: "Bengali",
    nativeName: "বাংলা",
    direction: "ltr",
    translationStatus: "draft",
  },
  {
    code: "brx",
    englishName: "Bodo",
    nativeName: "बर'",
    direction: "ltr",
    translationStatus: "draft",
  },
  {
    code: "doi",
    englishName: "Dogri",
    nativeName: "डोगरी",
    direction: "ltr",
    translationStatus: "draft",
  },
  {
    code: "gu",
    englishName: "Gujarati",
    nativeName: "ગુજરાતી",
    direction: "ltr",
    translationStatus: "draft",
  },
  {
    code: "hi",
    englishName: "Hindi",
    nativeName: "हिन्दी",
    direction: "ltr",
    translationStatus: "draft",
  },
  {
    code: "kn",
    englishName: "Kannada",
    nativeName: "ಕನ್ನಡ",
    direction: "ltr",
    translationStatus: "draft",
  },
  {
    code: "ks",
    englishName: "Kashmiri",
    nativeName: "کٲشُر",
    direction: "rtl",
    translationStatus: "draft",
  },
  {
    code: "kok",
    englishName: "Konkani",
    nativeName: "कोंकणी",
    direction: "ltr",
    translationStatus: "draft",
  },
  {
    code: "mai",
    englishName: "Maithili",
    nativeName: "मैथिली",
    direction: "ltr",
    translationStatus: "draft",
  },
  {
    code: "ml",
    englishName: "Malayalam",
    nativeName: "മലയാളം",
    direction: "ltr",
    translationStatus: "draft",
  },
  {
    code: "mni",
    englishName: "Manipuri",
    nativeName: "মৈতৈলোন্",
    direction: "ltr",
    translationStatus: "draft",
  },
  {
    code: "mr",
    englishName: "Marathi",
    nativeName: "मराठी",
    direction: "ltr",
    translationStatus: "draft",
  },
  {
    code: "ne",
    englishName: "Nepali",
    nativeName: "नेपाली",
    direction: "ltr",
    translationStatus: "draft",
  },
  {
    code: "or",
    englishName: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    direction: "ltr",
    translationStatus: "draft",
  },
  {
    code: "pa",
    englishName: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    direction: "ltr",
    translationStatus: "draft",
  },
  {
    code: "sa",
    englishName: "Sanskrit",
    nativeName: "संस्कृतम्",
    direction: "ltr",
    translationStatus: "draft",
  },
  {
    code: "sat",
    englishName: "Santali",
    nativeName: "ᱥᱟᱱᱛᱟᱲᱤ",
    direction: "ltr",
    translationStatus: "draft",
  },
  {
    code: "sd",
    englishName: "Sindhi",
    nativeName: "سنڌي",
    direction: "rtl",
    translationStatus: "draft",
  },
  {
    code: "ta",
    englishName: "Tamil",
    nativeName: "தமிழ்",
    direction: "ltr",
    translationStatus: "draft",
  },
  {
    code: "te",
    englishName: "Telugu",
    nativeName: "తెలుగు",
    direction: "ltr",
    translationStatus: "draft",
  },
  {
    code: "ur",
    englishName: "Urdu",
    nativeName: "اردو",
    direction: "rtl",
    translationStatus: "draft",
  },
];

export function getSupportedLocale(code: string) {
  return (
    supportedLocales.find((locale) => locale.code === code) ??
    supportedLocales[0]
  );
}

export function isSupportedLocale(code: string): code is LocaleCode {
  return supportedLocales.some((locale) => locale.code === code);
}

export const localeCodes = supportedLocales.map((locale) => locale.code);
