# Multilingual Support

The app has a multilingual foundation for English plus the 22 scheduled Indian
languages.

## Current Status

- Locale registry: complete for English and the 22 Eighth Schedule languages.
- Text direction: left-to-right and right-to-left locales are modeled.
- UI dictionary fallback: unsupported or incomplete dictionaries fall back to
  English.
- Hindi: first complete draft dictionary for the Kundli workspace.
- Other Indian-language dictionaries: registered and ready for translation
  review.

## Locale Registry

Locale metadata lives in `lib/i18n/locales.ts`. It includes:

- locale code;
- English name;
- native name;
- text direction;
- translation status.

## Message Dictionaries

Kundli workspace messages live in `lib/i18n/kundli-messages.ts`.

Do not translate engine keys such as `sun`, `moon`, `aries`, or `ashwini` in the
engine output. Keep those as stable IDs and localize labels at the UI layer.

## Next Steps

1. Add human-reviewed dictionaries for each registered language.
2. Add localized astrology glossaries for graha, rashi, lagna, bhava,
   nakshatra, pada, ayanamsha, and vakri/retrograde.
3. Move from client-side locale selection to locale-aware App Router paths when
   SEO or shareable localized URLs are needed.
4. Add Indic font strategy once final script coverage is confirmed.
