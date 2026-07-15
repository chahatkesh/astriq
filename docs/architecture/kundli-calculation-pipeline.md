# Kundli Calculation Pipeline

## Current Architecture

The app uses one Next.js App Router surface in `app/`. Route handlers stay thin and delegate business work to `services/`. Shared browser-safe contracts live in `lib/`, reusable React UI lives in `components/`, and tests live in `tests/unit/`.

The Kundli flow follows that structure:

1. Guests start on `app/[locale]/page.tsx`, which shows a landing form for Date, Time, and Location placeholders and redirects generation intent through login.
2. Authenticated users work in `app/[locale]/dashboard/page.tsx`, where `components/kundli/BirthChartWorkspace.tsx` submits chart generation requests and shows saved chart history. Dashboard deep links use `?draft=` to restore birth-form fields after login and `?chart=<id>` to reopen a saved chart by ownership-scoped id.
3. `app/api/kundli/route.ts` enforces authentication, checks per-user quota from `MAX_CHARTS_PER_USER`, then calls `generateBirthChart`.
4. `services/birth-chart-service.ts` validates input, normalizes location data, and computes JPL-grade planetary positions via `js-ephemeris` (`jpl_spice` backend contract).
5. `services/user-chart-service.ts` persists generated charts to `packages/database` and returns updated quota state.
6. `components/kundli/KundliChart.tsx` renders the key placements and planetary positions on an A4-proportioned paper surface, localizing astrology vocabulary through `lib/i18n/glossary.ts`. `lib/kundli/chart-pdf.ts` exports that surface as a single-page PDF entirely in the browser.

## Calculation Backend

The production backend contract is `jpl_spice`.

`services/birth-chart-service.ts` resolves geocentric planetary states from
JPL DE441 via `js-ephemeris`, then applies Lahiri ayanamsha and whole-sign
house placement logic to produce the app chart JSON contract.

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

## Accuracy Notes

The runtime chart service uses JPL DE441-backed planetary states through the
`jpl_spice` contract. Accuracy fixtures should continue tightening around this
profile and any future backend adjustment must update fixtures and metadata.

## Phased Implementation Plan

1. Build the validated birth-details flow and API contract.
2. Normalize IANA time-zone data at the service boundary.
3. Compile and test the native C++ CLI engine.
4. Render the visual Kundli and compact planetary positions on an A4 paper surface with browser-side PDF export.
5. Add retention and account-level chart management capabilities on top of saved charts.
6. Expand accuracy fixtures for additional bodies and timezone edge windows.
7. Add Navamsa, dashas, yogas, aspects, doshas, matching, and report generation as separate service capabilities.
