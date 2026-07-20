#include "spice_ephemeris.hpp"

#include <cmath>
#include <cstdlib>
#include <mutex>
#include <stdexcept>
#include <string>

extern "C" {
#include "SpiceUsr.h"
}

namespace kundli {
namespace {

constexpr double kPi = 3.141592653589793238462643383279502884;
constexpr double kSecondsPerDay = 86400.0;

std::once_flag gSpiceInitFlag;
bool gSpiceReady = false;

double degToRad(double degrees) {
  return degrees * kPi / 180.0;
}

double radToDeg(double radians) {
  return radians * 180.0 / kPi;
}

double normalizeDegrees(double degrees) {
  double value = std::fmod(degrees, 360.0);
  if (value < 0.0) {
    value += 360.0;
  }
  return value;
}

std::string defaultKernelDir() {
  const char* configured = std::getenv("KUNDLI_SPICE_KERNEL_DIR");
  if (configured != nullptr && configured[0] != '\0') {
    return configured;
  }
  return "services/astrology-engine/assets/jpl";
}

void throwIfSpiceFailed(const std::string& action) {
  if (!failed_c()) {
    return;
  }

  SpiceChar message[1841];
  getmsg_c("LONG", 1841, message);
  reset_c();
  throw std::runtime_error("SPICE " + action + " failed: " + message);
}

const char* spiceTargetName(const std::string& key) {
  if (key == "sun") {
    return "SUN";
  }
  if (key == "moon") {
    return "MOON";
  }
  if (key == "mercury") {
    return "MERCURY BARYCENTER";
  }
  if (key == "venus") {
    return "VENUS BARYCENTER";
  }
  if (key == "mars") {
    return "MARS BARYCENTER";
  }
  if (key == "jupiter") {
    return "JUPITER BARYCENTER";
  }
  if (key == "saturn") {
    return "SATURN BARYCENTER";
  }
  throw std::runtime_error("Unsupported SPICE body: " + key);
}

// IAU 1976 precession from J2000 equatorial to mean equator/equinox of date.
void precessJ2000ToMeanOfDate(double et, double x, double y, double z,
                              double* xo, double* yo, double* zo) {
  const double centuries = et / (kSecondsPerDay * 36525.0);
  const double t2 = centuries * centuries;
  const double t3 = t2 * centuries;

  const double zetaSeconds =
      2306.2181 * centuries + 0.30188 * t2 + 0.017998 * t3;
  const double zeeSeconds =
      2306.2181 * centuries + 1.09468 * t2 + 0.018203 * t3;
  const double thetaSeconds =
      2004.3109 * centuries - 0.42665 * t2 - 0.041833 * t3;

  const double zeta = degToRad(zetaSeconds / 3600.0);
  const double zee = degToRad(zeeSeconds / 3600.0);
  const double theta = degToRad(thetaSeconds / 3600.0);

  const double cosZeta = std::cos(zeta);
  const double sinZeta = std::sin(zeta);
  const double cosZ = std::cos(zee);
  const double sinZ = std::sin(zee);
  const double cosTheta = std::cos(theta);
  const double sinTheta = std::sin(theta);

  const double xx =
      cosZ * cosTheta * cosZeta - sinZ * sinZeta;
  const double xy =
      -cosZ * cosTheta * sinZeta - sinZ * cosZeta;
  const double xz = -cosZ * sinTheta;

  const double yx =
      sinZ * cosTheta * cosZeta + cosZ * sinZeta;
  const double yy =
      -sinZ * cosTheta * sinZeta + cosZ * cosZeta;
  const double yz = -sinZ * sinTheta;

  const double zx = sinTheta * cosZeta;
  const double zy = -sinTheta * sinZeta;
  const double zz = cosTheta;

  *xo = xx * x + xy * y + xz * z;
  *yo = yx * x + yy * y + yz * z;
  *zo = zx * x + zy * y + zz * z;
}

double meanObliquityRadians(double et) {
  const double centuries = et / (kSecondsPerDay * 36525.0);
  const double seconds =
      84381.448 - 46.8150 * centuries - 0.00059 * centuries * centuries +
      0.001813 * centuries * centuries * centuries;
  return degToRad(seconds / 3600.0);
}

RawBodyPosition equatorialToEclipticOfDate(
    double et, double x, double y, double z) {
  double xm = 0.0;
  double ym = 0.0;
  double zm = 0.0;
  precessJ2000ToMeanOfDate(et, x, y, z, &xm, &ym, &zm);

  const double obliquity = meanObliquityRadians(et);
  const double cosEps = std::cos(obliquity);
  const double sinEps = std::sin(obliquity);

  const double xe = xm;
  const double ye = cosEps * ym + sinEps * zm;
  const double ze = -sinEps * ym + cosEps * zm;

  const double longitude = normalizeDegrees(radToDeg(std::atan2(ye, xe)));
  const double latitude =
      radToDeg(std::atan2(ze, std::sqrt(xe * xe + ye * ye)));
  return {longitude, latitude};
}

void initializeSpiceKernels() {
  SpiceChar returnAction[] = "RETURN";
  SpiceChar noneAction[] = "NONE";
  erract_c("SET", static_cast<SpiceInt>(sizeof(returnAction)), returnAction);
  errprt_c("SET", static_cast<SpiceInt>(sizeof(noneAction)), noneAction);

  const std::string kernelDir = defaultKernelDir();
  const std::string lsk = kernelDir + "/naif0012.tls";
  const std::string spk = kernelDir + "/de442s.bsp";

  furnsh_c(lsk.c_str());
  throwIfSpiceFailed("furnsh LSK (" + lsk + ")");

  furnsh_c(spk.c_str());
  throwIfSpiceFailed("furnsh SPK (" + spk + ")");

  gSpiceReady = true;
}

}  // namespace

void ensureSpiceKernelsLoaded() {
  std::call_once(gSpiceInitFlag, initializeSpiceKernels);
  if (!gSpiceReady) {
    throw std::runtime_error("SPICE kernels failed to initialize.");
  }
}

double etFromUtcIso(const std::string& utcIso) {
  ensureSpiceKernelsLoaded();

  // SPICE accepts ISO UTC with trailing Z stripped or as "UTC calendar".
  std::string spiceUtc = utcIso;
  if (!spiceUtc.empty() && (spiceUtc.back() == 'Z' || spiceUtc.back() == 'z')) {
    spiceUtc.pop_back();
  }

  SpiceDouble et = 0.0;
  str2et_c(spiceUtc.c_str(), &et);
  throwIfSpiceFailed("str2et (" + utcIso + ")");
  return et;
}

RawBodyPosition spiceGeocentricBody(const std::string& key, double et) {
  ensureSpiceKernelsLoaded();

  ConstSpiceChar* target = spiceTargetName(key);
  SpiceDouble position[3];
  SpiceDouble lightTime = 0.0;

  spkpos_c(target, et, "J2000", "CN+S", "EARTH", position, &lightTime);
  throwIfSpiceFailed(std::string("spkpos ") + target);

  return equatorialToEclipticOfDate(
      et, position[0], position[1], position[2]);
}

}  // namespace kundli
