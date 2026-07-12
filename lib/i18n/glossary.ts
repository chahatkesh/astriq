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

const bengaliGlossary: GlossaryDictionary = {
  graha: "গ্রহ",
  rashi: "রাশি",
  lagna: "লগ্ন",
  bhava: "ভাব",
  nakshatra: "নক্ষত্র",
  pada: "পাদ",
  ayanamsha: "অয়নাংশ",
  retrograde: "বক্রী",
  sun: "সূর্য",
  moon: "চন্দ্র",
  mars: "মঙ্গল",
  mercury: "বুধ",
  jupiter: "বৃহস্পতি",
  venus: "শুক্র",
  saturn: "শনি",
  rahu: "রাহু",
  ketu: "কেতু",
  aries: "মেষ",
  taurus: "বৃষ",
  gemini: "মিথুন",
  cancer: "কর্কট",
  leo: "সিংহ",
  virgo: "কন্যা",
  libra: "তুলা",
  scorpio: "বৃশ্চিক",
  sagittarius: "ধনু",
  capricorn: "মকর",
  aquarius: "কুম্ভ",
  pisces: "মীন",
};

const gujaratiGlossary: GlossaryDictionary = {
  graha: "ગ્રહ",
  rashi: "રાશિ",
  lagna: "લગ્ન",
  bhava: "ભાવ",
  nakshatra: "નક્ષત્ર",
  pada: "પાદ",
  ayanamsha: "અયનાંશ",
  retrograde: "વક્રી",
  sun: "સૂર્ય",
  moon: "ચંદ્ર",
  mars: "મંગળ",
  mercury: "બુધ",
  jupiter: "ગુરુ",
  venus: "શુક્ર",
  saturn: "શનિ",
  rahu: "રાહુ",
  ketu: "કેતુ",
  aries: "મેષ",
  taurus: "વૃષભ",
  gemini: "મિથુન",
  cancer: "કર્ક",
  leo: "સિંહ",
  virgo: "કન્યા",
  libra: "તુલા",
  scorpio: "વૃશ્ચિક",
  sagittarius: "ધનુ",
  capricorn: "મકર",
  aquarius: "કુંભ",
  pisces: "મીન",
};

const kannadaGlossary: GlossaryDictionary = {
  graha: "ಗ್ರಹ",
  rashi: "ರಾಶಿ",
  lagna: "ಲಗ್ನ",
  bhava: "ಭಾವ",
  nakshatra: "ನಕ್ಷತ್ರ",
  pada: "ಪಾದ",
  ayanamsha: "ಅಯನಾಂಶ",
  retrograde: "ವಕ್ರಗತಿ",
  sun: "ಸೂರ್ಯ",
  moon: "ಚಂದ್ರ",
  mars: "ಮಂಗಳ",
  mercury: "ಬುಧ",
  jupiter: "ಗುರು",
  venus: "ಶುಕ್ರ",
  saturn: "ಶನಿ",
  rahu: "ರಾಹು",
  ketu: "ಕೇತು",
  aries: "ಮೇಷ",
  taurus: "ವೃಷಭ",
  gemini: "ಮಿಥುನ",
  cancer: "ಕರ್ಕಾಟಕ",
  leo: "ಸಿಂಹ",
  virgo: "ಕನ್ಯಾ",
  libra: "ತುಲಾ",
  scorpio: "ವೃಶ್ಚಿಕ",
  sagittarius: "ಧನು",
  capricorn: "ಮಕರ",
  aquarius: "ಕುಂಭ",
  pisces: "ಮೀನ",
};

const malayalamGlossary: GlossaryDictionary = {
  graha: "ഗ്രഹം",
  rashi: "രാശി",
  lagna: "ലഗ്നം",
  bhava: "ഭാവം",
  nakshatra: "നക്ഷത്രം",
  pada: "പാദം",
  ayanamsha: "അയനാംശം",
  retrograde: "വക്രഗതി",
  sun: "സൂര്യൻ",
  moon: "ചന്ദ്രൻ",
  mars: "മംഗളം",
  mercury: "ബുധൻ",
  jupiter: "ഗുരു",
  venus: "ശുക്രൻ",
  saturn: "ശനി",
  rahu: "രാഹു",
  ketu: "കേതു",
  aries: "മേടം",
  taurus: "ഇടവം",
  gemini: "മിഥുനം",
  cancer: "കർ‍ക്കടകം",
  leo: "ചിങ്ങം",
  virgo: "കന്നി",
  libra: "തുലാം",
  scorpio: "വൃശ്ചികം",
  sagittarius: "ധനു",
  capricorn: "മകരം",
  aquarius: "കുംഭം",
  pisces: "മീനം",
};

const odiaGlossary: GlossaryDictionary = {
  graha: "ଗ୍ରହ",
  rashi: "ରାଶି",
  lagna: "ଲଗ୍ନ",
  bhava: "ଭାବ",
  nakshatra: "ନକ୍ଷତ୍ର",
  pada: "ପାଦ",
  ayanamsha: "ଅୟନାଂଶ",
  retrograde: "ବକ୍ରଗତି",
  sun: "ସୂର୍ଯ୍ୟ",
  moon: "ଚନ୍ଦ୍ର",
  mars: "ମଙ୍ଗଳ",
  mercury: "ବୁଧ",
  jupiter: "ଗୁରୁ",
  venus: "ଶୁକ୍ର",
  saturn: "ଶନି",
  rahu: "ରାହୁ",
  ketu: "କେତୁ",
  aries: "ମେଷ",
  taurus: "ବୃଷଭ",
  gemini: "ମିଥୁନ",
  cancer: "କର୍କଟ",
  leo: "ସିଂହ",
  virgo: "କନ୍ୟା",
  libra: "ତୁଳା",
  scorpio: "ବୃଶ୍ଚିକ",
  sagittarius: "ଧନୁ",
  capricorn: "ମକର",
  aquarius: "କୁମ୍ଭ",
  pisces: "ମୀନ",
};

const punjabiGlossary: GlossaryDictionary = {
  graha: "ਗ੍ਰਹਿ",
  rashi: "ਰਾਸ਼ੀ",
  lagna: "ਲਗਨ",
  bhava: "ਭਾਵ",
  nakshatra: "ਨਕਸ਼ਤਰ",
  pada: "ਪਾਦ",
  ayanamsha: "ਅਯਨਾਂਸ਼",
  retrograde: "ਵਕਰੀ",
  sun: "ਸੂਰਜ",
  moon: "ਚੰਦਰਮਾ",
  mars: "ਮੰਗਲ",
  mercury: "ਬੁੱਧ",
  jupiter: "ਗੁਰੂ",
  venus: "ਸ਼ੁਕਰ",
  saturn: "ਸ਼ਨੀ",
  rahu: "ਰਾਹੁ",
  ketu: "ਕੇਤੁ",
  aries: "ਮੇਸ਼",
  taurus: "ਵ੍ਰਿਸ਼ਭ",
  gemini: "ਮਿਥੁਨ",
  cancer: "ਕਰਕ",
  leo: "ਸਿੰਘ",
  virgo: "ਕੰਨਿਆ",
  libra: "ਤੁਲਾ",
  scorpio: "ਵ੍ਰਿਸ਼ਚਿਕ",
  sagittarius: "ਧਨੁ",
  capricorn: "ਮਕਰ",
  aquarius: "ਕੁੰਭ",
  pisces: "ਮੀਨ",
};

const tamilGlossary: GlossaryDictionary = {
  graha: "கிரகம்",
  rashi: "ராசி",
  lagna: "லக்னம்",
  bhava: "பாவம்",
  nakshatra: "நட்சத்திரம்",
  pada: "பாதம்",
  ayanamsha: "அயனாம்சம்",
  retrograde: "வக்கிரம்",
  sun: "சூரியன்",
  moon: "சந்திரன்",
  mars: "செவ்வாய்",
  mercury: "புதன்",
  jupiter: "குரு",
  venus: "சுக்கிரன்",
  saturn: "சனி",
  rahu: "ராகு",
  ketu: "கேது",
  aries: "மேஷம்",
  taurus: "ரிஷபம்",
  gemini: "மிதுனம்",
  cancer: "கடகம்",
  leo: "சிம்மம்",
  virgo: "கன்னி",
  libra: "துலாம்",
  scorpio: "விருச்சிகம்",
  sagittarius: "தனுசு",
  capricorn: "மகரம்",
  aquarius: "கும்பம்",
  pisces: "மீனம்",
};

const teluguGlossary: GlossaryDictionary = {
  graha: "గ్రహం",
  rashi: "రాశి",
  lagna: "లగ్నం",
  bhava: "భావం",
  nakshatra: "నక్షత్రం",
  pada: "పాదం",
  ayanamsha: "అయనాంశం",
  retrograde: "వక్రగతి",
  sun: "సూర్యుడు",
  moon: "చంద్రుడు",
  mars: "మంగళుడు",
  mercury: "బుధుడు",
  jupiter: "గురుడు",
  venus: "శుక్రుడు",
  saturn: "శని",
  rahu: "రాహు",
  ketu: "కేతు",
  aries: "మేషం",
  taurus: "వృషభం",
  gemini: "మిథునం",
  cancer: "కర్కాటకం",
  leo: "సింహం",
  virgo: "కన్యా",
  libra: "తులా",
  scorpio: "వృశ్చికం",
  sagittarius: "ధనుస్సు",
  capricorn: "మకరం",
  aquarius: "కుంభం",
  pisces: "మీనం",
};

const marathiGlossary: GlossaryDictionary = {
  graha: "ग्रह",
  rashi: "राशी",
  lagna: "लग्न",
  bhava: "भाव",
  nakshatra: "नक्षत्र",
  pada: "पाद",
  ayanamsha: "अयनांश",
  retrograde: "वक्री",
  sun: "सूर्य",
  moon: "चंद्र",
  mars: "मंगळ",
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

const urduGlossary: GlossaryDictionary = {
  graha: "گرہ",
  rashi: "راشی",
  lagna: "لگن",
  bhava: "بھاو",
  nakshatra: "نکشتر",
  pada: "پاد",
  ayanamsha: "ایانامشا",
  retrograde: "وکرگتی",
  sun: "سورج",
  moon: "چاند",
  mars: "منگل",
  mercury: "عطارد",
  jupiter: "مشتری",
  venus: "زہرہ",
  saturn: "زحل",
  rahu: "راہو",
  ketu: "کیتو",
  aries: "حمل",
  taurus: "ثور",
  gemini: "جوزا",
  cancer: "سرطان",
  leo: "اسد",
  virgo: "سنبلہ",
  libra: "میزان",
  scorpio: "عقرب",
  sagittarius: "قوس",
  capricorn: "جدی",
  aquarius: "دلو",
  pisces: "حوت",
};

const devanagariDraftGlossary = hindiGlossary;

const glossaries: Partial<Record<LocaleCode, GlossaryDictionary>> = {
  en: englishGlossary,
  as: bengaliGlossary,
  bn: bengaliGlossary,
  brx: devanagariDraftGlossary,
  doi: devanagariDraftGlossary,
  gu: gujaratiGlossary,
  hi: hindiGlossary,
  kn: kannadaGlossary,
  ks: urduGlossary,
  kok: devanagariDraftGlossary,
  mai: devanagariDraftGlossary,
  ml: malayalamGlossary,
  mni: bengaliGlossary,
  mr: marathiGlossary,
  ne: devanagariDraftGlossary,
  or: odiaGlossary,
  pa: punjabiGlossary,
  sa: devanagariDraftGlossary,
  sat: devanagariDraftGlossary,
  sd: urduGlossary,
  ta: tamilGlossary,
  te: teluguGlossary,
  ur: urduGlossary,
};

/**
 * Resolve the glossary dictionary for a locale, falling back to English for
 * unknown locale codes outside the registered locale set.
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
