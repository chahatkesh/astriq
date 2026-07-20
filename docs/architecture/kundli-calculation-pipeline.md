# Kundli Calculation Pipeline

## Current Architecture

The app uses one Next.js App Router surface in `app/`. Route handlers stay thin and delegate business work to `services/`. Shared browser-safe contracts live in `lib/`, reusable React UI lives in `components/`, and tests live in `tests/unit/`.

The Kundli flow follows that structure:

1. Guests start on `app/[locale]/page.tsx`, which collects date and time, resolves birthplace suggestions through `/api/places`, and preserves the selected label, coordinates, and IANA time zone while redirecting generation intent through login.
2. Authenticated users work in `app/[locale]/dashboard/page.tsx`, where `components/kundli/BirthChartWorkspace.tsx` submits chart generation requests and shows saved chart history. Dashboard deep links use `?draft=` to restore birth-form fields after login and `?chart=<id>` to reopen a saved chart by ownership-scoped id.
3. `app/api/kundli/route.ts` enforces authentication, checks per-user quota from `MAX_CHARTS_PER_USER`, then calls `generateBirthChart`.
4. `services/birth-chart-service.ts` validates input, normalizes location/UTC offset, and spawns the native C++ CLI (`kundli-engine`) with the versioned JSON contract.
5. `services/astrology-engine` loads NAIF CSPICE kernels (`naif0012.tls`, `de442s.bsp`), computes apparent geocentric planetary states, then applies Lahiri ayanamsha and whole-sign houses.
6. `services/user-chart-service.ts` persists generated charts to `packages/database` and returns updated quota state.
7. `components/kundli/KundliChart.tsx` renders the key placements and planetary positions on an A4-proportioned paper surface, localizing astrology vocabulary through `lib/i18n/glossary.ts`. `lib/kundli/chart-pdf.ts` exports that surface as a single-page PDF entirely in the browser (render-only; calculation is server-side).

## Calculation Backend

The production backend contract is `jpl_spice`.

`services/birth-chart-service.ts` does not compute ephemeris in TypeScript. It
invokes `services/astrology-engine/bin/kundli-engine`, which links NAIF CSPICE
and uses JPL DE442s SPK states (`CN+S`), then applies Lahiri ayanamsha and
whole-sign house placement in C++.

Offline / browser-side chart calculation is intentionally unsupported.

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
  "houseSystem": "whole_sign",
  "engineBackend": "jpl_spice"
}
```

The authenticated workspace requires `subjectName`, preserves it in the login draft, and sends it through this contract so saved chart history and PDF exports retain the user-provided chart name.

`timezoneOffsetMinutes` is minutes east of UTC. The service computes it from `birthDate`, `birthTime`, and `timeZone`. The current UI does not expose manual UTC offset input.

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
- Planets: NAIF CSPICE apparent geocentric vectors (`CN+S`) converted to
  tropical ecliptic-of-date longitude/latitude.

## Accuracy Notes

The runtime chart service uses JPL DE442s SPK planetary states through the
`jpl_spice` C++ CLI. Accuracy fixtures compare Sun/Moon tropical positions
against Horizons DE441 samples (DE442s agrees within fixture tolerances for
modern dates). Any backend or profile change must update fixtures and metadata.

## Local / CI prerequisites

```bash
pnpm engine:deps   # downloads CSPICE toolkit + JPL kernels (gitignored)
pnpm build:engine
pnpm test:engine
```

## Phased Implementation Plan

1. Build the validated birth-details flow and API contract.
2. Normalize IANA time-zone data at the service boundary.
3. Compile and test the native C++ CLI engine with CSPICE + DE442s.
4. Spawn the CLI from the TypeScript service for production generation.
5. Render the visual Kundli and compact planetary positions on an A4 paper surface with browser-side PDF export.
6. Add retention and account-level chart management capabilities on top of saved charts.
7. Expand accuracy fixtures for additional bodies and timezone edge windows.
8. Add Navamsa, dashas, yogas, aspects, doshas, matching, and report generation as separate service capabilities.
