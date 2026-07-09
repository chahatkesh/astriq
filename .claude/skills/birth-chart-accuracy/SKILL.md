---
name: birth-chart-accuracy
description: Guardrails for chart calculation, timezone, location and fixture work.
---

# Chart Accuracy

Use this skill for chart calculation, geocoding, timezone, persistence, fixture or visualization work.

## Defaults

- Sidereal zodiac
- Lahiri ayanamsa
- Whole sign houses
- North Indian and South Indian chart styles

## Requirements

- No placeholder chart values in production paths.
- Keep calculation behind a versioned JSON input/output contract.
- CLI-first C++ engine is the default integration boundary.
- Normalize local birth time with latitude, longitude, IANA timezone and UTC instant before calculation.
- Reject or explicitly resolve ambiguous/nonexistent local times.
- Persist normalized input, engine version, convention version and result metadata so charts are reproducible.

## Tests

Add or update tests for:

- trusted ephemeris/golden fixtures
- Lahiri sidereal conversion
- nakshatra boundaries
- whole sign house placement
- retrograde detection
- DST gaps and repeated local times
- rendering both supported chart styles

Any provider or convention change must include docs and test fixture updates.
