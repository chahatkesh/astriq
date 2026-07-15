# Multilingual Support

The app has a multilingual foundation for English plus the 22 scheduled Indian
languages.

## Current Status

- Locale registry: complete for English and the 22 Eighth Schedule languages.
- Text direction: left-to-right and right-to-left locales are modeled.
- Locale routing: App Router serves every locale under `/{locale}` and
  middleware redirects unprefixed paths to the default locale.
- Glossary IDs: a stable astrology glossary maps engine IDs to localized labels.
- Script fonts: locale-aware Noto Sans webfonts for every supported script
  (Devanagari, Bengali, Gujarati, Gurmukhi, Kannada, Malayalam, Oriya, Tamil,
  Telugu, Arabic, Ol Chiki, Meetei Mayek), with Latin UI text via Geist.
- UI dictionary fallback: unsupported or incomplete dictionaries fall back to
  English for missing keys.
- Dedicated locale dictionaries: each supported locale has its own AppStrings
  override and glossary (no Hindi/Bengali/Urdu alias sharing).
- Landing, auth, account, chart history, and kundli workspace copy resolve
  through `AppStrings` with first-pass draft coverage for every locale.
- All locales remain `translationStatus: "draft"` until native-language QA.

## Locale Registry

Locale metadata lives in `lib/i18n/locales.ts`. It includes:

- locale code;
- English name;
- native name;
- text direction;
- translation status.

`isSupportedLocale` and `localeCodes` are the routing helpers used by the
middleware and the `app/[locale]` segment.

## Locale Routing

- `middleware.ts` redirects any unprefixed path to `/{defaultLocale}` and lets
  requests that already carry a supported locale prefix through. API routes and
  static assets are excluded via the matcher.
- `app/[locale]/layout.tsx` validates the locale param, sets `lang`/`dir`, and
  applies the locale font family. `generateStaticParams` pre-renders every
  registered locale.
- `app/page.tsx` redirects to the default locale as a fallback when middleware
  is bypassed.

## Message Dictionaries

UI strings for landing, auth, account chrome, chart history, and the kundli
workspace live in `lib/i18n/dictionaries/` and resolve through
`lib/i18n/app-strings.ts`.

`AppStrings.forLocale(localeCode)` merges the English base dictionary with the
locale override and falls back to English for missing keys or unknown locales.
Use `formatAppString` for templates that interpolate values such as `{name}`,
`{count}`, `{used}`, `{limit}`, and `{when}`.

Do not hardcode user-facing copy in React components. Resolve strings through
`AppStrings.forLocale` and pass the dictionary (or individual keys) as props.

Do not translate engine keys such as `sun`, `moon`, `aries`, or `ashwini` in the
engine output. Keep those as stable IDs and localize labels at the UI layer.

## Astrology Glossary

Stable astrology term IDs live in `lib/i18n/glossaries/` and export through
`lib/i18n/glossary.ts`. The engine emits English IDs (`sun`, `aries`,
`nakshatra`) and the UI calls `localizeTerm` to render localized labels. Unknown
IDs echo back so new vocabulary never renders empty, and unknown locale codes
still fall back to English.

## Fonts

`lib/i18n/fonts.ts` maps each locale to a script and returns a `font-family`
stack. The root layout registers bundled `next/font` variables for every script
used by the locale registry. Non-Latin script fonts use `preload: false` to
limit first-load weight; Devanagari remains preloaded as the default Indic
script.

## Next Steps

1. Run native-language QA and glossary review per locale before marking
   translations complete.
2. Localize nakshatra name IDs (27 names) at the glossary layer.
3. Persist the selected locale so navigation and refreshes keep the choice.
