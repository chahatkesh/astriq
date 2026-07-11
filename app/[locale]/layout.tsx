import { notFound } from "next/navigation";
import { getLocaleFontFamily } from "@/lib/i18n/fonts";
import {
  getSupportedLocale,
  isSupportedLocale,
  localeCodes,
} from "@/lib/i18n/locales";

export function generateStaticParams() {
  return localeCodes.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const supported = getSupportedLocale(locale);
  const fontFamily = getLocaleFontFamily(locale);

  return (
    <div
      dir={supported.direction}
      lang={supported.code}
      style={fontFamily ? { fontFamily } : undefined}
    >
      {children}
    </div>
  );
}
