# Kundli Reference Accuracy

The reference accuracy tests compare selected engine output against explicit,
checked-in ephemeris fixtures. They are not network tests.

## Current Fixture

`tests/fixtures/kundli/jpl-horizons-de441.json` contains a small NASA/JPL
Horizons DE441 sample for the Delhi API smoke-test chart. The values use
observer quantity 31:

- geocentric Earth center: `500@399`
- ephemeris type: `OBSERVER`
- time type: `UT`
- values: apparent tropical ecliptic-of-date longitude and latitude

The test compares `planet.tropicalLongitude` and `planet.latitude` for Sun and
Moon. It does not validate Lahiri ayanamsha, sidereal longitude, nakshatra,
pada, houses, or divisional charts.

## Adding Reference Cases

1. Pick a real user-facing birth scenario with known date, local wall time,
   birthplace, latitude, longitude, and IANA time zone.
2. Normalize it through the app so the expected `utcIso` is known.
3. Query JPL Horizons for tropical geocentric body positions, or Swiss Ephemeris
   for Vedic-specific sidereal values.
4. Add the fixture with the source, ephemeris version, query settings, expected
   values, and per-body tolerances.
5. Keep tolerances honest:
   - prototype formula tolerances may be wider;
   - Swiss/JPL-backed profiles should tighten to arc-minute or better;
   - house and ascendant fixtures should use their own tolerances because they
     depend on location, time scale, and house convention.

## Why This Exists

The current engine is useful for the end-to-end product pipeline, but it is not
the final accuracy target. These fixtures give us a tripwire: every future
engine swap or formula change must show whether accuracy improved, regressed, or
changed because of an intentional calculation-profile decision.
