import { notFound } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { sanitizeNextPath } from "@/lib/auth/redirect";
import { isSupportedLocale, type LocaleCode } from "@/lib/i18n/locales";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function LoginPage({
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

  const resolvedParams = await searchParams;
  const nextPath = sanitizeNextPath(
    locale,
    getSingleParam(resolvedParams.next),
  );
  const draft = getSingleParam(resolvedParams.draft) ?? undefined;

  return (
    <AuthForm
      draftToken={draft}
      locale={locale as LocaleCode}
      mode="login"
      nextPath={nextPath}
    />
  );
}

function getSingleParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
