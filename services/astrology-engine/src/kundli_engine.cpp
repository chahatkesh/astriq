#include "kundli_engine.hpp"

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
constexpr const char* kEngineVersion = "0.1.0";
constexpr const char* kJplSpiceBackend = "jpl_spice";
constexpr const char* kReferenceProfileId = "vedic-lahiri-jpl-de441-v1";
constexpr const char* kReferenceProfileLabel =
  "Vedic Lahiri JPL DE441 profile";
constexpr const char* kReferencePrecision = "reference";
constexpr const char* kReferenceEphemeris = "NASA/JPL DE441";
constexpr const char* kReferencePlanetPositionSource =
  "JPL DE441 geocentric apparent states";
constexpr const char* kReferenceAyanamshaModel =
  "Mean Lahiri approximation";
constexpr const char* kReferenceHouseModel =
  "Whole sign from sidereal ascendant";
constexpr const char* kReferenceNodeModel = "Mean lunar nodes";
constexpr const char* kReferenceExpectedTolerance =
  "Reference profile backed by JPL DE441 planetary states.";

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

struct OrbitalElements {
  double N = 0.0;
  double i = 0.0;
  double w = 0.0;
  double a = 0.0;
  double e = 0.0;
  double M = 0.0;
};

struct EclipticVector {
  double x = 0.0;
  double y = 0.0;
  double z = 0.0;
  double longitude = 0.0;
  double latitude = 0.0;
  double radius = 0.0;
};

struct RawBodyPosition {
  double tropicalLongitude = 0.0;
  double latitude = 0.0;
};

double degToRad(double degrees) {
  return degrees * kPi / 180.0;
}

double radToDeg(double radians) {
  return radians * 180.0 / kPi;
}

double sinDeg(double degrees) {
  return std::sin(degToRad(degrees));
}

double cosDeg(double degrees) {
  return std::cos(degToRad(degrees));
}

double atan2Deg(double y, double x) {
  return radToDeg(std::atan2(y, x));
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

double eccentricAnomaly(double meanAnomalyDegrees, double eccentricity) {
  const double meanAnomaly = degToRad(normalizeDegrees(meanAnomalyDegrees));
  double eccentricAnomaly =
      meanAnomaly + eccentricity * std::sin(meanAnomaly) *
                        (1.0 + eccentricity * std::cos(meanAnomaly));

  for (int i = 0; i < 8; i += 1) {
    const double delta =
        (eccentricAnomaly - eccentricity * std::sin(eccentricAnomaly) -
         meanAnomaly) /
        (1.0 - eccentricity * std::cos(eccentricAnomaly));
    eccentricAnomaly -= delta;

    if (std::abs(delta) < 1e-10) {
      break;
    }
  }

  return eccentricAnomaly;
}

EclipticVector heliocentricFromElements(const OrbitalElements& elements) {
  const double eccentric = eccentricAnomaly(elements.M, elements.e);
  const double xv = elements.a * (std::cos(eccentric) - elements.e);
  const double yv =
      elements.a * (std::sqrt(1.0 - elements.e * elements.e) *
                    std::sin(eccentric));
  const double trueAnomaly = std::atan2(yv, xv);
  const double radius = std::sqrt(xv * xv + yv * yv);
  const double argument = trueAnomaly + degToRad(elements.w);
  const double node = degToRad(elements.N);
  const double inclination = degToRad(elements.i);

  EclipticVector vector;
  vector.x = radius * (std::cos(node) * std::cos(argument) -
                       std::sin(node) * std::sin(argument) *
                           std::cos(inclination));
  vector.y = radius * (std::sin(node) * std::cos(argument) +
                       std::cos(node) * std::sin(argument) *
                           std::cos(inclination));
  vector.z = radius * (std::sin(argument) * std::sin(inclination));
  vector.longitude = normalizeDegrees(atan2Deg(vector.y, vector.x));
  vector.latitude =
      atan2Deg(vector.z, std::sqrt(vector.x * vector.x + vector.y * vector.y));
  vector.radius = radius;
  return vector;
}

OrbitalElements elementsFor(const std::string& key, double days) {
  if (key == "earth") {
    return {0.0,
            0.0,
            282.9404 + 4.70935e-5 * days,
            1.000000,
            0.016709 - 1.151e-9 * days,
            356.0470 + 0.9856002585 * days};
  }

  if (key == "mercury") {
    return {48.3313 + 3.24587e-5 * days,
            7.0047 + 5.00e-8 * days,
            29.1241 + 1.01444e-5 * days,
            0.387098,
            0.205635 + 5.59e-10 * days,
            168.6562 + 4.0923344368 * days};
  }

  if (key == "venus") {
    return {76.6799 + 2.46590e-5 * days,
            3.3946 + 2.75e-8 * days,
            54.8910 + 1.38374e-5 * days,
            0.723330,
            0.006773 - 1.302e-9 * days,
            48.0052 + 1.6021302244 * days};
  }

  if (key == "mars") {
    return {49.5574 + 2.11081e-5 * days,
            1.8497 - 1.78e-8 * days,
            286.5016 + 2.92961e-5 * days,
            1.523688,
            0.093405 + 2.516e-9 * days,
            18.6021 + 0.5240207766 * days};
  }

  if (key == "jupiter") {
    return {100.4542 + 2.76854e-5 * days,
            1.3030 - 1.557e-7 * days,
            273.8777 + 1.64505e-5 * days,
            5.20256,
            0.048498 + 4.469e-9 * days,
            19.8950 + 0.0830853001 * days};
  }

  if (key == "saturn") {
    return {113.6634 + 2.38980e-5 * days,
            2.4886 - 1.081e-7 * days,
            339.3939 + 2.97661e-5 * days,
            9.55475,
            0.055546 - 9.499e-9 * days,
            316.9670 + 0.0334442282 * days};
  }

  throw std::runtime_error("Unsupported orbital body: " + key);
}

RawBodyPosition geocentricPlanet(const std::string& key, double julianDay) {
  const double days = julianDay - 2451543.5;
  const EclipticVector sun =
      heliocentricFromElements(elementsFor("earth", days));

  if (key == "sun") {
    return {sun.longitude, 0.0};
  }

  const OrbitalElements elements = elementsFor(key, days);
  const EclipticVector planet = heliocentricFromElements(elements);
  const double xg = planet.x + sun.x;
  const double yg = planet.y + sun.y;
  const double zg = planet.z + sun.z;
  double longitude = normalizeDegrees(atan2Deg(yg, xg));
  double latitude = atan2Deg(zg, std::sqrt(xg * xg + yg * yg));

  if (key == "jupiter" || key == "saturn") {
    const double jupiterMean = elementsFor("jupiter", days).M;
    const double saturnMean = elementsFor("saturn", days).M;

    if (key == "jupiter") {
      longitude += -0.332 *
                       sinDeg(2.0 * jupiterMean - 5.0 * saturnMean - 67.6) -
                   0.056 *
                       sinDeg(2.0 * jupiterMean - 2.0 * saturnMean + 21.0) +
                   0.042 *
                       sinDeg(3.0 * jupiterMean - 5.0 * saturnMean + 21.0) -
                   0.036 * sinDeg(jupiterMean - 2.0 * saturnMean) +
                   0.022 * cosDeg(jupiterMean - saturnMean) +
                   0.023 *
                       sinDeg(2.0 * jupiterMean - 3.0 * saturnMean + 52.0) -
                   0.016 * sinDeg(jupiterMean - 5.0 * saturnMean - 69.0);
    } else {
      longitude += 0.812 *
                       sinDeg(2.0 * jupiterMean - 5.0 * saturnMean - 67.6) -
                   0.229 *
                       cosDeg(2.0 * jupiterMean - 4.0 * saturnMean - 2.0) +
                   0.119 * sinDeg(jupiterMean - 2.0 * saturnMean - 3.0) +
                   0.046 *
                       sinDeg(2.0 * jupiterMean - 6.0 * saturnMean - 69.0) +
                   0.014 * sinDeg(jupiterMean - 3.0 * saturnMean + 32.0);
      latitude += -0.020 *
                      cosDeg(2.0 * jupiterMean - 4.0 * saturnMean - 2.0) +
                  0.018 *
                      sinDeg(2.0 * jupiterMean - 6.0 * saturnMean - 49.0);
    }
  }

  return {normalizeDegrees(longitude), latitude};
}

RawBodyPosition geocentricMoon(double julianDay) {
  const double days = julianDay - 2451543.5;
  const double node = 125.1228 - 0.0529538083 * days;
  const double inclination = 5.1454;
  const double perigee = 318.0634 + 0.1643573223 * days;
  const double eccentricity = 0.054900;
  const double meanAnomaly = 115.3654 + 13.0649929509 * days;
  const OrbitalElements elements{
      node, inclination, perigee, 60.2666, eccentricity, meanAnomaly};
  const EclipticVector moon = heliocentricFromElements(elements);

  const OrbitalElements earth = elementsFor("earth", days);
  const double sunMean = earth.M;
  const double sunMeanLongitude = normalizeDegrees(earth.w + earth.M);
  const double moonMeanLongitude =
      normalizeDegrees(node + perigee + meanAnomaly);
  const double elongation = normalizeDegrees(moonMeanLongitude - sunMeanLongitude);
  const double argumentLatitude = normalizeDegrees(moonMeanLongitude - node);

  double longitude =
      moon.longitude - 1.274 * sinDeg(meanAnomaly - 2.0 * elongation) +
      0.658 * sinDeg(2.0 * elongation) - 0.186 * sinDeg(sunMean) -
      0.059 * sinDeg(2.0 * meanAnomaly - 2.0 * elongation) -
      0.057 * sinDeg(meanAnomaly - 2.0 * elongation + sunMean) +
      0.053 * sinDeg(meanAnomaly + 2.0 * elongation) +
      0.046 * sinDeg(2.0 * elongation - sunMean) +
      0.041 * sinDeg(meanAnomaly - sunMean) -
      0.035 * sinDeg(elongation) -
      0.031 * sinDeg(meanAnomaly + sunMean) -
      0.015 * sinDeg(2.0 * argumentLatitude - 2.0 * elongation) +
      0.011 * sinDeg(meanAnomaly - 4.0 * elongation);

  double latitude =
      moon.latitude - 0.173 * sinDeg(argumentLatitude - 2.0 * elongation) -
      0.055 * sinDeg(meanAnomaly - argumentLatitude - 2.0 * elongation) -
      0.046 * sinDeg(meanAnomaly + argumentLatitude - 2.0 * elongation) +
      0.033 * sinDeg(argumentLatitude + 2.0 * elongation) +
      0.017 * sinDeg(2.0 * meanAnomaly + argumentLatitude);

  return {normalizeDegrees(longitude), latitude};
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
    RawBodyPosition nextRaw = geocentricPlanet(key, julianDay + 1.0);
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
  const double julianDay = julianDayFromLocal(
      input.birthDate, input.birthTime, input.timezoneOffsetMinutes);
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
      utcIsoFromLocal(input.birthDate, input.birthTime, input.timezoneOffsetMinutes),
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
      "sun", "Sun", geocentricPlanet("sun", julianDay), julianDay, ayanamsha,
      ascendantSign));
  chart.planets.push_back(buildPlanet(
      "moon", "Moon", geocentricMoon(julianDay), julianDay, ayanamsha,
      ascendantSign));
  chart.planets.push_back(buildPlanet(
      "mars", "Mars", geocentricPlanet("mars", julianDay), julianDay,
      ayanamsha, ascendantSign));
  chart.planets.push_back(buildPlanet(
      "mercury", "Mercury", geocentricPlanet("mercury", julianDay), julianDay,
      ayanamsha, ascendantSign));
  chart.planets.push_back(buildPlanet(
      "jupiter", "Jupiter", geocentricPlanet("jupiter", julianDay), julianDay,
      ayanamsha, ascendantSign));
  chart.planets.push_back(buildPlanet(
      "venus", "Venus", geocentricPlanet("venus", julianDay), julianDay,
      ayanamsha, ascendantSign));
  chart.planets.push_back(buildPlanet(
      "saturn", "Saturn", geocentricPlanet("saturn", julianDay), julianDay,
      ayanamsha, ascendantSign));
  chart.planets.push_back(buildPlanet(
      "rahu", "Rahu", lunarNode(julianDay, false), julianDay, ayanamsha,
      ascendantSign));
  chart.planets.push_back(buildPlanet(
      "ketu", "Ketu", lunarNode(julianDay, true), julianDay, ayanamsha,
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
