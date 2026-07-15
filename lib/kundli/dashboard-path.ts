import type { LocaleCode } from "@/lib/i18n/locales";

export type DashboardQuery = {
  chart?: string;
  draft?: string;
};

export function getDashboardPath(
  locale: LocaleCode,
  query: DashboardQuery = {},
) {
  const path = `/${locale}/dashboard`;
  const params = new URLSearchParams();

  if (query.chart) {
    params.set("chart", query.chart);
  }

  if (query.draft) {
    params.set("draft", query.draft);
  }

  const search = params.toString();
  return search ? `${path}?${search}` : path;
}
