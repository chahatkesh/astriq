---
paths:
  - "app/**"
  - "services/**"
  - "lib/**"
  - "workers/**"
  - "packages/**"
  - "tests/**"
  - "docs/**"
---

# Calculation Accuracy

Birth chart output must be deterministic, convention-explicit and testable.

Default chart conventions:

- sidereal zodiac
- Lahiri ayanamsa
- whole sign houses
- North Indian and South Indian chart rendering

Rules:

- Do not ship placeholder planetary positions, signs, houses, nakshatras, retrograde flags, or chart visuals as if they are calculated.
- Keep the calculation engine isolated behind a stable JSON input/output contract.
- CLI-first C++ engine integration is the default until a later decision changes it.
- Normalize user input before engine execution: local birth time, location, latitude/longitude, IANA timezone, UTC instant, and convention version.
- Store enough metadata to reproduce a chart: engine version, convention version, timezone ID, UTC instant, location coordinates, and source/provider identifiers.
- Test trusted fixtures for timezone edge cases, sidereal conversion, nakshatra boundaries, whole sign house placement, and retrograde detection.
- Any provider, ephemeris, ayanamsa, timezone, or geocoder change must update docs and golden-test expectations in the same PR.
