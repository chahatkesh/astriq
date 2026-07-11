# Multilingual Support

The app has a multilingual foundation for English plus the 22 scheduled Indian
languages.

## Current Status

- Locale registry: complete for English and the 22 Eighth Schedule languages.
- Text direction: left-to-right and right-to-left locales are modeled.
- Locale routing: App Router serves every locale under `/{locale}` and
  middleware redirects unprefixed paths to the default locale.
- Glossary IDs: a stable astrology glossary maps engine IDs to localized labels.
- Indic fonts: locale-aware webfont selection with bundled Devanagari and
  Bengali scripts, falling back to the base Latin UI font.
- UI dictionary fallback: unsupported or incomplete dictionaries fall back to
  English.
- Hindi: first complete draft dictionary and glossary for the Kundli workspace.
- Other Indian-language dictionaries: registered and ready for translation
  review.

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

Kundli workspace messages live in `lib/i18n/kundli-messages.ts`.

Do not translate engine keys such as `sun`, `moon`, `aries`, or `ashwini` in the
engine output. Keep those as stable IDs and localize labels at the UI layer.

## Astrology Glossary

Stable astrology term IDs live in `lib/i18n/glossary.ts`. The engine emits
English IDs (`sun`, `aries`, `nakshatra`) and the UI calls `localizeTerm` to
render localized labels. Unknown IDs echo back so new vocabulary never renders
empty, and locales without a reviewed glossary fall back to English.

## Fonts

`lib/i18n/fonts.ts` maps each locale to a script and returns a `font-family`
stack. The root layout registers the bundled `next/font` script variables
(currently Devanagari and Bengali). Adding a new script requires wiring one more
`next/font` variable in the layout and `fonts.ts`.

## Next Steps

1. Add human-reviewed dictionaries and glossaries for each registered language.
2. Bundle the remaining Indic script fonts (Gujarati, Gurmukhi, Kannada,
   Malayalam, Oriya, Tamil, Telugu, Arabic) as translations land.
3. Persist the selected locale so navigation and refreshes keep the choice.
