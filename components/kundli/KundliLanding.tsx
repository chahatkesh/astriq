"use client";

import { ArrowRight, CalendarDays, Clock3, MapPin } from "lucide-react";
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
    <main className="app-surface relative isolate min-h-screen overflow-hidden text-[var(--ink)]">
      <div
        aria-hidden="true"
        className="app-grid absolute inset-0 opacity-60"
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 py-5 sm:py-7">
          <Link className="group min-w-0" href={`/${locale}`}>
            <h1 className="font-display text-2xl leading-none font-semibold sm:text-3xl">
              {messages.app.title}
            </h1>
            <p className="mt-1 hidden text-[0.65rem] font-semibold uppercase text-[var(--ink-muted)] sm:block">
              {messages.app.eyebrow}
            </p>
          </Link>
          <nav
            className="flex shrink-0 items-center gap-1 text-sm sm:gap-2"
            aria-label="Account"
          >
            <Link
              className="px-3 py-2 font-medium text-[var(--ink-muted)] transition hover:text-[var(--ink)] sm:px-4"
              href={`/${locale}/login`}
            >
              {messages.landing.signIn}
            </Link>
            <Link
              className="rounded-sm bg-[var(--ink)] px-3 py-2 font-semibold text-white transition hover:bg-[var(--accent)] sm:px-4"
              href={`/${locale}/register`}
            >
              {messages.landing.createAccount}
            </Link>
          </nav>
        </header>

        <section className="flex flex-1 items-center justify-center py-12 sm:py-16">
          <div className="w-full max-w-2xl">
            <h2 className="font-display mx-auto max-w-xl text-center text-4xl leading-[1.05] font-medium text-balance sm:text-6xl">
              {messages.landing.headline}
            </h2>

            <section className="mt-8 rounded-md border border-[var(--line)] bg-[var(--paper)] p-4 shadow-[0_24px_70px_rgba(48,37,26,0.09)] sm:mt-10 sm:p-6">
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={handleSubmit}
              >
                <Field
                  htmlFor="landingBirthDate"
                  icon={<CalendarDays aria-hidden="true" size={15} />}
                  label={messages.form.birthDate}
                >
                  <input
                    className={inputClassName}
                    id="landingBirthDate"
                    onChange={(event) => setBirthDate(event.target.value)}
                    required
                    type="date"
                    value={birthDate}
                  />
                </Field>

                <Field
                  htmlFor="landingBirthTime"
                  icon={<Clock3 aria-hidden="true" size={15} />}
                  label={messages.form.birthTime}
                >
                  <input
                    className={inputClassName}
                    id="landingBirthTime"
                    onChange={(event) => setBirthTime(event.target.value)}
                    required
                    type="time"
                    value={birthTime}
                  />
                </Field>

                <Field
                  className="sm:col-span-2"
                  htmlFor="landingPlace"
                  icon={<MapPin aria-hidden="true" size={15} />}
                  label={messages.form.placeName}
                >
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
                  className="group flex min-h-12 items-center justify-center gap-2 rounded-sm bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:col-span-2"
                  type="submit"
                >
                  {messages.landing.generate}
                  <ArrowRight
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                    size={17}
                  />
                </button>
              </form>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  children,
  className,
  htmlFor,
  icon,
  label,
}: {
  children: ReactNode;
  className?: string;
  htmlFor: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className={`grid gap-1.5 ${className ?? ""}`}>
      <label
        className="flex items-center gap-1.5 text-sm font-medium text-[var(--ink)]"
        htmlFor={htmlFor}
      >
        <span className="text-[var(--accent)]">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClassName =
  "h-12 w-full rounded-sm border border-[var(--line-strong)] bg-white px-3 text-sm text-[var(--ink)] outline-none transition [color-scheme:light] placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:opacity-60";
