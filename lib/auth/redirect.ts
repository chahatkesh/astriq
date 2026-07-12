import type { LocaleCode } from "@/lib/i18n/locales";

export function getDefaultPostAuthPath(locale: LocaleCode) {
  return `/${locale}/dashboard`;
}

export function sanitizeNextPath(
  locale: LocaleCode,
  candidate: string | null | undefined,
) {
  if (!candidate) {
    return getDefaultPostAuthPath(locale);
  }

  if (!candidate.startsWith("/")) {
    return getDefaultPostAuthPath(locale);
  }

  if (candidate.startsWith("//")) {
    return getDefaultPostAuthPath(locale);
  }

  return candidate;
}
