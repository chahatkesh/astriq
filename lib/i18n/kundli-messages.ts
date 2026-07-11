import type { LocaleCode } from "@/lib/i18n/locales";

export type KundliMessages = typeof englishMessages;

const englishMessages = {
  app: {
    eyebrow: "Vedic birth chart",
    title: "Birth Chart Generator",
    subtitle: "Lahiri / sidereal / whole sign",
    language: "Language",
  },
  form: {
    title: "Birth Details",
    birthDate: "Date of birth",
    birthTime: "Exact time",
    placeName: "Birthplace",
    currentPosition: "Use current position",
    readingPosition: "Reading position",
    latitude: "Latitude",
    longitude: "Longitude",
    timeZone: "IANA time zone",
    manualOffset: "Manual UTC offset",
    offsetMinutes: "Offset minutes",
    submit: "Generate Kundli",
    submitting: "Calculating",
  },
  placeSearch: {
    label: "Search birthplace",
    placeholder: "Start typing a city name",
    hint: "Search a city to fill coordinates and time zone automatically.",
    searching: "Searching places",
    noResults: "No matching places found. Enter coordinates manually.",
    error: "Place search is unavailable right now. Enter coordinates manually.",
    ambiguous: "Multiple places match. Choose the correct one.",
    resolved: "Coordinates and time zone filled from",
    clear: "Clear selection",
  },
  states: {
    geolocationUnavailable: "Geolocation is unavailable in this browser.",
    geolocationFailed: "Current position could not be read.",
    currentLocation: "Current location",
    requestFailed: "The chart request could not be completed.",
    loadingEyebrow: "Calculating",
    loadingTitle: "Preparing chart data",
    emptyEyebrow: "No chart yet",
    emptyTitle: "Enter precise birth details to generate a Kundli.",
  },
  chart: {
    kundli: "Kundli",
    lagna: "Lagna",
    moon: "Moon",
    sun: "Sun",
    prototype: "Prototype",
    reference: "Reference",
    calculationProfile: "Calculation Profile",
    planetaryPositions: "Planetary Positions",
    planetarySubtitle: "Lahiri / sidereal / whole sign houses",
  },
  table: {
    graha: "Graha",
    sign: "Sign",
    degree: "Degree",
    house: "House",
    nakshatra: "Nakshatra",
    retrograde: "Retrograde",
    yes: "Yes",
    no: "No",
  },
  metadata: {
    backend: "Backend",
    precision: "Precision",
    ephemeris: "Ephemeris",
    planetSource: "Planet source",
    ayanamshaModel: "Ayanamsha model",
    houseModel: "House model",
    nodeModel: "Node model",
    ayanamsha: "Ayanamsha",
    julianDay: "Julian day",
    timeZone: "Time zone",
    utcOffset: "UTC offset",
  },
};

const hindiMessages: Partial<KundliMessages> = {
  app: {
    eyebrow: "वैदिक जन्म कुंडली",
    title: "जन्म कुंडली जनरेटर",
    subtitle: "लाहिड़ी / निरयन / पूर्ण राशि",
    language: "भाषा",
  },
  form: {
    title: "जन्म विवरण",
    birthDate: "जन्म तिथि",
    birthTime: "सटीक समय",
    placeName: "जन्मस्थान",
    currentPosition: "वर्तमान स्थान उपयोग करें",
    readingPosition: "स्थान पढ़ा जा रहा है",
    latitude: "अक्षांश",
    longitude: "देशांतर",
    timeZone: "IANA समय क्षेत्र",
    manualOffset: "मैनुअल UTC अंतर",
    offsetMinutes: "अंतर मिनटों में",
    submit: "कुंडली बनाएं",
    submitting: "गणना हो रही है",
  },
  placeSearch: {
    label: "जन्मस्थान खोजें",
    placeholder: "शहर का नाम लिखना शुरू करें",
    hint: "निर्देशांक और समय क्षेत्र स्वतः भरने के लिए शहर खोजें.",
    searching: "स्थान खोजे जा रहे हैं",
    noResults: "कोई मिलता स्थान नहीं मिला. निर्देशांक स्वयं दर्ज करें.",
    error: "स्थान खोज अभी उपलब्ध नहीं है. निर्देशांक स्वयं दर्ज करें.",
    ambiguous: "कई स्थान मिलते हैं. सही स्थान चुनें.",
    resolved: "निर्देशांक और समय क्षेत्र भरे गए —",
    clear: "चयन हटाएं",
  },
  states: {
    geolocationUnavailable: "इस ब्राउज़र में जियोलोकेशन उपलब्ध नहीं है.",
    geolocationFailed: "वर्तमान स्थान पढ़ा नहीं जा सका.",
    currentLocation: "वर्तमान स्थान",
    requestFailed: "कुंडली अनुरोध पूरा नहीं हो सका.",
    loadingEyebrow: "गणना",
    loadingTitle: "कुंडली डेटा तैयार हो रहा है",
    emptyEyebrow: "अभी कोई कुंडली नहीं",
    emptyTitle: "कुंडली बनाने के लिए सटीक जन्म विवरण दर्ज करें.",
  },
  chart: {
    kundli: "कुंडली",
    lagna: "लग्न",
    moon: "चंद्र",
    sun: "सूर्य",
    prototype: "प्रोटोटाइप",
    reference: "संदर्भ",
    calculationProfile: "गणना प्रोफ़ाइल",
    planetaryPositions: "ग्रह स्थिति",
    planetarySubtitle: "लाहिड़ी / निरयन / पूर्ण राशि भाव",
  },
  table: {
    graha: "ग्रह",
    sign: "राशि",
    degree: "अंश",
    house: "भाव",
    nakshatra: "नक्षत्र",
    retrograde: "वक्री",
    yes: "हाँ",
    no: "नहीं",
  },
  metadata: {
    backend: "बैकएंड",
    precision: "सटीकता",
    ephemeris: "एफेमेरिस",
    planetSource: "ग्रह स्रोत",
    ayanamshaModel: "अयनांश मॉडल",
    houseModel: "भाव मॉडल",
    nodeModel: "नोड मॉडल",
    ayanamsha: "अयनांश",
    julianDay: "जूलियन दिन",
    timeZone: "समय क्षेत्र",
    utcOffset: "UTC अंतर",
  },
};

const messageOverrides: Partial<Record<LocaleCode, Partial<KundliMessages>>> = {
  hi: hindiMessages,
};

export function getKundliMessages(localeCode: LocaleCode): KundliMessages {
  const override = messageOverrides[localeCode];

  if (!override) {
    return englishMessages;
  }

  return {
    app: { ...englishMessages.app, ...override.app },
    form: { ...englishMessages.form, ...override.form },
    placeSearch: { ...englishMessages.placeSearch, ...override.placeSearch },
    states: { ...englishMessages.states, ...override.states },
    chart: { ...englishMessages.chart, ...override.chart },
    table: { ...englishMessages.table, ...override.table },
    metadata: { ...englishMessages.metadata, ...override.metadata },
  };
}
