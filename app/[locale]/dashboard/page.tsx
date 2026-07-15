import { notFound, redirect } from "next/navigation";
import { BirthChartWorkspace } from "@/components";
import { getDefaultPostAuthPath } from "@/lib/auth/redirect";
import { isSupportedLocale, type LocaleCode } from "@/lib/i18n/locales";
import {
  getSessionUserFromCookieStore,
  getUserChartById,
  getUserChartHistory,
  getUserChartQuota,
} from "@/services";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const user = await getSessionUserFromCookieStore();
  if (!user) {
    const nextPath = getDefaultPostAuthPath(locale as LocaleCode);
    redirect(`/${locale}/login?next=${encodeURIComponent(nextPath)}`);
  }

  const [history, quota] = await Promise.all([
    getUserChartHistory(user.id),
    getUserChartQuota(user.id),
  ]);

  const resolvedParams = await searchParams;
  const draftToken = getSingleParam(resolvedParams.draft) ?? undefined;
  const chartId = getSingleParam(resolvedParams.chart) ?? undefined;
  const activeChart = chartId ? await getUserChartById(user.id, chartId) : null;

  return (
    <BirthChartWorkspace
      authenticated
      initialActiveChart={activeChart}
      initialChartHistory={history}
      initialChartId={chartId}
      initialDraftToken={draftToken}
      initialLocale={locale as LocaleCode}
      initialQuota={quota}
      userDisplayName={user.displayName ?? user.email}
    />
  );
}

function getSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
