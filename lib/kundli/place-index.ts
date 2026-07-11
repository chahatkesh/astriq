import allCities, { type AllTheCitiesRecord } from "all-the-cities";
import tzlookup from "tz-lookup";

export type PlaceCandidate = {
  /** Stable GeoNames city id as a string. */
  id: string;
  /** Display name including country context for disambiguation. */
  label: string;
  name: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  /** IANA time zone derived from the coordinates. */
  timeZone: string;
};

const MAX_PLACE_RESULTS = 8;

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

type IndexedCity = {
  record: AllTheCitiesRecord;
  /** Lowercased name used for matching. */
  search: string;
};

let cityIndex: IndexedCity[] | null = null;
let cityById: Map<string, AllTheCitiesRecord> | null = null;

/**
 * Lazily build the in-memory search index from the offline `all-the-cities`
 * dataset (~135k cities, population > 1000). The dataset is a static local
 * asset, so this needs no network or secrets and stays deterministic, but we
 * defer the work to first use to keep module import and `next build` cheap.
 */
function getCityIndex(): IndexedCity[] {
  if (!cityIndex) {
    cityIndex = allCities.map((record) => ({
      record,
      search: record.name.toLowerCase(),
    }));
  }

  return cityIndex;
}

function getCityById(id: string): AllTheCitiesRecord | undefined {
  if (!cityById) {
    cityById = new Map(
      allCities.map((record) => [record.cityId.toString(), record]),
    );
  }

  return cityById.get(id);
}

/**
 * Deterministic offline place search.
 *
 * Ranking: exact name match first, then prefix match, then substring match.
 * Within the same tier, higher-population cities rank first so the most likely
 * birthplace surfaces at the top. Ties break alphabetically by name for stable
 * ordering. Time zones are resolved from coordinates only for the returned
 * candidates, keeping per-keystroke cost low.
 */
export function searchPlaceRecords(query: string): PlaceCandidate[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length < 2) {
    return [];
  }

  return getCityIndex()
    .map((entry) => ({
      entry,
      score: scoreCity(entry.search, normalizedQuery),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (b.entry.record.population !== a.entry.record.population) {
        return b.entry.record.population - a.entry.record.population;
      }

      return a.entry.record.name.localeCompare(b.entry.record.name);
    })
    .slice(0, MAX_PLACE_RESULTS)
    .map((item) => toPlaceCandidate(item.entry.record));
}

export function getPlaceRecordById(id: string): PlaceCandidate | null {
  const record = getCityById(id);
  return record ? toPlaceCandidate(record) : null;
}

function scoreCity(name: string, query: string): number {
  if (name === query) {
    return 100;
  }

  if (name.startsWith(query)) {
    return 80;
  }

  if (name.includes(query)) {
    return 40;
  }

  return 0;
}

function toPlaceCandidate(record: AllTheCitiesRecord): PlaceCandidate {
  const [longitude, latitude] = record.loc.coordinates;
  const country = countryName(record.country);

  return {
    id: record.cityId.toString(),
    label: `${record.name}, ${country}`,
    name: record.name,
    country,
    countryCode: record.country,
    latitude,
    longitude,
    timeZone: tzlookup(latitude, longitude),
  };
}

function countryName(countryCode: string): string {
  try {
    return regionNames.of(countryCode) ?? countryCode;
  } catch {
    return countryCode;
  }
}
