# Free JPL/SPICE Ephemeris Backend

The production accuracy target is a free NASA/JPL SPICE-backed backend, not
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
pnpm ephemeris:download
```

To verify the workflow without downloading kernels:

```bash
node scripts/download-jpl-spice-assets.mjs --dry-run
```

This creates:

```text
services/astrology-engine/assets/jpl/naif0012.tls
services/astrology-engine/assets/jpl/de442s.bsp
services/astrology-engine/assets/jpl/manifest.json
```

`manifest.json` records source URLs, byte sizes, and SHA-256 hashes.

## Backend Contract

The engine accepts:

```json
{
  "engineBackend": "jpl_spice"
}
```

Supported values:

- `jpl_spice`: the production backend using JPL DE441 planetary states.

The app-level contract keeps `jpl_spice` as the only accepted backend so
generation behavior is deterministic and versioned.

## Target Calculation Profile

The target profile should be:

```json
{
  "id": "vedic-lahiri-jpl-de442s-v1",
  "precision": "reference",
  "ephemeris": "NASA/JPL DE442s SPK",
  "planetPositionSource": "NAIF SPICE apparent geocentric states",
  "ayanamshaModel": "Lahiri",
  "houseModel": "Whole sign from sidereal ascendant",
  "nodeModel": "Mean lunar nodes"
}
```

Use apparent geocentric positions with converged light-time and stellar
aberration correction (`CN+S`) so the profile aligns with the JPL Horizons
reference fixture style.

## Implementation Steps

1. Keep the CLI JSON input/output contract stable.
2. Link CSPICE, load `naif0012.tls` and `de442s.bsp`, and convert UTC to SPICE
   ephemeris time.
3. Compute apparent geocentric vectors for Sun, Moon, Mercury, Venus, Mars,
   Jupiter, and Saturn.
4. Convert vectors to ecliptic longitude and latitude.
5. Apply Lahiri ayanamsha and existing sign, house, nakshatra, and pada logic.
6. Expand JPL reference fixtures and tighten tolerances.
