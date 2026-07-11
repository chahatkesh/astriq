import { notFound } from "next/navigation";
import { BirthChartWorkspace } from "@/components";
import { isSupportedLocale } from "@/lib/i18n/locales";

export default async function LocaleHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return <BirthChartWorkspace initialLocale={locale} />;
}
