# Kundli Calculation Pipeline

## Current Architecture

The app uses one Next.js App Router surface in `app/`. Route handlers stay thin and delegate business work to `services/`. Shared browser-safe contracts live in `lib/`, reusable React UI lives in `components/`, and tests live in `tests/unit/`.

The Kundli flow follows that structure:

1. `components/kundli/BirthChartWorkspace.tsx` collects birth details and posts JSON to `/api/kundli`.
2. `app/api/kundli/route.ts` parses the request and calls `generateBirthChart`.
3. `services/birth-chart-service.ts` validates input, normalizes location data, and invokes the native engine.
4. `services/location-service.ts` resolves the time-zone offset for the birth wall time using the runtime IANA time-zone database.
5. `services/astrology-engine/bin/kundli-engine` performs the C++ calculation and returns structured JSON.
6. `components/kundli/KundliChart.tsx` renders houses, signs, planets, nakshatras, degrees, and retrograde status.

## C++ Integration Method

The C++ engine is integrated as a command-line executable invoked by the Node.js service layer.

This fits the current repo because:

- it keeps the calculation engine independent from React and route handlers;
- it avoids native Node binding ABI friction;
- it works in the production Node runtime and standalone Docker output;
- it is easy to unit-test directly with a native test binary;
- it keeps a clean path to replace the internal formulae with Swiss Ephemeris or JPL-backed code later.

The production Docker build compiles the engine in the builder stage and copies only the binary into the runner image.

## Engine Input Contract

The engine reads one JSON object from stdin:

```json
{
  "subjectName": "Ada",
  "birthDate": "1990-08-15",
  "birthTime": "14:30",
  "placeName": "Delhi, India",
  "latitude": 28.6139,
  "longitude": 77.209,
  "timeZone": "Asia/Kolkata",
  "timezoneOffsetMinutes": 330,
  "ayanamsha": "lahiri",
  "houseSystem": "whole_sign"
}
```

`timezoneOffsetMinutes` is minutes east of UTC. The service computes it from `birthDate`, `birthTime`, and `timeZone` unless a validated manual offset is supplied.

## Engine Output Contract

The engine writes one JSON object to stdout. It includes:

- metadata: engine version, UTC time, Julian day, location, time-zone offset, calculation modes, and warnings;
- ascendant placement;
- 12 whole sign houses with assigned signs and planet keys;
- planet positions for Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, and Ketu;
- sidereal longitude, tropical longitude, sign, degree-in-sign, house, nakshatra, pada, ecliptic latitude, and retrograde status.

## Calculation Conventions

- Zodiac: sidereal.
- Ayanamsha: Lahiri, using a mean ayanamsha model.
- Houses: whole sign houses from the sidereal ascendant sign.
- Nakshatras: 27 equal nakshatras of 13 degrees 20 minutes, with 4 padas each.
- Nodes: mean lunar nodes; Rahu and Ketu are marked retrograde.
- Time conversion: local wall time minus the resolved offset gives UTC.

## Accuracy Notes

The current engine does not use Swiss Ephemeris, JPL DE ephemerides, or external data files. It uses deterministic low-precision astronomical formulae for planetary longitude and an approximate Lahiri ayanamsha model.

This is suitable for exercising the end-to-end calculation pipeline and deterministic tests. For production-grade astrology where arc-minute accuracy matters, replace the C++ formula layer with Swiss Ephemeris or a JPL-backed implementation while keeping the CLI JSON contract stable.

## Phased Implementation Plan

1. Build the validated birth-details flow and API contract.
2. Normalize IANA time-zone data at the service boundary.
3. Compile and test the native C++ CLI engine.
4. Render the visual Kundli and tabular planetary positions.
5. Add persistence for generated charts through `packages/database`.
6. Replace low-precision formulae with a production ephemeris backend.
7. Add Navamsa, dashas, yogas, aspects, doshas, matching, and report generation as separate service capabilities.
