#include "kundli_engine.hpp"
#include "spice_ephemeris.hpp"

#include <algorithm>
#include <cmath>
#include <iomanip>
#include <regex>
#include <sstream>
#include <stdexcept>

namespace kundli {
namespace {

constexpr double kPi = 3.141592653589793238462643383279502884;
constexpr double kUnixEpochJulianDay = 2440587.5;
constexpr double kSecondsPerDay = 86400.0;
constexpr const char* kEngineVersion = "1.0.0";
constexpr const char* kJplSpiceBackend = "jpl_spice";
constexpr const char* kReferenceProfileId = "vedic-lahiri-jpl-de442s-v1";
constexpr const char* kReferenceProfileLabel =
  "Vedic Lahiri JPL DE442s SPICE profile";
constexpr const char* kReferencePrecision = "reference";
constexpr const char* kReferenceEphemeris = "NASA/JPL DE442s SPK";
constexpr const char* kReferencePlanetPositionSource =
  "NAIF SPICE apparent geocentric states (CN+S), ecliptic of date";
constexpr const char* kReferenceAyanamshaModel =
  "Mean Lahiri approximation";
constexpr const char* kReferenceHouseModel =
  "Whole sign from sidereal ascendant";
constexpr const char* kReferenceNodeModel = "Mean lunar nodes";
constexpr const char* kReferenceExpectedTolerance =
  "Reference profile backed by JPL DE442s SPICE planetary states.";

const char* kSigns[12] = {
    "Aries",      "Taurus",    "Gemini", "Cancer",
    "Leo",        "Virgo",     "Libra",  "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces",
};

const char* kNakshatras[27] = {
    "Ashwini",          "Bharani",          "Krittika",
    "Rohini",           "Mrigashira",       "Ardra",
    "Punarvasu",        "Pushya",           "Ashlesha",
    "Magha",            "Purva Phalguni",   "Uttara Phalguni",
    "Hasta",            "Chitra",           "Swati",
    "Vishakha",         "Anuradha",         "Jyeshtha",
    "Mula",             "Purva Ashadha",    "Uttara Ashadha",
    "Shravana",         "Dhanishta",        "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
};

struct CivilDateTime {
  int year = 1970;
  int month = 1;
  int day = 1;
  int hour = 0;
  int minute = 0;
};

double degToRad(double degrees) {
  return degrees * kPi / 180.0;
}

double radToDeg(double radians) {
  return radians * 180.0 / kPi;
}

double signedLongitudeDelta(double next, double current) {
  double delta = normalizeDegrees(next - current);
  if (delta > 180.0) {
    delta -= 360.0;
  }
  return delta;
}

std::string unescapeJsonString(const std::string& input) {
  std::string output;
  output.reserve(input.size());

  for (std::size_t i = 0; i < input.size(); i += 1) {
    if (input[i] == '\\' && i + 1 < input.size()) {
      const char escaped = input[i + 1];
      if (escaped == '"' || escaped == '\\' || escaped == '/') {
        output.push_back(escaped);
      } else if (escaped == 'b') {
        output.push_back('\b');
      } else if (escaped == 'f') {
        output.push_back('\f');
      } else if (escaped == 'n') {
        output.push_back('\n');
      } else if (escaped == 'r') {
        output.push_back('\r');
      } else if (escaped == 't') {
        output.push_back('\t');
      }
      i += 1;
      continue;
    }

    output.push_back(input[i]);
  }

  return output;
}

std::string requireString(const std::string& json, const std::string& key) {
  const std::regex pattern(
      "\"" + key + "\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");
  std::smatch match;

  if (!std::regex_search(json, match, pattern)) {
    throw std::runtime_error("Missing string field: " + key);
  }

  return unescapeJsonString(match[1].str());
}

std::string optionalString(
    const std::string& json,
    const std::string& key,
    const std::string& fallback) {
  const std::regex pattern(
      "\"" + key + "\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");
  std::smatch match;

  if (!std::regex_search(json, match, pattern)) {
    return fallback;
  }

  return unescapeJsonString(match[1].str());
}

double requireNumber(const std::string& json, const std::string& key) {
  const std::regex pattern(
      "\"" + key + "\"\\s*:\\s*(-?(?:\\d+\\.?\\d*|\\d*\\.\\d+))");
  std::smatch match;

  if (!std::regex_search(json, match, pattern)) {
    throw std::runtime_error("Missing numeric field: " + key);
  }

  return std::stod(match[1].str());
}

int requireInteger(const std::string& json, const std::string& key) {
  const std::regex pattern("\"" + key + "\"\\s*:\\s*(-?\\d+)");
  std::smatch match;

  if (!std::regex_search(json, match, pattern)) {
    throw std::runtime_error("Missing integer field: " + key);
  }

  return std::stoi(match[1].str());
}

CivilDateTime parseLocalDateTime(
    const std::string& birthDate,
    const std::string& birthTime) {
  const std::regex datePattern("^(\\d{4})-(\\d{2})-(\\d{2})$");
  const std::regex timePattern("^(\\d{2}):(\\d{2})$");
  std::smatch dateMatch;
  std::smatch timeMatch;

  if (!std::regex_match(birthDate, dateMatch, datePattern) ||
      !std::regex_match(birthTime, timeMatch, timePattern)) {
    throw std::runtime_error("Birth date/time must use YYYY-MM-DD and HH:mm.");
  }

  CivilDateTime value;
  value.year = std::stoi(dateMatch[1].str());
  value.month = std::stoi(dateMatch[2].str());
  value.day = std::stoi(dateMatch[3].str());
  value.hour = std::stoi(timeMatch[1].str());
  value.minute = std::stoi(timeMatch[2].str());

  if (value.month < 1 || value.month > 12 || value.day < 1 || value.day > 31 ||
      value.hour < 0 || value.hour > 23 || value.minute < 0 ||
      value.minute > 59) {
    throw std::runtime_error("Birth date/time is out of range.");
  }

  return value;
}

long long floorDiv(long long value, long long divisor) {
  long long quotient = value / divisor;
  long long remainder = value % divisor;

  if (remainder != 0 && ((remainder > 0) != (divisor > 0))) {
    quotient -= 1;
  }

  return quotient;
}

long long daysFromCivil(int year, unsigned month, unsigned day) {
  year -= month <= 2;
  const int era = (year >= 0 ? year : year - 399) / 400;
  const unsigned yoe = static_cast<unsigned>(year - era * 400);
  const unsigned doy =
      (153 * (month + (month > 2 ? -3 : 9)) + 2) / 5 + day - 1;
  const unsigned doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
  return era * 146097 + static_cast<int>(doe) - 719468;
}

CivilDateTime civilFromDays(long long z) {
  z += 719468;
  const long long era = (z >= 0 ? z : z - 146096) / 146097;
  const unsigned doe = static_cast<unsigned>(z - era * 146097);
  const unsigned yoe =
      (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
  long long y = static_cast<long long>(yoe) + era * 400;
  const unsigned doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
  const unsigned mp = (5 * doy + 2) / 153;
  const unsigned d = doy - (153 * mp + 2) / 5 + 1;
  const unsigned m = mp + (mp < 10 ? 3 : -9);
  y += m <= 2;

  CivilDateTime value;
  value.year = static_cast<int>(y);
  value.month = static_cast<int>(m);
  value.day = static_cast<int>(d);
  return value;
}

std::string utcIsoFromLocal(
    const std::string& birthDate,
    const std::string& birthTime,
    int timezoneOffsetMinutes) {
  const CivilDateTime local = parseLocalDateTime(birthDate, birthTime);
  const long long localDays =
      daysFromCivil(local.year, local.month, local.day);
  const long long localTotalMinutes =
      localDays * 1440LL + local.hour * 60LL + local.minute;
  const long long utcTotalMinutes =
      localTotalMinutes - static_cast<long long>(timezoneOffsetMinutes);
  const long long utcDays = floorDiv(utcTotalMinutes, 1440LL);
  const long long minuteOfDay = utcTotalMinutes - utcDays * 1440LL;
  CivilDateTime utc = civilFromDays(utcDays);
  utc.hour = static_cast<int>(minuteOfDay / 60LL);
  utc.minute = static_cast<int>(minuteOfDay % 60LL);

  std::ostringstream output;
  output << std::setfill('0') << std::setw(4) << utc.year << "-"
         << std::setw(2) << utc.month << "-" << std::setw(2) << utc.day
         << "T" << std::setw(2) << utc.hour << ":" << std::setw(2)
         << utc.minute << ":00.000Z";
  return output.str();
}

std::string localDateTimeLabel(
    const std::string& birthDate,
    const std::string& birthTime) {
  return birthDate + "T" + birthTime + ":00";
}

RawBodyPosition lunarNode(double julianDay, bool southNode) {
  const double centuries = (julianDay - 2451545.0) / 36525.0;
  const double northNode =
      125.04452 - 1934.136261 * centuries + 0.0020708 * centuries * centuries +
      centuries * centuries * centuries / 450000.0;
  return {normalizeDegrees(northNode + (southNode ? 180.0 : 0.0)), 0.0};
}

double meanObliquity(double julianDay) {
  const double centuries = (julianDay - 2451545.0) / 36525.0;
  return 23.439291111 - 0.013004167 * centuries -
         0.000000164 * centuries * centuries +
         0.000000504 * centuries * centuries * centuries;
}

double ascendantLongitude(
    double julianDay,
    double latitude,
    double longitude,
    double ayanamshaDegrees) {
  const double centuries = (julianDay - 2451545.0) / 36525.0;
  const double greenwichSidereal =
      280.46061837 + 360.98564736629 * (julianDay - 2451545.0) +
      0.000387933 * centuries * centuries -
      centuries * centuries * centuries / 38710000.0;
  const double localSidereal = degToRad(normalizeDegrees(
      greenwichSidereal + longitude));
  const double obliquity = degToRad(meanObliquity(julianDay));
  const double latitudeRad = degToRad(latitude);

  const double ascendantTropical =
      normalizeDegrees(radToDeg(std::atan2(
                           -std::cos(localSidereal),
                           std::sin(localSidereal) * std::cos(obliquity) +
                               std::tan(latitudeRad) * std::sin(obliquity))) +
                       180.0);

  return normalizeDegrees(ascendantTropical - ayanamshaDegrees);
}

Placement buildPlacement(double siderealLongitude) {
  const double longitude = normalizeDegrees(siderealLongitude);
  const int signIndex = zodiacSignIndex(longitude);
  const double degreeInSign = longitude - signIndex * 30.0;
  const double nakshatraSize = 360.0 / 27.0;
  const double padaSize = 360.0 / 108.0;
  int nakshatraIndex = static_cast<int>(std::floor(longitude / nakshatraSize));
  if (nakshatraIndex < 0) {
    nakshatraIndex = 0;
  } else if (nakshatraIndex > 26) {
    nakshatraIndex = 26;
  }

  const int pada =
      static_cast<int>(std::floor((longitude - nakshatraIndex * nakshatraSize) /
                                  padaSize)) +
      1;

  return {
      longitude,
      kSigns[signIndex],
      degreeInSign,
      {kNakshatras[nakshatraIndex], std::max(1, std::min(4, pada))},
  };
}

PlanetPosition buildPlanet(
    const std::string& key,
    const std::string& name,
    RawBodyPosition raw,
    double julianDay,
    double et,
    double ayanamshaDegrees,
    int ascendantSign) {
  const double sidereal = normalizeDegrees(raw.tropicalLongitude - ayanamshaDegrees);
  const Placement placement = buildPlacement(sidereal);
  const int signIndex = zodiacSignIndex(sidereal);
  const int house = ((signIndex - ascendantSign + 12) % 12) + 1;
  bool retrograde = false;

  if (key == "rahu" || key == "ketu") {
    retrograde = true;
  } else if (key != "sun" && key != "moon") {
    const double nextAyanamsha = lahiriAyanamsha(julianDay + 1.0);
    const RawBodyPosition nextRaw =
        spiceGeocentricBody(key, et + kSecondsPerDay);
    const double nextSidereal =
        normalizeDegrees(nextRaw.tropicalLongitude - nextAyanamsha);
    retrograde = signedLongitudeDelta(nextSidereal, sidereal) < 0.0;
  }

  PlanetPosition planet;
  planet.longitude = placement.longitude;
  planet.sign = placement.sign;
  planet.degreeInSign = placement.degreeInSign;
  planet.nakshatra = placement.nakshatra;
  planet.key = key;
  planet.name = name;
  planet.tropicalLongitude = normalizeDegrees(raw.tropicalLongitude);
  planet.latitude = raw.latitude;
  planet.house = house;
  planet.retrograde = retrograde;
  return planet;
}

std::string jsonEscape(const std::string& value) {
  std::ostringstream output;

  for (char c : value) {
    switch (c) {
      case '"':
        output << "\\\"";
        break;
      case '\\':
        output << "\\\\";
        break;
      case '\b':
        output << "\\b";
        break;
      case '\f':
        output << "\\f";
        break;
      case '\n':
        output << "\\n";
        break;
      case '\r':
        output << "\\r";
        break;
      case '\t':
        output << "\\t";
        break;
      default:
        if (static_cast<unsigned char>(c) < 0x20) {
          output << "\\u" << std::hex << std::setw(4) << std::setfill('0')
                 << static_cast<int>(c);
        } else {
          output << c;
        }
    }
  }

  return output.str();
}

std::string jsonString(const std::string& value) {
  return "\"" + jsonEscape(value) + "\"";
}

std::string jsonNumber(double value) {
  std::ostringstream output;
  output << std::fixed << std::setprecision(6) << value;
  return output.str();
}

std::string placementJson(const Placement& placement) {
  std::ostringstream output;
  output << "{\"longitude\":" << jsonNumber(placement.longitude)
         << ",\"sign\":" << jsonString(placement.sign)
         << ",\"degreeInSign\":" << jsonNumber(placement.degreeInSign)
         << ",\"nakshatra\":{\"name\":"
         << jsonString(placement.nakshatra.name)
         << ",\"pada\":" << placement.nakshatra.pada << "}}";
  return output.str();
}

}  // namespace

BirthChartInput parseInputJson(const std::string& json) {
  BirthChartInput input;
  input.subjectName = optionalString(json, "subjectName", "");
  input.birthDate = requireString(json, "birthDate");
  input.birthTime = requireString(json, "birthTime");
  input.placeName = requireString(json, "placeName");
  input.timeZone = requireString(json, "timeZone");
  input.ayanamsha = optionalString(json, "ayanamsha", "lahiri");
  input.houseSystem = optionalString(json, "houseSystem", "whole_sign");
  input.engineBackend =
      optionalString(json, "engineBackend", kJplSpiceBackend);
  input.latitude = requireNumber(json, "latitude");
  input.longitude = requireNumber(json, "longitude");
  input.timezoneOffsetMinutes = requireInteger(json, "timezoneOffsetMinutes");

  if (input.ayanamsha != "lahiri") {
    throw std::runtime_error("Only Lahiri ayanamsha is supported.");
  }

  if (input.houseSystem != "whole_sign") {
    throw std::runtime_error("Only whole sign houses are supported.");
  }

  if (input.engineBackend != kJplSpiceBackend) {
    throw std::runtime_error("Engine backend must be jpl_spice.");
  }

  return input;
}

BirthChart calculateBirthChart(const BirthChartInput& input) {
  ensureSpiceKernelsLoaded();

  const double julianDay = julianDayFromLocal(
      input.birthDate, input.birthTime, input.timezoneOffsetMinutes);
  const std::string utcIso = utcIsoFromLocal(
      input.birthDate, input.birthTime, input.timezoneOffsetMinutes);
  const double et = etFromUtcIso(utcIso);
  const double ayanamsha = lahiriAyanamsha(julianDay);
  const double ascendant = ascendantLongitude(
      julianDay, input.latitude, input.longitude, ayanamsha);
  const int ascendantSign = zodiacSignIndex(ascendant);

  BirthChart chart;
  chart.subjectName = input.subjectName;
  chart.metadata = {
      kEngineVersion,
      {
        kReferenceProfileId,
        kReferenceProfileLabel,
        kReferencePrecision,
        kReferenceEphemeris,
        kReferencePlanetPositionSource,
        kReferenceAyanamshaModel,
        kReferenceHouseModel,
        kReferenceNodeModel,
        kReferenceExpectedTolerance,
      },
      kJplSpiceBackend,
      "lahiri",
      ayanamsha,
      "sidereal",
      "whole_sign",
      kReferenceEphemeris,
      localDateTimeLabel(input.birthDate, input.birthTime),
      utcIso,
      julianDay,
      input.placeName,
      input.latitude,
      input.longitude,
      input.timeZone,
      input.timezoneOffsetMinutes,
      {
          "Uses Lahiri sidereal zodiac with a mean ayanamsha model and whole sign houses.",
      },
  };
  chart.ascendant = buildPlacement(ascendant);

  for (int i = 0; i < 12; i += 1) {
    const int signIndex = (ascendantSign + i) % 12;
    chart.houses.push_back(
        {i + 1, kSigns[signIndex], signIndex * 30.0, {}});
  }

  chart.planets.push_back(buildPlanet(
      "sun", "Sun", spiceGeocentricBody("sun", et), julianDay, et, ayanamsha,
      ascendantSign));
  chart.planets.push_back(buildPlanet(
      "moon", "Moon", spiceGeocentricBody("moon", et), julianDay, et, ayanamsha,
      ascendantSign));
  chart.planets.push_back(buildPlanet(
      "mars", "Mars", spiceGeocentricBody("mars", et), julianDay, et,
      ayanamsha, ascendantSign));
  chart.planets.push_back(buildPlanet(
      "mercury", "Mercury", spiceGeocentricBody("mercury", et), julianDay, et,
      ayanamsha, ascendantSign));
  chart.planets.push_back(buildPlanet(
      "jupiter", "Jupiter", spiceGeocentricBody("jupiter", et), julianDay, et,
      ayanamsha, ascendantSign));
  chart.planets.push_back(buildPlanet(
      "venus", "Venus", spiceGeocentricBody("venus", et), julianDay, et,
      ayanamsha, ascendantSign));
  chart.planets.push_back(buildPlanet(
      "saturn", "Saturn", spiceGeocentricBody("saturn", et), julianDay, et,
      ayanamsha, ascendantSign));
  chart.planets.push_back(buildPlanet(
      "rahu", "Rahu", lunarNode(julianDay, false), julianDay, et, ayanamsha,
      ascendantSign));
  chart.planets.push_back(buildPlanet(
      "ketu", "Ketu", lunarNode(julianDay, true), julianDay, et, ayanamsha,
      ascendantSign));

  for (const PlanetPosition& planet : chart.planets) {
    chart.houses[planet.house - 1].planets.push_back(planet.key);
  }

  return chart;
}

std::string chartToJson(const BirthChart& chart) {
  std::ostringstream output;
  output << "{";

  if (!chart.subjectName.empty()) {
    output << "\"subjectName\":" << jsonString(chart.subjectName) << ",";
  }

  output << "\"metadata\":{";
  output << "\"engineVersion\":" << jsonString(chart.metadata.engineVersion)
         << ",\"calculationProfile\":{"
         << "\"id\":" << jsonString(chart.metadata.calculationProfile.id)
         << ",\"label\":"
         << jsonString(chart.metadata.calculationProfile.label)
         << ",\"precision\":"
         << jsonString(chart.metadata.calculationProfile.precision)
         << ",\"ephemeris\":"
         << jsonString(chart.metadata.calculationProfile.ephemeris)
         << ",\"planetPositionSource\":"
         << jsonString(
                chart.metadata.calculationProfile.planetPositionSource)
         << ",\"ayanamshaModel\":"
         << jsonString(chart.metadata.calculationProfile.ayanamshaModel)
         << ",\"houseModel\":"
         << jsonString(chart.metadata.calculationProfile.houseModel)
         << ",\"nodeModel\":"
         << jsonString(chart.metadata.calculationProfile.nodeModel)
         << ",\"expectedTolerance\":"
         << jsonString(chart.metadata.calculationProfile.expectedTolerance)
         << "}"
         << ",\"engineBackend\":"
         << jsonString(chart.metadata.engineBackend)
         << ",\"ayanamsha\":" << jsonString(chart.metadata.ayanamsha)
         << ",\"ayanamshaDegrees\":"
         << jsonNumber(chart.metadata.ayanamshaDegrees)
         << ",\"zodiac\":" << jsonString(chart.metadata.zodiac)
         << ",\"houseSystem\":" << jsonString(chart.metadata.houseSystem)
         << ",\"ephemeris\":" << jsonString(chart.metadata.ephemeris)
         << ",\"localDateTime\":" << jsonString(chart.metadata.localDateTime)
         << ",\"utcIso\":" << jsonString(chart.metadata.utcIso)
         << ",\"julianDay\":" << jsonNumber(chart.metadata.julianDay)
         << ",\"placeName\":" << jsonString(chart.metadata.placeName)
         << ",\"latitude\":" << jsonNumber(chart.metadata.latitude)
         << ",\"longitude\":" << jsonNumber(chart.metadata.longitude)
         << ",\"timeZone\":" << jsonString(chart.metadata.timeZone)
         << ",\"timezoneOffsetMinutes\":"
         << chart.metadata.timezoneOffsetMinutes << ",\"warnings\":[";

  for (std::size_t i = 0; i < chart.metadata.warnings.size(); i += 1) {
    if (i > 0) {
      output << ",";
    }
    output << jsonString(chart.metadata.warnings[i]);
  }

  output << "]},";
  output << "\"ascendant\":" << placementJson(chart.ascendant) << ",";
  output << "\"houses\":[";

  for (std::size_t i = 0; i < chart.houses.size(); i += 1) {
    const KundliHouse& house = chart.houses[i];
    if (i > 0) {
      output << ",";
    }
    output << "{\"number\":" << house.number
           << ",\"sign\":" << jsonString(house.sign)
           << ",\"startLongitude\":" << jsonNumber(house.startLongitude)
           << ",\"planets\":[";

    for (std::size_t j = 0; j < house.planets.size(); j += 1) {
      if (j > 0) {
        output << ",";
      }
      output << jsonString(house.planets[j]);
    }

    output << "]}";
  }

  output << "],\"planets\":[";

  for (std::size_t i = 0; i < chart.planets.size(); i += 1) {
    const PlanetPosition& planet = chart.planets[i];
    if (i > 0) {
      output << ",";
    }

    output << "{\"key\":" << jsonString(planet.key)
           << ",\"name\":" << jsonString(planet.name)
           << ",\"longitude\":" << jsonNumber(planet.longitude)
           << ",\"tropicalLongitude\":"
           << jsonNumber(planet.tropicalLongitude)
           << ",\"latitude\":" << jsonNumber(planet.latitude)
           << ",\"sign\":" << jsonString(planet.sign)
           << ",\"degreeInSign\":" << jsonNumber(planet.degreeInSign)
           << ",\"house\":" << planet.house
           << ",\"nakshatra\":{\"name\":"
           << jsonString(planet.nakshatra.name)
           << ",\"pada\":" << planet.nakshatra.pada
           << "},\"retrograde\":" << (planet.retrograde ? "true" : "false")
           << "}";
  }

  output << "]}";
  return output.str();
}

double julianDayFromLocal(
    const std::string& birthDate,
    const std::string& birthTime,
    int timezoneOffsetMinutes) {
  const CivilDateTime local = parseLocalDateTime(birthDate, birthTime);
  const long long localDays =
      daysFromCivil(local.year, local.month, local.day);
  const long long localTotalMinutes =
      localDays * 1440LL + local.hour * 60LL + local.minute;
  const long long utcTotalMinutes =
      localTotalMinutes - static_cast<long long>(timezoneOffsetMinutes);

  return kUnixEpochJulianDay +
         static_cast<double>(utcTotalMinutes) / 1440.0;
}

double lahiriAyanamsha(double julianDay) {
  const double centuries = (julianDay - 2451545.0) / 36525.0;
  return normalizeDegrees(
      23.853055 + 1.396971278 * centuries + 0.0003086 * centuries * centuries);
}

double normalizeDegrees(double degrees) {
  double normalized = std::fmod(degrees, 360.0);

  if (normalized < 0.0) {
    normalized += 360.0;
  }

  if (normalized >= 360.0) {
    normalized -= 360.0;
  }

  return normalized;
}

int zodiacSignIndex(double longitude) {
  int index = static_cast<int>(std::floor(normalizeDegrees(longitude) / 30.0));

  if (index < 0) {
    return 0;
  }

  if (index > 11) {
    return 11;
  }

  return index;
}

}  // namespace kundli
