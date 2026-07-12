import { notFound, redirect } from "next/navigation";
import { KundliLanding } from "@/components/kundli/KundliLanding";
import { getDefaultPostAuthPath } from "@/lib/auth/redirect";
import { isSupportedLocale, type LocaleCode } from "@/lib/i18n/locales";
import { getSessionUserFromCookieStore } from "@/services";

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const user = await getSessionUserFromCookieStore();
  if (user) {
    redirect(getDefaultPostAuthPath(locale as LocaleCode));
  }

  return <KundliLanding locale={locale as LocaleCode} />;
}
