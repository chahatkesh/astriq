import { Ephemeris } from "js-ephemeris";
import type {
  AyanamshaMode,
  BirthChartFormPayload,
  BirthChartResult,
  EngineBackend,
  HouseSystem,
  NakshatraPlacement,
  PlanetPosition,
} from "@/lib/kundli/types";
import { normalizeBirthLocation } from "@/services/location-service";

type ValidationResult =
  | { ok: true; value: BirthChartFormPayload }
  | { ok: false; fields: Record<string, string> };

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

type RawPlanetPosition = {
  tropicalLongitude: number;
  latitude: number;
  retrograde: boolean;
};

const ephemeris = new Ephemeris();

const zodiacSigns = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

const nakshatras = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
] as const;

const planetConfigs = [
  { key: "sun", name: "Sun", tag: "sun" },
  { key: "moon", name: "Moon", tag: "moon" },
  { key: "mars", name: "Mars", tag: "mar" },
  { key: "mercury", name: "Mercury", tag: "mer" },
  { key: "jupiter", name: "Jupiter", tag: "jup" },
  { key: "venus", name: "Venus", tag: "ven" },
  { key: "saturn", name: "Saturn", tag: "sat" },
] as const;

const unixEpochJulianDay = 2440587.5;
const localDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const localTimePattern = /^(\d{2}):(\d{2})$/;

export class BirthChartValidationError extends Error {
  readonly fields: Record<string, string>;

  constructor(fields: Record<string, string>) {
    super("Check the highlighted birth details.");
    this.name = "BirthChartValidationError";
    this.fields = fields;
  }
}

export class EngineExecutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EngineExecutionError";
  }
}

export async function generateBirthChart(payload: unknown) {
  const validation = validateBirthChartPayload(payload);

  if (!validation.ok) {
    throw new BirthChartValidationError(validation.fields);
  }

  let normalizedLocation;
  try {
    normalizedLocation = normalizeBirthLocation(validation.value);
  } catch (error) {
    throw new BirthChartValidationError({
      location:
        error instanceof Error
          ? error.message
          : "Birthplace details could not be normalized.",
    });
  }

  const chartInput = {
    ...validation.value,
    ...normalizedLocation,
    subjectName: validation.value.subjectName?.trim() || undefined,
    ayanamsha: validation.value.ayanamsha ?? "lahiri",
    houseSystem: validation.value.houseSystem ?? "whole_sign",
    engineBackend: validation.value.engineBackend ?? getDefaultEngineBackend(),
  };

  return calculateBirthChart(chartInput);
}

export function validateBirthChartPayload(payload: unknown): ValidationResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      ok: false,
      fields: {
        form: "Send the birth details as a JSON object.",
      },
    };
  }

  const input = payload as Record<string, unknown>;
  const fields: Record<string, string> = {};
  const subjectName = optionalString(input.subjectName);
  const birthDate = requiredString(
    input.birthDate,
    "birthDate",
    "Date of birth",
    fields,
  );
  const birthTime = requiredString(
    input.birthTime,
    "birthTime",
    "Time of birth",
    fields,
  );
  const placeName = requiredString(
    input.placeName,
    "placeName",
    "Birthplace",
    fields,
  );
  const latitude = requiredNumber(
    input.latitude,
    "latitude",
    "Latitude",
    fields,
  );
  const longitude = requiredNumber(
    input.longitude,
    "longitude",
    "Longitude",
    fields,
  );
  const timeZone = requiredString(
    input.timeZone,
    "timeZone",
    "Time zone",
    fields,
  );
  const timezoneOffsetMinutes = optionalInteger(input.timezoneOffsetMinutes);
  const ayanamsha = optionalAyanamsha(input.ayanamsha, fields);
  const houseSystem = optionalHouseSystem(input.houseSystem, fields);
  const engineBackend = optionalEngineBackend(input.engineBackend, fields);

  if (birthDate && !localDatePattern.test(birthDate)) {
    fields.birthDate = "Use YYYY-MM-DD.";
  }

  if (birthTime && !localTimePattern.test(birthTime)) {
    fields.birthTime = "Use HH:mm in 24-hour time.";
  }

  if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
    fields.latitude = "Latitude must be from -90 to 90.";
  }

  if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
    fields.longitude = "Longitude must be from -180 to 180.";
  }

  if (
    input.timezoneOffsetMinutes !== undefined &&
    timezoneOffsetMinutes === undefined
  ) {
    fields.timezoneOffsetMinutes = "Time-zone offset must be whole minutes.";
  }

  if (timezoneOffsetMinutes !== undefined) {
    if (timezoneOffsetMinutes < -14 * 60 || timezoneOffsetMinutes > 14 * 60) {
      fields.timezoneOffsetMinutes =
        "Time-zone offset must be between UTC-14:00 and UTC+14:00.";
    }
  }

  if (Object.keys(fields).length > 0) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    value: {
      subjectName,
      birthDate: birthDate as string,
      birthTime: birthTime as string,
      placeName: placeName as string,
      latitude: latitude as number,
      longitude: longitude as number,
      timeZone: timeZone as string,
      timezoneOffsetMinutes,
      ayanamsha,
      houseSystem,
      engineBackend,
    },
  };
}

async function calculateBirthChart(input: BirthChartFormPayload) {
  const julianDay = julianDayFromLocal(
    input.birthDate,
    input.birthTime,
    input.timezoneOffsetMinutes as number,
  );
  const ayanamshaDegrees = lahiriAyanamsha(julianDay);
  const ascendantLongitude = calculateAscendantLongitude(
    julianDay,
    input.latitude,
    input.longitude,
    ayanamshaDegrees,
  );
  const ascendant = buildPlacement(ascendantLongitude);
  const ascendantSign = zodiacSignIndex(ascendantLongitude);

  const utcIso = utcIsoFromLocal(
    input.birthDate,
    input.birthTime,
    input.timezoneOffsetMinutes as number,
  );
  const utcDate = new Date(utcIso);

  if (Number.isNaN(utcDate.getTime())) {
    throw new EngineExecutionError(
      "Invalid UTC instant generated from birth details.",
    );
  }

  const planets = await buildPlanetPositions(
    utcDate,
    julianDay,
    ayanamshaDegrees,
    ascendantSign,
  );

  const houses = Array.from({ length: 12 }, (_, index) => {
    const signIndex = (ascendantSign + index) % 12;
    return {
      number: index + 1,
      sign: zodiacSigns[signIndex],
      startLongitude: signIndex * 30,
      planets: [] as string[],
    };
  });

  for (const planet of planets) {
    houses[planet.house - 1]?.planets.push(planet.key);
  }

  return {
    subjectName: input.subjectName,
    metadata: {
      engineVersion: "2.0.0",
      calculationProfile: {
        id: "vedic-lahiri-jpl-de441-v1",
        label: "Vedic Lahiri JPL DE441 profile",
        precision: "reference",
        ephemeris: "NASA/JPL DE441 via js-ephemeris",
        planetPositionSource: "JPL DE441 OPM2 geocentric apparent states",
        ayanamshaModel: "Mean Lahiri approximation",
        houseModel: "Whole sign from sidereal ascendant",
        nodeModel: "Mean lunar nodes",
        expectedTolerance:
          "Reference profile backed by JPL DE441 planetary states.",
      },
      engineBackend: "jpl_spice",
      ayanamsha: "lahiri",
      ayanamshaDegrees,
      zodiac: "sidereal",
      houseSystem: "whole_sign",
      ephemeris: "NASA/JPL DE441",
      localDateTime: `${input.birthDate}T${input.birthTime}:00`,
      utcIso,
      julianDay,
      placeName: input.placeName,
      latitude: input.latitude,
      longitude: input.longitude,
      timeZone: input.timeZone,
      timezoneOffsetMinutes: input.timezoneOffsetMinutes as number,
      warnings: [],
    },
    ascendant,
    houses,
    planets,
  } satisfies BirthChartResult;
}

async function buildPlanetPositions(
  utcDate: Date,
  julianDay: number,
  ayanamshaDegrees: number,
  ascendantSign: number,
) {
  try {
    const rawPlanets = await Promise.all(
      planetConfigs.map(async (config) => {
        const result = await ephemeris.geocentricState(config.tag, utcDate);
        return {
          key: config.key,
          name: config.name,
          raw: {
            tropicalLongitude: result.lon,
            latitude: result.lat,
            retrograde: Boolean(result.retrograde),
          } satisfies RawPlanetPosition,
        };
      }),
    );

    const nodePositions = {
      rahu: lunarNode(julianDay, false),
      ketu: lunarNode(julianDay, true),
    };

    const planets = rawPlanets.map((item) =>
      buildPlanet(
        item.key,
        item.name,
        item.raw,
        ayanamshaDegrees,
        ascendantSign,
      ),
    );

    planets.push(
      buildPlanet(
        "rahu",
        "Rahu",
        {
          tropicalLongitude: nodePositions.rahu,
          latitude: 0,
          retrograde: true,
        },
        ayanamshaDegrees,
        ascendantSign,
      ),
    );

    planets.push(
      buildPlanet(
        "ketu",
        "Ketu",
        {
          tropicalLongitude: nodePositions.ketu,
          latitude: 0,
          retrograde: true,
        },
        ayanamshaDegrees,
        ascendantSign,
      ),
    );

    return planets;
  } catch (error) {
    throw new EngineExecutionError(
      error instanceof Error
        ? `Failed to compute chart positions: ${error.message}`
        : "Failed to compute chart positions.",
    );
  }
}

function buildPlanet(
  key: PlanetPosition["key"],
  name: string,
  raw: RawPlanetPosition,
  ayanamshaDegrees: number,
  ascendantSign: number,
): PlanetPosition {
  const siderealLongitude = normalizeDegrees(
    raw.tropicalLongitude - ayanamshaDegrees,
  );
  const placement = buildPlacement(siderealLongitude);
  const signIndex = zodiacSignIndex(siderealLongitude);

  return {
    ...placement,
    key,
    name,
    tropicalLongitude: normalizeDegrees(raw.tropicalLongitude),
    latitude: raw.latitude,
    house: ((signIndex - ascendantSign + 12) % 12) + 1,
    retrograde: raw.retrograde,
  };
}

function buildPlacement(longitude: number) {
  const normalized = normalizeDegrees(longitude);
  const signIndex = zodiacSignIndex(normalized);
  const degreeInSign = normalized - signIndex * 30;
  const nakshatra = buildNakshatra(normalized);

  return {
    longitude: normalized,
    sign: zodiacSigns[signIndex],
    degreeInSign,
    nakshatra,
  };
}

function buildNakshatra(longitude: number): NakshatraPlacement {
  const nakshatraSize = 360 / 27;
  const padaSize = 360 / 108;
  const rawIndex = Math.floor(longitude / nakshatraSize);
  const nakshatraIndex = Math.max(0, Math.min(26, rawIndex));
  const pada =
    Math.floor((longitude - nakshatraIndex * nakshatraSize) / padaSize) + 1;

  return {
    name: nakshatras[nakshatraIndex],
    pada: Math.max(1, Math.min(4, pada)),
  };
}

function getDefaultEngineBackend(): EngineBackend {
  const configured = process.env.KUNDLI_ENGINE_BACKEND;

  if (!configured) {
    return "jpl_spice";
  }

  if (configured === "jpl_spice") {
    return configured;
  }

  throw new EngineExecutionError(
    `Unsupported KUNDLI_ENGINE_BACKEND "${configured}". Expected jpl_spice.`,
  );
}

function optionalAyanamsha(
  value: unknown,
  fields: Record<string, string>,
): AyanamshaMode | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value === "lahiri") {
    return value;
  }

  fields.ayanamsha = "Only Lahiri ayanamsha is currently supported.";
  return undefined;
}

function optionalHouseSystem(
  value: unknown,
  fields: Record<string, string>,
): HouseSystem | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value === "whole_sign") {
    return value;
  }

  fields.houseSystem = "Only whole sign houses are currently supported.";
  return undefined;
}

function optionalEngineBackend(
  value: unknown,
  fields: Record<string, string>,
): EngineBackend | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (value === "jpl_spice") {
    return value;
  }

  fields.engineBackend = "Engine backend must be jpl_spice.";
  return undefined;
}

function requiredString(
  value: unknown,
  key: string,
  label: string,
  fields: Record<string, string>,
) {
  if (typeof value !== "string" || !value.trim()) {
    fields[key] = `${label} is required.`;
    return undefined;
  }

  return value.trim();
}

function requiredNumber(
  value: unknown,
  key: string,
  label: string,
  fields: Record<string, string>,
) {
  if (typeof value === "string" && !value.trim()) {
    fields[key] = `${label} must be a number.`;
    return undefined;
  }

  const numberValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numberValue)) {
    fields[key] = `${label} must be a number.`;
    return undefined;
  }

  return numberValue;
}

function optionalString(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  return typeof value === "string" ? value.trim() || undefined : undefined;
}

function optionalInteger(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isInteger(numberValue) ? numberValue : undefined;
}

function parseLocalDateTime(birthDate: string, birthTime: string): DateParts {
  const dateMatch = localDatePattern.exec(birthDate);
  const timeMatch = localTimePattern.exec(birthTime);

  if (!dateMatch || !timeMatch) {
    throw new EngineExecutionError(
      "Birth date and time must use YYYY-MM-DD and HH:mm.",
    );
  }

  const parts = {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
  };

  const date = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute),
  );

  if (
    date.getUTCFullYear() !== parts.year ||
    date.getUTCMonth() !== parts.month - 1 ||
    date.getUTCDate() !== parts.day ||
    date.getUTCHours() !== parts.hour ||
    date.getUTCMinutes() !== parts.minute
  ) {
    throw new EngineExecutionError("Birth date or time is invalid.");
  }

  return parts;
}

function utcIsoFromLocal(
  birthDate: string,
  birthTime: string,
  timezoneOffsetMinutes: number,
) {
  const local = parseLocalDateTime(birthDate, birthTime);
  const localDays = daysFromCivil(local.year, local.month, local.day);
  const localTotalMinutes = localDays * 1440 + local.hour * 60 + local.minute;
  const utcTotalMinutes = localTotalMinutes - timezoneOffsetMinutes;
  const utcDays = floorDiv(utcTotalMinutes, 1440);
  const minuteOfDay = utcTotalMinutes - utcDays * 1440;
  const utc = civilFromDays(utcDays);

  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;

  return `${pad4(utc.year)}-${pad2(utc.month)}-${pad2(utc.day)}T${pad2(
    hour,
  )}:${pad2(minute)}:00.000Z`;
}

function julianDayFromLocal(
  birthDate: string,
  birthTime: string,
  timezoneOffsetMinutes: number,
) {
  const local = parseLocalDateTime(birthDate, birthTime);
  const localDays = daysFromCivil(local.year, local.month, local.day);
  const localTotalMinutes = localDays * 1440 + local.hour * 60 + local.minute;
  const utcTotalMinutes = localTotalMinutes - timezoneOffsetMinutes;

  return unixEpochJulianDay + utcTotalMinutes / 1440;
}

function lahiriAyanamsha(julianDay: number) {
  const centuries = (julianDay - 2451545.0) / 36525.0;
  return normalizeDegrees(
    23.853055 + 1.396971278 * centuries + 0.0003086 * centuries * centuries,
  );
}

function calculateAscendantLongitude(
  julianDay: number,
  latitude: number,
  longitude: number,
  ayanamshaDegrees: number,
) {
  const centuries = (julianDay - 2451545.0) / 36525.0;
  const greenwichSidereal =
    280.46061837 +
    360.98564736629 * (julianDay - 2451545.0) +
    0.000387933 * centuries * centuries -
    (centuries * centuries * centuries) / 38710000.0;
  const localSidereal = degToRad(
    normalizeDegrees(greenwichSidereal + longitude),
  );
  const obliquity = degToRad(meanObliquity(julianDay));
  const latitudeRad = degToRad(latitude);

  const tropicalAscendant = normalizeDegrees(
    radToDeg(
      Math.atan2(
        -Math.cos(localSidereal),
        Math.sin(localSidereal) * Math.cos(obliquity) +
          Math.tan(latitudeRad) * Math.sin(obliquity),
      ),
    ) + 180,
  );

  return normalizeDegrees(tropicalAscendant - ayanamshaDegrees);
}

function meanObliquity(julianDay: number) {
  const centuries = (julianDay - 2451545.0) / 36525.0;
  return (
    23.439291111 -
    0.013004167 * centuries -
    0.000000164 * centuries * centuries +
    0.000000504 * centuries * centuries * centuries
  );
}

function lunarNode(julianDay: number, southNode: boolean) {
  const centuries = (julianDay - 2451545.0) / 36525.0;
  const northNode =
    125.04452 -
    1934.136261 * centuries +
    0.0020708 * centuries * centuries +
    (centuries * centuries * centuries) / 450000.0;

  return normalizeDegrees(northNode + (southNode ? 180 : 0));
}

function normalizeDegrees(degrees: number) {
  const normalized = ((degrees % 360) + 360) % 360;
  return normalized >= 360 ? normalized - 360 : normalized;
}

function zodiacSignIndex(longitude: number) {
  return Math.max(
    0,
    Math.min(11, Math.floor(normalizeDegrees(longitude) / 30)),
  );
}

function degToRad(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function radToDeg(radians: number) {
  return (radians * 180) / Math.PI;
}

function floorDiv(value: number, divisor: number) {
  const quotient = Math.trunc(value / divisor);
  const remainder = value % divisor;

  if (remainder !== 0 && remainder > 0 !== divisor > 0) {
    return quotient - 1;
  }

  return quotient;
}

function daysFromCivil(year: number, month: number, day: number) {
  const adjustedYear = year - (month <= 2 ? 1 : 0);
  const era = Math.trunc(
    (adjustedYear >= 0 ? adjustedYear : adjustedYear - 399) / 400,
  );
  const yoe = adjustedYear - era * 400;
  const doy =
    Math.trunc((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.trunc(yoe / 4) - Math.trunc(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

function civilFromDays(zDays: number) {
  const z = zDays + 719468;
  const era = Math.trunc((z >= 0 ? z : z - 146096) / 146097);
  const doe = z - era * 146097;
  const yoe = Math.trunc(
    (doe -
      Math.trunc(doe / 1460) +
      Math.trunc(doe / 36524) -
      Math.trunc(doe / 146096)) /
      365,
  );
  let year = yoe + era * 400;
  const doy = doe - (365 * yoe + Math.trunc(yoe / 4) - Math.trunc(yoe / 100));
  const mp = Math.trunc((5 * doy + 2) / 153);
  const day = doy - Math.trunc((153 * mp + 2) / 5) + 1;
  const month = mp + (mp < 10 ? 3 : -9);
  year += month <= 2 ? 1 : 0;

  return { year, month, day };
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function pad4(value: number) {
  return String(value).padStart(4, "0");
}
