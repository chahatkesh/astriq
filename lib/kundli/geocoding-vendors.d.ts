declare module "all-the-cities" {
  export type AllTheCitiesRecord = {
    cityId: number;
    name: string;
    altName: string;
    country: string;
    featureCode: string;
    adminCode: string;
    population: number;
    loc: {
      type: "Point";
      /** GeoJSON order: [longitude, latitude]. */
      coordinates: [number, number];
    };
  };

  const cities: AllTheCitiesRecord[];
  export default cities;
}

declare module "tz-lookup" {
  /** Returns the IANA time zone for the given latitude/longitude. */
  export default function tzlookup(latitude: number, longitude: number): string;
}
