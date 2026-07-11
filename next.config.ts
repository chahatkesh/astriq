import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // These geocoding packages read bundled binary data files (cities.pbf, tz
  // shapes) from their own package directory at runtime. Keep them external so
  // the bundler does not rewrite those file paths and break the data lookups.
  serverExternalPackages: ["all-the-cities", "tz-lookup"],
};

export default nextConfig;
