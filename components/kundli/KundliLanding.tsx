"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { getDefaultPostAuthPath } from "@/lib/auth/redirect";
import { AppStrings } from "@/lib/i18n/app-strings";
import type { LocaleCode } from "@/lib/i18n/locales";
import { encodeDraftContext } from "@/lib/kundli/draft-context";

type KundliLandingProps = {
  locale: LocaleCode;
};

export function KundliLanding({ locale }: KundliLandingProps) {
  const router = useRouter();
  const messages = AppStrings.forLocale(locale);
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [placeName, setPlaceName] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const draft = encodeDraftContext({
      birthDate,
      birthTime,
      placeName,
    });

    const nextPath = getDefaultPostAuthPath(locale);
    const query = new URLSearchParams({
      next: nextPath,
      draft,
    });

    router.push(`/${locale}/login?${query.toString()}`);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-foreground/15 pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-foreground/50">
              {messages.app.eyebrow}
            </p>
            <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">
              {messages.app.title}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Link
              className="border border-foreground/20 px-3 py-2 font-medium transition hover:bg-foreground hover:text-background"
              href={`/${locale}/login`}
            >
              {messages.landing.signIn}
            </Link>
            <Link
              className="border border-foreground/20 px-3 py-2 font-medium transition hover:bg-foreground hover:text-background"
              href={`/${locale}/register`}
            >
              {messages.landing.createAccount}
            </Link>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-foreground/50">
              {messages.landing.workspaceEyebrow}
            </p>
            <h2 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">
              {messages.landing.headline}
            </h2>
            <p className="mt-4 max-w-xl text-base text-foreground/70">
              {messages.landing.description}
            </p>
          </div>

          <section className="border border-foreground/15 bg-background p-5 sm:p-6">
            <h3 className="text-base font-semibold">
              {messages.landing.startTitle}
            </h3>
            <p className="mt-1 text-sm text-foreground/65">
              {messages.landing.startHint}
            </p>

            <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
              <Field htmlFor="landingBirthDate" label={messages.form.birthDate}>
                <input
                  className={inputClassName}
                  id="landingBirthDate"
                  onChange={(event) => setBirthDate(event.target.value)}
                  required
                  type="date"
                  value={birthDate}
                />
              </Field>

              <Field htmlFor="landingBirthTime" label={messages.form.birthTime}>
                <input
                  className={inputClassName}
                  id="landingBirthTime"
                  onChange={(event) => setBirthTime(event.target.value)}
                  required
                  type="time"
                  value={birthTime}
                />
              </Field>

              <Field htmlFor="landingPlace" label={messages.form.placeName}>
                <input
                  className={inputClassName}
                  id="landingPlace"
                  onChange={(event) => setPlaceName(event.target.value)}
                  placeholder={messages.landing.placePlaceholder}
                  required
                  type="text"
                  value={placeName}
                />
              </Field>

              <button
                className="bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:opacity-90"
                type="submit"
              >
                {messages.landing.generate}
              </button>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}

function Field({
  children,
  htmlFor,
  label,
}: {
  children: ReactNode;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClassName =
  "h-10 w-full border border-foreground/20 bg-background px-3 text-sm text-foreground outline-none transition focus:border-foreground disabled:opacity-60";
