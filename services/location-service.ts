import type { BirthChartFormPayload } from "@/lib/kundli/types";

export type NormalizedBirthLocation = {
  placeName: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  timezoneOffsetMinutes: number;
};

export type BirthLocationInput = Pick<
  BirthChartFormPayload,
  | "birthDate"
  | "birthTime"
  | "placeName"
  | "latitude"
  | "longitude"
  | "timeZone"
  | "timezoneOffsetMinutes"
>;

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const LOCAL_TIME_PATTERN = /^(\d{2}):(\d{2})$/;

export function normalizeBirthLocation(
  input: BirthLocationInput,
): NormalizedBirthLocation {
  assertCoordinate(input.latitude, -90, 90, "latitude");
  assertCoordinate(input.longitude, -180, 180, "longitude");

  const placeName = input.placeName.trim();
  if (!placeName) {
    throw new Error("Birthplace is required.");
  }

  const timeZone = input.timeZone.trim();
  if (!isValidTimeZone(timeZone)) {
    throw new Error("Use a valid IANA time zone such as Asia/Kolkata.");
  }

  const timezoneOffsetMinutes =
    input.timezoneOffsetMinutes ??
    resolveTimeZoneOffsetMinutes(input.birthDate, input.birthTime, timeZone);

  if (
    !Number.isInteger(timezoneOffsetMinutes) ||
    timezoneOffsetMinutes < -14 * 60 ||
    timezoneOffsetMinutes > 14 * 60
  ) {
    throw new Error(
      "Time-zone offset must be between UTC-14:00 and UTC+14:00.",
    );
  }

  return {
    placeName,
    latitude: roundCoordinate(input.latitude),
    longitude: roundCoordinate(input.longitude),
    timeZone,
    timezoneOffsetMinutes,
  };
}

export function resolveTimeZoneOffsetMinutes(
  birthDate: string,
  birthTime: string,
  timeZone: string,
) {
  const localParts = parseLocalDateTime(birthDate, birthTime);
  const localTimestamp = Date.UTC(
    localParts.year,
    localParts.month - 1,
    localParts.day,
    localParts.hour,
    localParts.minute,
    0,
    0,
  );
  const matchingOffsets = getMatchingOffsets(
    localTimestamp,
    localParts,
    timeZone,
  );

  if (matchingOffsets.length === 1) {
    return matchingOffsets[0] as number;
  }

  if (matchingOffsets.length > 1) {
    throw new Error(
      "The local birth time is ambiguous in that time zone because the clock changed. Enable manual UTC offset and choose the recorded offset.",
    );
  }

  const fallbackOffset = getOffsetForInstant(localTimestamp, timeZone);
  const fallbackUtc = localTimestamp - fallbackOffset * 60_000;
  const fallbackParts = getPartsInTimeZone(fallbackUtc, timeZone);
  if (!sameWallClock(localParts, fallbackParts)) {
    throw new Error(
      "The local birth time does not exist in that time zone, likely because of a daylight-saving transition.",
    );
  }

  return fallbackOffset;
}

export function isValidTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

function assertCoordinate(
  value: number,
  minimum: number,
  maximum: number,
  name: string,
) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(
      `${name} must be a number from ${minimum.toString()} to ${maximum.toString()}.`,
    );
  }
}

function roundCoordinate(value: number) {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function parseLocalDateTime(birthDate: string, birthTime: string): DateParts {
  const dateMatch = LOCAL_DATE_PATTERN.exec(birthDate);
  const timeMatch = LOCAL_TIME_PATTERN.exec(birthTime);

  if (!dateMatch || !timeMatch) {
    throw new Error("Birth date and time must use YYYY-MM-DD and HH:mm.");
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
    throw new Error("Birth date or time is invalid.");
  }

  return parts;
}

function getOffsetForInstant(instantMs: number, timeZone: string) {
  const zoned = getPartsInTimeZone(instantMs, timeZone);
  const zonedAsUtc = Date.UTC(
    zoned.year,
    zoned.month - 1,
    zoned.day,
    zoned.hour,
    zoned.minute,
    0,
    0,
  );

  return Math.round((zonedAsUtc - instantMs) / 60_000);
}

function getPartsInTimeZone(instantMs: number, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(new Date(instantMs))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

function getMatchingOffsets(
  localTimestamp: number,
  localParts: DateParts,
  timeZone: string,
) {
  const candidateOffsets = new Set<number>();

  for (let minutes = -36 * 60; minutes <= 36 * 60; minutes += 30) {
    candidateOffsets.add(
      getOffsetForInstant(localTimestamp + minutes * 60_000, timeZone),
    );
  }

  return Array.from(candidateOffsets)
    .filter((offsetMinutes) => {
      const candidateUtc = localTimestamp - offsetMinutes * 60_000;
      const resolvedParts = getPartsInTimeZone(candidateUtc, timeZone);
      return sameWallClock(localParts, resolvedParts);
    })
    .sort((a, b) => a - b);
}

function sameWallClock(a: DateParts, b: DateParts) {
  return (
    a.year === b.year &&
    a.month === b.month &&
    a.day === b.day &&
    a.hour === b.hour &&
    a.minute === b.minute
  );
}
