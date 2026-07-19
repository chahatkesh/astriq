"use client";

import { ArrowRight, CalendarDays, Clock3, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
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

type Star = {
  top: string;
  left: string;
  size: number;
  delay: string;
  duration: string;
};

function buildStars(count: number): Star[] {
  // Deterministic pseudo-random layout so SSR and client markup match.
  const stars: Star[] = [];
  let seed = 41;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  for (let i = 0; i < count; i += 1) {
    stars.push({
      top: `${(next() * 100).toFixed(2)}%`,
      left: `${(next() * 100).toFixed(2)}%`,
      size: next() > 0.82 ? 2.5 : 1.5,
      delay: `${(next() * 4).toFixed(2)}s`,
      duration: `${(2.4 + next() * 3.2).toFixed(2)}s`,
    });
  }

  return stars;
}

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
  const stars = useMemo(() => buildStars(70), []);

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
    <main className="landing-root relative isolate min-h-screen overflow-hidden text-(--ink)">
      <CosmicBackdrop stars={stars} />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 sm:px-6 lg:px-8">
        <header className="landing-reveal py-4 sm:py-7">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <Link
              className="group flex min-w-0 items-center"
              href={`/${locale}`}
            >
              <span className="font-hero text-2xl leading-none font-semibold tracking-wide sm:text-[1.7rem]">
                {messages.app.title}
              </span>
            </Link>

            <nav
              className="flex items-center gap-2 text-sm sm:gap-3"
              aria-label="Account"
            >
              <LocaleSwitcher locale={locale} />
              <Link
                className="hidden px-2.5 py-2 text-sm font-medium whitespace-nowrap text-(--ink-muted) transition hover:text-(--ink) sm:inline-block sm:px-4"
                href={`/${locale}/login`}
              >
                {messages.landing.signIn}
              </Link>
              <Link
                className="rounded-full border border-(--line-strong) px-3 py-2 text-xs font-semibold whitespace-nowrap text-(--ink) transition hover:border-(--accent) hover:text-(--accent-strong) sm:px-5 sm:text-sm"
                href={`/${locale}/register`}
              >
                {messages.landing.createAccount}
              </Link>
            </nav>
          </div>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-10 sm:py-14 lg:py-16">
          <p
            className="landing-reveal mb-4 flex items-center gap-3 text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-(--accent) sm:text-[0.65rem] sm:tracking-[0.35em]"
            style={{ animationDelay: "0.1s" }}
          >
            <span aria-hidden="true" className="h-px w-8 bg-(--accent)/50" />
            {messages.app.eyebrow}
            <span aria-hidden="true" className="h-px w-8 bg-(--accent)/50" />
          </p>

          <h2
            className="landing-reveal landing-headline font-hero mx-auto max-w-4xl text-center text-4xl leading-[1.04] font-medium text-balance sm:text-6xl lg:text-7xl"
            style={{ animationDelay: "0.22s" }}
          >
            {messages.landing.headline}
          </h2>

          <section
            className="landing-panel landing-glass landing-reveal mt-9 w-full max-w-2xl rounded-xl p-4 sm:mt-11 sm:p-6"
            style={{ animationDelay: "0.4s" }}
          >
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <Field
                htmlFor="landingBirthDate"
                icon={<CalendarDays aria-hidden="true" size={15} />}
                label={messages.form.birthDate}
              >
                <input
                  className="landing-input"
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
                  className="landing-input"
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
                    className="landing-input"
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
                      className="landing-popover absolute inset-x-0 top-[calc(100%+0.375rem)] z-20 max-h-60 overflow-y-auto rounded-md"
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
                            className="flex w-full items-center justify-between gap-3 border-b border-(--line) px-3 py-2.5 text-left text-sm transition last:border-b-0 hover:bg-(--accent-soft)"
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
                  <p className="text-xs text-red-400">
                    {messages.placeSearch.error}
                  </p>
                ) : null}
              </Field>

              <button
                className="landing-cta group flex min-h-12 items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
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
        </section>
      </div>
    </main>
  );
}

function CosmicBackdrop({ stars }: { stars: Star[] }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {stars.map((star, index) => (
        <span
          className="landing-star"
          key={index}
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
            animationDuration: star.duration,
          }}
        />
      ))}

      <span
        className="landing-orb"
        style={{
          top: "-12%",
          left: "18%",
          width: "34rem",
          height: "34rem",
          background: "rgba(103, 63, 160, 0.32)",
        }}
      />
      <span
        className="landing-orb"
        style={{
          bottom: "-18%",
          right: "-8%",
          width: "28rem",
          height: "28rem",
          background: "rgba(180, 92, 55, 0.22)",
          animationDelay: "-13s",
          animationDuration: "32s",
        }}
      />

      <span
        className="landing-shooting-star"
        style={{ top: "16%", left: "72%" }}
      />
      <span
        className="landing-shooting-star"
        style={{ top: "34%", left: "30%", animationDelay: "6.5s" }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 48%, rgba(11, 8, 20, 0.55), transparent 70%)",
        }}
      />
    </div>
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
