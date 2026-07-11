#pragma once

#include <string>
#include <vector>

namespace kundli {

struct BirthChartInput {
  std::string subjectName;
  std::string birthDate;
  std::string birthTime;
  std::string placeName;
  std::string timeZone;
  std::string ayanamsha = "lahiri";
  std::string houseSystem = "whole_sign";
  double latitude = 0.0;
  double longitude = 0.0;
  int timezoneOffsetMinutes = 0;
};

struct NakshatraPlacement {
  std::string name;
  int pada = 1;
};

struct Placement {
  double longitude = 0.0;
  std::string sign;
  double degreeInSign = 0.0;
  NakshatraPlacement nakshatra;
};

struct PlanetPosition : Placement {
  std::string key;
  std::string name;
  double tropicalLongitude = 0.0;
  double latitude = 0.0;
  int house = 1;
  bool retrograde = false;
};

struct KundliHouse {
  int number = 1;
  std::string sign;
  double startLongitude = 0.0;
  std::vector<std::string> planets;
};

struct CalculationProfile {
  std::string id;
  std::string label;
  std::string precision;
  std::string ephemeris;
  std::string planetPositionSource;
  std::string ayanamshaModel;
  std::string houseModel;
  std::string nodeModel;
  std::string expectedTolerance;
};

struct BirthChartMetadata {
  std::string engineVersion;
  CalculationProfile calculationProfile;
  std::string ayanamsha;
  double ayanamshaDegrees = 0.0;
  std::string zodiac;
  std::string houseSystem;
  std::string ephemeris;
  std::string localDateTime;
  std::string utcIso;
  double julianDay = 0.0;
  std::string placeName;
  double latitude = 0.0;
  double longitude = 0.0;
  std::string timeZone;
  int timezoneOffsetMinutes = 0;
  std::vector<std::string> warnings;
};

struct BirthChart {
  std::string subjectName;
  BirthChartMetadata metadata;
  Placement ascendant;
  std::vector<KundliHouse> houses;
  std::vector<PlanetPosition> planets;
};

BirthChartInput parseInputJson(const std::string& json);
BirthChart calculateBirthChart(const BirthChartInput& input);
std::string chartToJson(const BirthChart& chart);

double julianDayFromLocal(
    const std::string& birthDate,
    const std::string& birthTime,
    int timezoneOffsetMinutes);
double lahiriAyanamsha(double julianDay);
double normalizeDegrees(double degrees);
int zodiacSignIndex(double longitude);

}  // namespace kundli
