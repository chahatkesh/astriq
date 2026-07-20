# Free JPL/SPICE Ephemeris Backend

The production accuracy backend is a free NASA/JPL SPICE-backed C++ engine, not
Swiss Ephemeris.

## Why This Backend

- NAIF permits commercial use of SPICE components without fees.
- NAIF generic kernels may be downloaded and used by anyone, consistent with
  NAIF rules.
- JPL planetary SPK kernels provide high-quality planetary and lunar ephemerides.
- The small DE442s kernel is suitable for modern birth-chart dates without
  committing a 100+ MB file to the repository.

## Runtime Assets

Assets are intentionally not committed. Download them locally with:

```bash
pnpm engine:deps
```

Or separately:

```bash
pnpm ephemeris:download
pnpm cspice:download
```

To verify the workflow without downloading kernels:

```bash
node scripts/download-jpl-spice-assets.mjs --dry-run
node scripts/download-cspice.mjs --dry-run
```

This creates:

```text
services/astrology-engine/assets/jpl/naif0012.tls
services/astrology-engine/assets/jpl/de442s.bsp
services/astrology-engine/assets/jpl/manifest.json
services/astrology-engine/vendor/cspice/   # NAIF CSPICE toolkit
services/astrology-engine/vendor/cspice-manifest.json
```

`manifest.json` / `cspice-manifest.json` record source URLs and hashes.

## Backend Contract

The engine accepts:

```json
{
  "engineBackend": "jpl_spice"
}
```

Supported values:

- `jpl_spice`: the production backend using JPL DE442s SPK via NAIF CSPICE.

The app-level contract keeps `jpl_spice` as the only accepted backend so
generation behavior is deterministic and versioned.

## Calculation Profile

```json
{
  "id": "vedic-lahiri-jpl-de442s-v1",
  "precision": "reference",
  "ephemeris": "NASA/JPL DE442s SPK",
  "planetPositionSource": "NAIF SPICE apparent geocentric states (CN+S), ecliptic of date",
  "ayanamshaModel": "Lahiri",
  "houseModel": "Whole sign from sidereal ascendant",
  "nodeModel": "Mean lunar nodes"
}
```

Production flow:

1. TypeScript validates birth details and resolves IANA timezone offset.
2. Node spawns `kundli-engine` with JSON on stdin.
3. The CLI furnishes `naif0012.tls` and `de442s.bsp`, converts UTC to ET, and
   computes apparent geocentric vectors for Sun, Moon, Mercury, Venus, Mars,
   Jupiter, and Saturn (`spkpos` with `CN+S` in `J2000`, then ecliptic-of-date).
4. C++ applies Lahiri ayanamsha and existing sign, house, nakshatra, and pada
   logic (mean lunar nodes remain analytic).
5. Chart JSON is returned on stdout and persisted by the app services.
