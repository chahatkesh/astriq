"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { KundliChart } from "@/components/kundli/KundliChart";
import { usePlaceSearch } from "@/hooks/use-place-search";
import {
  getKundliMessages,
  type KundliMessages,
} from "@/lib/i18n/kundli-messages";
import {
  defaultLocale,
  getSupportedLocale,
  supportedLocales,
  type LocaleCode,
} from "@/lib/i18n/locales";
import { locationPresets } from "@/lib/kundli/location-presets";
import type {
  BirthChartApiError,
  BirthChartApiSuccess,
  BirthChartResult,
} from "@/lib/kundli/types";
import type { PlaceCandidate } from "@/services/location-service";

type FormState = {
  birthDate: string;
  birthTime: string;
  placeName: string;
  latitude: string;
  longitude: string;
  timeZone: string;
  useManualOffset: boolean;
  timezoneOffsetMinutes: string;
};

const initialForm: FormState = {
  birthDate: "",
  birthTime: "",
  placeName: "",
  latitude: "",
  longitude: "",
  timeZone: "Asia/Kolkata",
  useManualOffset: false,
  timezoneOffsetMinutes: "",
};

type BirthChartWorkspaceProps = {
  initialLocale?: LocaleCode;
};

export function BirthChartWorkspace({
  initialLocale = defaultLocale,
}: BirthChartWorkspaceProps) {
  const router = useRouter();
  const [localeCode, setLocaleCode] = useState<LocaleCode>(initialLocale);
  const [form, setForm] = useState<FormState>(initialForm);
  const [chart, setChart] = useState<BirthChartResult | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceCandidate | null>(
    null,
  );
  const placeSearch = usePlaceSearch(placeQuery);
  const locale = getSupportedLocale(localeCode);
  const messages = getKundliMessages(localeCode);

  function changeLocale(nextLocale: LocaleCode) {
    setLocaleCode(nextLocale);
    router.push(`/${nextLocale}`);
  }

  function selectPlace(candidate: PlaceCandidate) {
    setSelectedPlace(candidate);
    setPlaceQuery("");
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.placeName;
      delete next.latitude;
      delete next.longitude;
      delete next.timeZone;
      return next;
    });
    setForm((current) => ({
      ...current,
      placeName: candidate.label,
      latitude: candidate.latitude.toString(),
      longitude: candidate.longitude.toString(),
      timeZone: candidate.timeZone,
      useManualOffset: false,
      timezoneOffsetMinutes: "",
    }));
  }

  function clearSelectedPlace() {
    setSelectedPlace(null);
    setForm((current) => ({
      ...current,
      placeName: "",
      latitude: "",
      longitude: "",
    }));
  }

  const timeZones = useMemo(() => {
    const intlWithValues = Intl as typeof Intl & {
      supportedValuesOf?: (key: "timeZone") => string[];
    };

    if (typeof intlWithValues.supportedValuesOf === "function") {
      return intlWithValues.supportedValuesOf("timeZone");
    }

    return Array.from(
      new Set(locationPresets.map((preset) => preset.timeZone)),
    );
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const payload = {
      birthDate: form.birthDate,
      birthTime: form.birthTime,
      placeName: form.placeName,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      timeZone: form.timeZone,
      timezoneOffsetMinutes: form.useManualOffset
        ? Number(form.timezoneOffsetMinutes)
        : undefined,
      ayanamsha: "lahiri",
      houseSystem: "whole_sign",
      engineBackend: "prototype",
    };

    try {
      const response = await fetch("/api/kundli", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as
        BirthChartApiSuccess | BirthChartApiError;

      if ("error" in body) {
        setFormError(body.error.message);
        setFieldErrors(body.error.fields ?? {});
        return;
      }

      if (!response.ok) {
        setFormError(messages.states.requestFailed);
        return;
      }

      setChart(body.chart);
    } catch {
      setFormError(messages.states.requestFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  function useCurrentPosition() {
    if (!navigator.geolocation) {
      setFormError(messages.states.geolocationUnavailable);
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const browserTimeZone =
          Intl.DateTimeFormat().resolvedOptions().timeZone || form.timeZone;
        const placeName = form.placeName || messages.states.currentLocation;
        setSelectedPlace({
          id: "current-position",
          label: placeName,
          name: placeName,
          country: "",
          countryCode: "",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timeZone: browserTimeZone,
        });
        setForm((current) => ({
          ...current,
          placeName,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
          timeZone: browserTimeZone,
          useManualOffset: false,
          timezoneOffsetMinutes: "",
        }));
        setIsLocating(false);
      },
      () => {
        setFormError(messages.states.geolocationFailed);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }

  return (
    <main
      className="min-h-screen bg-background text-foreground"
      dir={locale.direction}
      lang={locale.code}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2 border-b border-foreground/15 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-foreground/50">
              {messages.app.eyebrow}
            </p>
            <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">
              {messages.app.title}
            </h1>
          </div>
          <div className="grid gap-2 sm:min-w-52">
            <label
              className="text-xs uppercase text-foreground/45"
              htmlFor="locale"
            >
              {messages.app.language}
            </label>
            <select
              className={inputClassName}
              id="locale"
              onChange={(event) =>
                changeLocale(event.target.value as LocaleCode)
              }
              value={localeCode}
            >
              {supportedLocales.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.nativeName} / {item.englishName}
                </option>
              ))}
            </select>
            <p className="font-mono text-xs text-foreground/60">
              {messages.app.subtitle}
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]">
          <section className="border border-foreground/15 bg-background">
            <div className="border-b border-foreground/15 px-4 py-3">
              <h2 className="text-base font-semibold">{messages.form.title}</h2>
            </div>

            <form className="grid gap-4 p-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <Field
                  error={fieldErrors.birthDate}
                  id="birthDate"
                  label={messages.form.birthDate}
                >
                  <input
                    className={inputClassName}
                    id="birthDate"
                    name="birthDate"
                    onChange={(event) =>
                      setForm({ ...form, birthDate: event.target.value })
                    }
                    required
                    type="date"
                    value={form.birthDate}
                  />
                </Field>

                <Field
                  error={fieldErrors.birthTime}
                  id="birthTime"
                  label={messages.form.birthTime}
                >
                  <input
                    className={inputClassName}
                    id="birthTime"
                    name="birthTime"
                    onChange={(event) =>
                      setForm({ ...form, birthTime: event.target.value })
                    }
                    required
                    type="time"
                    value={form.birthTime}
                  />
                </Field>
              </div>

              <PlaceSearchField
                error={fieldErrors.placeName}
                messages={messages}
                onClear={clearSelectedPlace}
                onQueryChange={setPlaceQuery}
                onSelect={selectPlace}
                query={placeQuery}
                search={placeSearch}
                selectedPlace={selectedPlace}
              />

              <button
                className="border border-foreground/20 px-3 py-2 text-sm font-medium transition hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLocating}
                onClick={useCurrentPosition}
                type="button"
              >
                {isLocating
                  ? messages.form.readingPosition
                  : messages.form.currentPosition}
              </button>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <Field
                  error={fieldErrors.latitude}
                  id="latitude"
                  label={messages.form.latitude}
                >
                  <input
                    className={inputClassName}
                    id="latitude"
                    inputMode="decimal"
                    max="90"
                    min="-90"
                    name="latitude"
                    onChange={(event) =>
                      setForm({ ...form, latitude: event.target.value })
                    }
                    required
                    step="0.000001"
                    type="number"
                    value={form.latitude}
                  />
                </Field>

                <Field
                  error={fieldErrors.longitude}
                  id="longitude"
                  label={messages.form.longitude}
                >
                  <input
                    className={inputClassName}
                    id="longitude"
                    inputMode="decimal"
                    max="180"
                    min="-180"
                    name="longitude"
                    onChange={(event) =>
                      setForm({ ...form, longitude: event.target.value })
                    }
                    required
                    step="0.000001"
                    type="number"
                    value={form.longitude}
                  />
                </Field>
              </div>

              <Field
                error={fieldErrors.timeZone}
                id="timeZone"
                label={messages.form.timeZone}
              >
                <input
                  className={inputClassName}
                  id="timeZone"
                  list="time-zone-options"
                  name="timeZone"
                  onChange={(event) =>
                    setForm({ ...form, timeZone: event.target.value })
                  }
                  required
                  value={form.timeZone}
                />
                <datalist id="time-zone-options">
                  {timeZones.map((timeZone) => (
                    <option key={timeZone} value={timeZone} />
                  ))}
                </datalist>
              </Field>

              <label className="flex items-start gap-3 border border-foreground/15 p-3 text-sm">
                <input
                  checked={form.useManualOffset}
                  className="mt-1 h-4 w-4 accent-foreground"
                  onChange={(event) =>
                    setForm({
                      ...form,
                      useManualOffset: event.target.checked,
                    })
                  }
                  type="checkbox"
                />
                <span>
                  <span className="block font-medium">
                    {messages.form.manualOffset}
                  </span>
                </span>
              </label>

              {form.useManualOffset ? (
                <Field
                  error={fieldErrors.timezoneOffsetMinutes}
                  id="timezoneOffsetMinutes"
                  label={messages.form.offsetMinutes}
                >
                  <input
                    className={inputClassName}
                    id="timezoneOffsetMinutes"
                    inputMode="numeric"
                    max={14 * 60}
                    min={-14 * 60}
                    name="timezoneOffsetMinutes"
                    onChange={(event) =>
                      setForm({
                        ...form,
                        timezoneOffsetMinutes: event.target.value,
                      })
                    }
                    required
                    step="1"
                    type="number"
                    value={form.timezoneOffsetMinutes}
                  />
                </Field>
              ) : null}

              {formError ? (
                <p
                  aria-live="polite"
                  className="border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200"
                >
                  {formError}
                </p>
              ) : null}

              <button
                className="bg-foreground px-4 py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? messages.form.submitting : messages.form.submit}
              </button>
            </form>
          </section>

          <section aria-live="polite" className="min-w-0">
            {isSubmitting ? <LoadingState messages={messages} /> : null}
            {!isSubmitting && chart ? (
              <KundliChart
                chart={chart}
                localeCode={localeCode}
                messages={messages}
              />
            ) : null}
            {!isSubmitting && !chart ? (
              <EmptyState messages={messages} />
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function PlaceSearchField({
  error,
  messages,
  onClear,
  onQueryChange,
  onSelect,
  query,
  search,
  selectedPlace,
}: {
  error?: string;
  messages: KundliMessages;
  onClear: () => void;
  onQueryChange: (value: string) => void;
  onSelect: (candidate: PlaceCandidate) => void;
  query: string;
  search: ReturnType<typeof usePlaceSearch>;
  selectedPlace: PlaceCandidate | null;
}) {
  const listId = "place-search-listbox";
  const candidates = search.results?.candidates ?? [];
  const showAmbiguous = Boolean(search.results?.ambiguous);
  const showNoResults =
    !search.isSearching &&
    query.trim().length >= 2 &&
    !search.error &&
    candidates.length === 0;

  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium" htmlFor="placeSearch">
        {messages.placeSearch.label}
      </label>

      {selectedPlace ? (
        <div className="flex items-center justify-between gap-2 border border-foreground/20 bg-foreground/3 px-3 py-2 text-sm">
          <span>
            <span className="block text-xs text-foreground/55">
              {messages.placeSearch.resolved}
            </span>
            <span className="font-medium">{selectedPlace.label}</span>
            <span className="block font-mono text-xs text-foreground/55">
              {selectedPlace.timeZone}
            </span>
          </span>
          <button
            className="border border-foreground/20 px-2 py-1 text-xs font-medium transition hover:bg-foreground hover:text-background"
            onClick={onClear}
            type="button"
          >
            {messages.placeSearch.clear}
          </button>
        </div>
      ) : (
        <>
          <input
            aria-controls={listId}
            aria-expanded={candidates.length > 0}
            autoComplete="off"
            className={inputClassName}
            id="placeSearch"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={messages.placeSearch.placeholder}
            role="combobox"
            type="text"
            value={query}
          />
          <p className="text-xs text-foreground/55">
            {messages.placeSearch.hint}
          </p>

          {search.isSearching ? (
            <p className="text-xs text-foreground/55">
              {messages.placeSearch.searching}
            </p>
          ) : null}

          {showAmbiguous ? (
            <p className="text-xs text-amber-700 dark:text-amber-200">
              {messages.placeSearch.ambiguous}
            </p>
          ) : null}

          {candidates.length > 0 ? (
            <ul
              className="grid divide-y divide-foreground/10 border border-foreground/20"
              id={listId}
              role="listbox"
            >
              {candidates.map((candidate) => (
                <li key={candidate.id} role="option" aria-selected={false}>
                  <button
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition hover:bg-foreground hover:text-background"
                    onClick={() => onSelect(candidate)}
                    type="button"
                  >
                    <span>{candidate.label}</span>
                    <span className="font-mono text-xs opacity-60">
                      {candidate.timeZone}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {showNoResults ? (
            <p className="text-xs text-foreground/55">
              {messages.placeSearch.noResults}
            </p>
          ) : null}

          {search.error ? (
            <p className="text-xs text-red-700 dark:text-red-200">
              {messages.placeSearch.error}
            </p>
          ) : null}
        </>
      )}

      {error ? (
        <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
      ) : null}
    </div>
  );
}

function Field({
  children,
  error,
  id,
  label,
}: {
  children: ReactNode;
  error?: string;
  id: string;
  label: string;
}) {
  const errorId = `${id}-error`;

  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-red-700 dark:text-red-200" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function LoadingState({ messages }: { messages: KundliMessages }) {
  return (
    <div className="grid min-h-[24rem] place-items-center border border-foreground/15">
      <div className="text-center">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-foreground/45">
          {messages.states.loadingEyebrow}
        </p>
        <p className="mt-2 text-lg font-semibold">
          {messages.states.loadingTitle}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ messages }: { messages: KundliMessages }) {
  return (
    <div className="grid min-h-[24rem] place-items-center border border-dashed border-foreground/20 px-6 text-center">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-foreground/45">
          {messages.states.emptyEyebrow}
        </p>
        <p className="mt-2 text-lg font-semibold">
          {messages.states.emptyTitle}
        </p>
      </div>
    </div>
  );
}

const inputClassName =
  "h-10 w-full border border-foreground/20 bg-background px-3 text-sm text-foreground outline-none transition focus:border-foreground disabled:opacity-60";
