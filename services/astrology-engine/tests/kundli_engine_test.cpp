#include "../src/kundli_engine.hpp"

#include <cassert>
#include <cmath>
#include <exception>
#include <iostream>
#include <string>

namespace {

bool closeTo(double actual, double expected, double tolerance) {
  return std::abs(actual - expected) <= tolerance;
}

kundli::BirthChartInput sampleInput() {
  return {
      "Test Native",
      "2000-01-01",
      "17:30",
      "Delhi, India",
      "Asia/Kolkata",
      "lahiri",
      "whole_sign",
      "prototype",
      28.6139,
      77.2090,
      330,
  };
}

}  // namespace

int main() {
  assert(closeTo(
      kundli::julianDayFromLocal("2000-01-01", "12:00", 0),
      2451545.0,
      0.000001));

  assert(kundli::zodiacSignIndex(0.0) == 0);
  assert(kundli::zodiacSignIndex(29.999) == 0);
  assert(kundli::zodiacSignIndex(30.0) == 1);
  assert(kundli::zodiacSignIndex(359.999) == 11);

  const double ayanamsha = kundli::lahiriAyanamsha(2451545.0);
  assert(closeTo(ayanamsha, 23.853055, 0.000001));

  const kundli::BirthChart chart = kundli::calculateBirthChart(sampleInput());
  assert(chart.metadata.utcIso == "2000-01-01T12:00:00.000Z");
  assert(chart.metadata.engineBackend == "prototype");
  assert(chart.metadata.calculationProfile.id == "vedic-lahiri-prototype-v1");
  assert(chart.metadata.calculationProfile.precision == "prototype");
  assert(chart.metadata.calculationProfile.nodeModel == "Mean lunar nodes");
  assert(chart.metadata.ayanamsha == "lahiri");
  assert(chart.metadata.houseSystem == "whole_sign");
  assert(chart.houses.size() == 12);
  assert(chart.planets.size() == 9);

  for (const kundli::KundliHouse& house : chart.houses) {
    assert(house.number >= 1);
    assert(house.number <= 12);
  }

  bool sawSun = false;
  bool sawMoon = false;
  bool sawRahu = false;

  for (const kundli::PlanetPosition& planet : chart.planets) {
    assert(planet.longitude >= 0.0);
    assert(planet.longitude < 360.0);
    assert(planet.house >= 1);
    assert(planet.house <= 12);
    assert(planet.nakshatra.pada >= 1);
    assert(planet.nakshatra.pada <= 4);

    sawSun = sawSun || planet.key == "sun";
    sawMoon = sawMoon || planet.key == "moon";
    sawRahu = sawRahu || (planet.key == "rahu" && planet.retrograde);
  }

  assert(sawSun);
  assert(sawMoon);
  assert(sawRahu);

  const kundli::BirthChartInput parsed = kundli::parseInputJson(
      "{\"birthDate\":\"2000-01-01\",\"birthTime\":\"17:30\","
      "\"placeName\":\"Delhi, India\",\"timeZone\":\"Asia/Kolkata\","
      "\"latitude\":28.6139,\"longitude\":77.209,"
      "\"timezoneOffsetMinutes\":330}");
  assert(parsed.birthDate == "2000-01-01");
  assert(parsed.birthTime == "17:30");
  assert(parsed.timezoneOffsetMinutes == 330);

  const kundli::BirthChartInput spiceParsed = kundli::parseInputJson(
      "{\"birthDate\":\"2000-01-01\",\"birthTime\":\"17:30\","
      "\"placeName\":\"Delhi, India\",\"timeZone\":\"Asia/Kolkata\","
      "\"latitude\":28.6139,\"longitude\":77.209,"
      "\"timezoneOffsetMinutes\":330,\"engineBackend\":\"jpl_spice\"}");
  assert(spiceParsed.engineBackend == "jpl_spice");

  bool sawUnavailableSpiceBackend = false;
  try {
    (void)kundli::calculateBirthChart(spiceParsed);
  } catch (const std::exception& error) {
    const std::string message = error.what();
    sawUnavailableSpiceBackend =
        message.find("JPL SPICE backend is recognized") != std::string::npos;
  }
  assert(sawUnavailableSpiceBackend);

  std::cout << "kundli-engine tests passed\n";
  return 0;
}
