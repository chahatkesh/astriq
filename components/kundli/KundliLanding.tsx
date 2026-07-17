"use client";

import { ArrowRight, CalendarDays, Clock3, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LocaleSwitcher } from "@/components/i18n/LocaleSwitcher";
import { usePlaceSearch } from "@/hooks/use-place-search";
import { getDefaultPostAuthPath } from "@/lib/auth/redirect";
import { AppStrings } from "@/lib/i18n/app-strings";
import type { LocaleCode } from "@/lib/i18n/locales";
import { encodeDraftContext } from "@/lib/kundli/draft-context";
import type { PlaceCandidate } from "@/services/location-service";

type KundliLandingProps = {
  locale: LocaleCode;
};

export function KundliLanding({ locale }: KundliLandingProps) {
  const router = useRouter();
  const messages = AppStrings.forLocale(locale);
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [placeName, setPlaceName] = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceCandidate | null>(
    null,
  );
  const placeSearch = usePlaceSearch(placeQuery);
  const placeCandidates = placeSearch.results?.candidates ?? [];
  const isFormReady =
    birthDate.length > 0 && birthTime.length > 0 && selectedPlace !== null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const draft = encodeDraftContext({
      birthDate,
      birthTime,
      placeName,
      latitude: selectedPlace?.latitude.toString(),
      longitude: selectedPlace?.longitude.toString(),
      timeZone: selectedPlace?.timeZone,
    });

    const nextPath = getDefaultPostAuthPath(locale);
    const query = new URLSearchParams({
      next: nextPath,
      draft,
    });

    router.push(`/${locale}/login?${query.toString()}`);
  }

  return (
    <main className="app-surface relative isolate min-h-screen overflow-hidden text-(--ink)">
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
            <p className="mt-1 hidden text-[0.65rem] font-semibold uppercase text-(--ink-muted) sm:block">
              {messages.app.eyebrow}
            </p>
          </Link>
          <nav
            className="flex shrink-0 items-center gap-2 text-sm sm:gap-3"
            aria-label="Account"
          >
            <LocaleSwitcher locale={locale} />
            <Link
              className="px-2.5 py-2 font-medium text-(--ink-muted) transition hover:text-(--ink) sm:px-4"
              href={`/${locale}/login`}
            >
              {messages.landing.signIn}
            </Link>
            <Link
              className="rounded-sm bg-(--ink) px-3 py-2 font-semibold text-white transition hover:bg-(--accent) sm:px-4"
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

            <section className="mt-8 rounded-md border border-(--line) bg-(--paper) p-4 shadow-[0_24px_70px_rgba(48,37,26,0.09)] sm:mt-10 sm:p-6">
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
                  <div className="relative">
                    <input
                      aria-controls="landing-place-listbox"
                      aria-expanded={placeCandidates.length > 0}
                      autoComplete="off"
                      className={inputClassName}
                      id="landingPlace"
                      onChange={(event) => {
                        const value = event.target.value;
                        setPlaceName(value);
                        setPlaceQuery(value);
                        setSelectedPlace(null);
                      }}
                      placeholder={messages.landing.placePlaceholder}
                      required
                      role="combobox"
                      type="text"
                      value={placeName}
                    />

                    {placeCandidates.length > 0 ? (
                      <ul
                        className="absolute inset-x-0 top-[calc(100%+0.375rem)] z-20 max-h-60 overflow-y-auto rounded-sm border border-(--line) bg-white shadow-[0_16px_35px_rgba(48,37,26,0.14)]"
                        id="landing-place-listbox"
                        role="listbox"
                      >
                        {placeCandidates.map((candidate) => (
                          <li
                            aria-selected={false}
                            key={candidate.id}
                            role="option"
                          >
                            <button
                              className="flex w-full items-center justify-between gap-3 border-b border-(--line) px-3 py-2.5 text-left text-sm transition last:border-b-0 hover:bg-background"
                              onClick={() => {
                                setPlaceName(candidate.label);
                                setPlaceQuery("");
                                setSelectedPlace(candidate);
                              }}
                              type="button"
                            >
                              <span>{candidate.label}</span>
                              <span className="shrink-0 font-mono text-[0.65rem] text-(--ink-muted)">
                                {candidate.timeZone}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  {placeSearch.isSearching ? (
                    <p className="text-xs text-(--ink-muted)">
                      {messages.placeSearch.searching}
                    </p>
                  ) : null}

                  {!placeSearch.isSearching &&
                  placeQuery.trim().length >= 2 &&
                  !placeSearch.error &&
                  placeCandidates.length === 0 ? (
                    <p className="text-xs text-(--ink-muted)">
                      {messages.placeSearch.noResults}
                    </p>
                  ) : null}

                  {placeSearch.error ? (
                    <p className="text-xs text-red-700">
                      {messages.placeSearch.error}
                    </p>
                  ) : null}
                </Field>

                <button
                  className="group flex min-h-12 items-center justify-center gap-2 rounded-sm bg-(--accent) px-4 py-3 text-sm font-semibold text-white transition hover:bg-(--accent-strong) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-(--accent) sm:col-span-2"
                  disabled={!isFormReady}
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
        className="flex items-center gap-1.5 text-sm font-medium text-(--ink)"
        htmlFor={htmlFor}
      >
        <span className="text-(--accent)">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClassName =
  "h-12 w-full rounded-sm border border-(--line-strong) bg-white px-3 text-sm text-(--ink) outline-none transition [color-scheme:light] placeholder:text-(--ink-faint) focus:border-(--accent) focus:ring-2 focus:ring-(--accent-soft) disabled:opacity-60";
