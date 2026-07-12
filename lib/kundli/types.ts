export type AyanamshaMode = "lahiri";
export type HouseSystem = "whole_sign";
export type EngineBackend = "jpl_spice";

export type BirthChartFormPayload = {
  subjectName?: string;
  birthDate: string;
  birthTime: string;
  placeName: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  timezoneOffsetMinutes?: number;
  ayanamsha?: AyanamshaMode;
  houseSystem?: HouseSystem;
  engineBackend?: EngineBackend;
};

export type ZodiacSign =
  | "Aries"
  | "Taurus"
  | "Gemini"
  | "Cancer"
  | "Leo"
  | "Virgo"
  | "Libra"
  | "Scorpio"
  | "Sagittarius"
  | "Capricorn"
  | "Aquarius"
  | "Pisces";

export type NakshatraPlacement = {
  name: string;
  pada: number;
};

export type LongitudePlacement = {
  longitude: number;
  sign: ZodiacSign;
  degreeInSign: number;
  nakshatra: NakshatraPlacement;
};

export type PlanetPosition = LongitudePlacement & {
  key: string;
  name: string;
  tropicalLongitude: number;
  latitude: number;
  house: number;
  retrograde: boolean;
};

export type KundliHouse = {
  number: number;
  sign: ZodiacSign;
  startLongitude: number;
  planets: string[];
};

export type CalculationPrecision = "reference";

export type CalculationProfile = {
  id: string;
  label: string;
  precision: CalculationPrecision;
  ephemeris: string;
  planetPositionSource: string;
  ayanamshaModel: string;
  houseModel: string;
  nodeModel: string;
  expectedTolerance: string;
};

export type BirthChartMetadata = {
  engineVersion: string;
  calculationProfile: CalculationProfile;
  engineBackend: EngineBackend;
  ayanamsha: AyanamshaMode;
  ayanamshaDegrees: number;
  zodiac: "sidereal";
  houseSystem: HouseSystem;
  ephemeris: string;
  localDateTime: string;
  utcIso: string;
  julianDay: number;
  placeName: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  timezoneOffsetMinutes: number;
  warnings: string[];
};

export type BirthChartResult = {
  subjectName?: string;
  metadata: BirthChartMetadata;
  ascendant: LongitudePlacement;
  houses: KundliHouse[];
  planets: PlanetPosition[];
};

export type BirthChartApiSuccess = {
  chart: BirthChartResult;
  quota: ChartQuota;
  savedChart: UserChartSummary;
};

export type ChartQuota = {
  limit: number;
  used: number;
  remaining: number;
};

export type UserChartSummary = {
  id: string;
  createdAt: string;
  subjectName?: string;
  placeName: string;
  localDateTime: string;
  chart: BirthChartResult;
};

export type BirthChartApiError = {
  error: {
    message: string;
    fields?: Record<string, string>;
    requiresLogin?: boolean;
    quota?: ChartQuota;
  };
};
