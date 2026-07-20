#pragma once

#include <string>

namespace kundli {

struct RawBodyPosition {
  double tropicalLongitude = 0.0;
  double latitude = 0.0;
};

// Load LSK + DE442s SPK from KUNDLI_SPICE_KERNEL_DIR (or default assets path).
void ensureSpiceKernelsLoaded();

// Convert a UTC ISO-8601 instant (YYYY-MM-DDTHH:MM:SS.sssZ) to SPICE ET.
double etFromUtcIso(const std::string& utcIso);

// Apparent geocentric tropical ecliptic-of-date lon/lat for chart bodies.
RawBodyPosition spiceGeocentricBody(const std::string& key, double et);

}  // namespace kundli
