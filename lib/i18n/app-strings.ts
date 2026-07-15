import type { LocaleCode } from "@/lib/i18n/locales";
import {
  englishAppStrings,
  localeAppStringOverrides,
  type AppStringsDictionary,
} from "@/lib/i18n/dictionaries";

export type {
  AppStringsDictionary,
  AppStringsOverrides,
} from "@/lib/i18n/dictionaries";

export function formatAppString(
  template: string,
  values: Record<string, string | number>,
): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export class AppStrings {
  static readonly en = englishAppStrings;

  private static readonly overrides = localeAppStringOverrides;

  static forLocale(localeCode: LocaleCode): AppStringsDictionary {
    const override =
      AppStrings.overrides[localeCode as Exclude<LocaleCode, "en">];

    if (!override) {
      return AppStrings.en;
    }

    return {
      app: { ...AppStrings.en.app, ...override.app },
      landing: { ...AppStrings.en.landing, ...override.landing },
      auth: { ...AppStrings.en.auth, ...override.auth },
      account: { ...AppStrings.en.account, ...override.account },
      history: { ...AppStrings.en.history, ...override.history },
      form: { ...AppStrings.en.form, ...override.form },
      placeSearch: { ...AppStrings.en.placeSearch, ...override.placeSearch },
      states: { ...AppStrings.en.states, ...override.states },
      chart: { ...AppStrings.en.chart, ...override.chart },
      table: { ...AppStrings.en.table, ...override.table },
      metadata: { ...AppStrings.en.metadata, ...override.metadata },
    };
  }
}
