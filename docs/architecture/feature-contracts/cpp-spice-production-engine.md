# Feature Contract: C++ SPICE Production Engine

## User problem

Chart generation must use a real JPL/SPICE-backed C++ engine so planetary
positions are reference-grade and the production path matches the CLI-first
calculation boundary. Browser/offline calculation is out of scope.

## User flow

`Authenticated dashboard -> Submit birth details -> POST /api/kundli ->
Validate + normalize -> Spawn C++ CLI (SPICE DE442s) -> Persist chart ->
Render result / history`

## Three layers

- **Surface:** Existing kundli workspace and PDF export (no offline calc).
- **Interaction:** Existing API auth, quota, and validation errors.
- **Engine:** `services/astrology-engine` CLI linked to CSPICE, kernels
  `naif0012.tls` + `de442s.bsp`, apparent geocentric tropical lon/lat.

## Technical flow

- **Input:** Validated birth JSON (subject, local date/time, place, lat/lon,
  IANA zone, resolved UTC offset, Lahiri, whole sign, `jpl_spice`).
- **Process:** TypeScript normalizes location/offset, spawns `kundli-engine`,
  engine loads SPICE kernels, computes Sun–Saturn + Moon via CSPICE (`CN+S`),
  mean nodes + Lahiri + whole-sign houses in C++.
- **Output:** Existing chart JSON contract with DE442s/SPICE metadata.
- **Failure states:** Validation 400; missing binary/kernels or SPICE errors as
  engine execution failures; quota/auth unchanged.
- **Data:** Persist engine version, profile id, backend, UTC instant, coords.
- **Dependencies:** CSPICE toolkit (vendored at build time), JPL kernels
  (downloaded, not committed), Node spawn of local CLI.

## Accuracy and reproducibility

- Conventions: sidereal, Lahiri (mean), whole sign, mean lunar nodes.
- Profile id: `vedic-lahiri-jpl-de442s-v1`.
- Ephemeris: NASA/JPL DE442s SPK via NAIF CSPICE.
- Planet source: apparent geocentric states (`CN+S`), tropical ecliptic-of-date.
- Fixtures: Horizons DE441 Sun/Moon case remains the tripwire (DE442s ≈ DE441
  for modern dates within existing tolerances).
- Time: local wall time + IANA offset → UTC instant before calculation.

## Hidden-complexity checks

- Double-submit: existing API/quota path.
- Loading/error UI: existing workspace errors for engine failures.
- Concurrency: one CLI process per request; kernels furnished per process.
- Logging: no birth secrets in SPICE/CLI logs.
- Undo: N/A (persist remains append-only chart history).
