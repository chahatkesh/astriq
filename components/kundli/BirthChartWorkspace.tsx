"use client";

import { LocateFixed, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { KundliChart } from "@/components/kundli/KundliChart";
import { usePlaceSearch } from "@/hooks/use-place-search";
import { getDefaultPostAuthPath } from "@/lib/auth/redirect";
import {
  AppStrings,
  formatAppString,
  type AppStringsDictionary,
} from "@/lib/i18n/app-strings";
import {
  defaultLocale,
  getSupportedLocale,
  supportedLocales,
  type LocaleCode,
} from "@/lib/i18n/locales";
import {
  decodeDraftContext,
  encodeDraftContext,
} from "@/lib/kundli/draft-context";
import { getDashboardPath } from "@/lib/kundli/dashboard-path";
import { locationPresets } from "@/lib/kundli/location-presets";
import type {
  BirthChartApiError,
  BirthChartApiSuccess,
  BirthChartResult,
  ChartQuota,
  UserChartSummary,
} from "@/lib/kundli/types";
import type { PlaceCandidate } from "@/services/location-service";

type FormState = {
  subjectName: string;
  birthDate: string;
  birthTime: string;
  placeName: string;
  latitude: string;
  longitude: string;
  timeZone: string;
  timezoneOffsetMinutes: string;
};

const defaultForm: FormState = {
  subjectName: "",
  birthDate: "",
  birthTime: "",
  placeName: "",
  latitude: "",
  longitude: "",
  timeZone: "Asia/Kolkata",
  timezoneOffsetMinutes: "",
};

type BirthChartWorkspaceProps = {
  initialLocale?: LocaleCode;
  authenticated?: boolean;
  userDisplayName?: string;
  initialDraftToken?: string;
  initialChartId?: string;
  initialActiveChart?: UserChartSummary | null;
  initialChartHistory?: UserChartSummary[];
  initialQuota?: ChartQuota;
};

export function BirthChartWorkspace({
  initialLocale = defaultLocale,
  authenticated = false,
  userDisplayName,
  initialDraftToken,
  initialChartId,
  initialActiveChart = null,
  initialChartHistory = [],
  initialQuota,
}: BirthChartWorkspaceProps) {
  const router = useRouter();
  const [localeCode, setLocaleCode] = useState<LocaleCode>(initialLocale);
  const [form, setForm] = useState<FormState>(() =>
    buildInitialForm(initialDraftToken),
  );
  const [chart, setChart] = useState<BirthChartResult | null>(
    initialActiveChart?.chart ?? null,
  );
  const [activeChartId, setActiveChartId] = useState<string | null>(
    initialActiveChart?.id ?? null,
  );
  const [showChartNotFound, setShowChartNotFound] = useState(
    Boolean(initialChartId && !initialActiveChart),
  );
  const [chartHistory, setChartHistory] =
    useState<UserChartSummary[]>(initialChartHistory);
  const [quota, setQuota] = useState<ChartQuota | null>(initialQuota ?? null);
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
  const messages = AppStrings.forLocale(localeCode);
  const isLocationLocked = selectedPlace !== null;

  const hasQuota = !authenticated || !quota || quota.remaining > 0;

  useEffect(() => {
    if (!initialChartId || initialActiveChart) {
      return;
    }

    router.replace(getDashboardPath(localeCode), { scroll: false });
  }, [initialActiveChart, initialChartId, localeCode, router]);

  function syncChartUrl(chartId: string | null) {
    if (!authenticated) {
      return;
    }

    setActiveChartId(chartId);
    router.replace(
      getDashboardPath(localeCode, chartId ? { chart: chartId } : {}),
      { scroll: false },
    );
  }

  function changeLocale(nextLocale: LocaleCode) {
    setLocaleCode(nextLocale);
    const target = authenticated
      ? getDashboardPath(
          nextLocale,
          activeChartId ? { chart: activeChartId } : {},
        )
      : `/${nextLocale}`;
    router.push(target);
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
    }));
  }

  function clearSelectedPlace() {
    setSelectedPlace(null);
    setForm((current) => ({
      ...current,
      placeName: "",
      latitude: "",
      longitude: "",
      timezoneOffsetMinutes: "",
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

    if (!authenticated) {
      redirectToLoginWithDraft();
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFieldErrors({});

    const payload = {
      subjectName: form.subjectName.trim(),
      birthDate: form.birthDate,
      birthTime: form.birthTime,
      placeName: form.placeName,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      timeZone: form.timeZone,
      timezoneOffsetMinutes: form.timezoneOffsetMinutes.trim()
        ? Number(form.timezoneOffsetMinutes)
        : undefined,
      ayanamsha: "lahiri",
      houseSystem: "whole_sign",
      engineBackend: "jpl_spice",
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

      if (!response.ok || "error" in body) {
        const errorBody = "error" in body ? body.error : undefined;

        if (response.status === 401 || errorBody?.requiresLogin) {
          redirectToLoginWithDraft();
          return;
        }

        setFormError(errorBody?.message ?? messages.states.requestFailed);
        setFieldErrors(errorBody?.fields ?? {});

        if (errorBody?.quota) {
          setQuota(errorBody.quota);
        }

        return;
      }

      setChart(body.chart);
      setQuota(body.quota);
      syncChartUrl(body.savedChart.id);
      setShowChartNotFound(false);
      setChartHistory((current) => {
        const withoutDuplicate = current.filter(
          (item) => item.id !== body.savedChart.id,
        );
        return [body.savedChart, ...withoutDuplicate];
      });
    } catch {
      setFormError(messages.states.requestFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(`/${localeCode}`);
    router.refresh();
  }

  function redirectToLoginWithDraft() {
    const draft = encodeDraftContext(form);
    const nextPath = getDefaultPostAuthPath(localeCode);
    const query = new URLSearchParams({
      next: nextPath,
      draft,
    });

    router.push(`/${localeCode}/login?${query.toString()}`);
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
      className="app-surface min-h-screen text-[var(--ink)]"
      dir={locale.direction}
      lang={locale.code}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-3xl leading-none font-semibold sm:text-4xl">
              {messages.app.title}
            </h1>
            {authenticated && userDisplayName ? (
              <p className="mt-2 truncate text-sm text-[var(--ink-muted)]">
                {formatAppString(messages.account.welcome, {
                  name: userDisplayName,
                })}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="sr-only" htmlFor="locale">
              {messages.app.language}
            </label>
            <select
              className="h-10 min-w-44 rounded-sm border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
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

            {authenticated ? (
              <div className="flex h-10 items-center gap-3">
                <p className="text-xs text-[var(--ink-muted)]">
                  {formatAppString(messages.account.remainingCharts, {
                    count: quota?.remaining ?? "-",
                  })}
                </p>
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-sm border border-[var(--line-strong)] bg-[var(--paper)] px-3 text-xs font-semibold transition hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut aria-hidden="true" className="size-3.5" />
                  {messages.account.logout}
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(20rem,23rem)_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper)] shadow-[0_18px_50px_rgba(48,37,26,0.07)]">
            <div className="border-b border-[var(--line)] px-5 py-4">
              <h2 className="font-display text-xl font-semibold">
                {messages.form.title}
              </h2>
              {authenticated && quota ? (
                <p className="mt-1 text-xs text-[var(--ink-muted)]">
                  {formatAppString(messages.account.chartsUsed, {
                    used: quota.used,
                    limit: quota.limit,
                  })}
                </p>
              ) : null}
            </div>

            <form className="grid gap-4 p-5" onSubmit={handleSubmit}>
              <Field
                error={fieldErrors.subjectName}
                id="subjectName"
                label={messages.form.chartName}
              >
                <input
                  autoComplete="name"
                  className={inputClassName}
                  id="subjectName"
                  maxLength={120}
                  name="subjectName"
                  onChange={(event) =>
                    setForm({ ...form, subjectName: event.target.value })
                  }
                  placeholder={messages.form.chartNamePlaceholder}
                  required
                  type="text"
                  value={form.subjectName}
                />
              </Field>

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
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-[var(--line-strong)] px-3 py-2 text-sm font-medium text-[var(--ink-muted)] transition hover:border-[var(--ink)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isLocating}
                onClick={useCurrentPosition}
                type="button"
              >
                <LocateFixed aria-hidden="true" className="size-4" />
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
                    disabled={isLocationLocked}
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
                    disabled={isLocationLocked}
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
                  disabled={isLocationLocked}
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

              <Field
                error={fieldErrors.timezoneOffsetMinutes}
                id="timezoneOffsetMinutes"
                label={messages.form.offsetMinutes}
              >
                <input
                  className={inputClassName}
                  id="timezoneOffsetMinutes"
                  name="timezoneOffsetMinutes"
                  onChange={(event) =>
                    setForm({
                      ...form,
                      timezoneOffsetMinutes: event.target.value,
                    })
                  }
                  placeholder={messages.account.offsetPlaceholder}
                  type="number"
                  value={form.timezoneOffsetMinutes}
                />
              </Field>

              {formError ? (
                <p
                  aria-live="polite"
                  className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {formError}
                </p>
              ) : null}

              {authenticated && !hasQuota ? (
                <p className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {messages.account.quotaExhausted}
                </p>
              ) : null}

              <button
                className="min-h-12 rounded-sm bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-55"
                disabled={isSubmitting || !hasQuota}
                type="submit"
              >
                {isSubmitting ? messages.form.submitting : messages.form.submit}
              </button>
            </form>
          </section>

          <section aria-live="polite" className="min-w-0">
            {showChartNotFound ? (
              <p className="mb-4 rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {messages.states.chartNotFound}
              </p>
            ) : null}
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

            {authenticated ? (
              <ChartHistoryPanel
                history={chartHistory}
                messages={messages}
                onSelectChart={(selected) => {
                  setChart(selected.chart);
                  syncChartUrl(selected.id);
                  setShowChartNotFound(false);
                }}
              />
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function buildInitialForm(draftToken?: string) {
  const draft = decodeDraftContext(draftToken) ?? {};

  return {
    ...defaultForm,
    subjectName: draft.subjectName ?? defaultForm.subjectName,
    birthDate: draft.birthDate ?? defaultForm.birthDate,
    birthTime: draft.birthTime ?? defaultForm.birthTime,
    placeName: draft.placeName ?? defaultForm.placeName,
    latitude: draft.latitude ?? defaultForm.latitude,
    longitude: draft.longitude ?? defaultForm.longitude,
    timeZone: draft.timeZone ?? defaultForm.timeZone,
    timezoneOffsetMinutes:
      draft.timezoneOffsetMinutes ?? defaultForm.timezoneOffsetMinutes,
  } satisfies FormState;
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
  messages: AppStringsDictionary;
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
        <div className="flex items-center justify-between gap-2 rounded-sm border border-[var(--line)] bg-[var(--background)] px-3 py-2 text-sm">
          <span>
            <span className="block text-xs text-[var(--ink-muted)]">
              {messages.placeSearch.resolved}
            </span>
            <span className="font-medium">{selectedPlace.label}</span>
            <span className="block font-mono text-xs text-[var(--ink-muted)]">
              {selectedPlace.timeZone}
            </span>
          </span>
          <button
            className="rounded-sm border border-[var(--line-strong)] px-2 py-1 text-xs font-medium transition hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-white"
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
          <p className="text-xs text-[var(--ink-muted)]">
            {messages.placeSearch.hint}
          </p>

          {search.isSearching ? (
            <p className="text-xs text-[var(--ink-muted)]">
              {messages.placeSearch.searching}
            </p>
          ) : null}

          {showAmbiguous ? (
            <p className="text-xs text-amber-700">
              {messages.placeSearch.ambiguous}
            </p>
          ) : null}

          {candidates.length > 0 ? (
            <ul
              className="grid divide-y divide-[var(--line)] overflow-hidden rounded-sm border border-[var(--line)] bg-white"
              id={listId}
              role="listbox"
            >
              {candidates.map((candidate) => (
                <li key={candidate.id} aria-selected={false} role="option">
                  <button
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition hover:bg-[var(--ink)] hover:text-white"
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
            <p className="text-xs text-[var(--ink-muted)]">
              {messages.placeSearch.noResults}
            </p>
          ) : null}

          {search.error ? (
            <p className="text-xs text-red-700">{messages.placeSearch.error}</p>
          ) : null}
        </>
      )}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}
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
        <p className="text-sm text-red-700" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function LoadingState({ messages }: { messages: AppStringsDictionary }) {
  return (
    <div className="grid min-h-96 place-items-center rounded-md border border-[var(--line)] bg-[var(--paper)]">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase text-[var(--ink-muted)]">
          {messages.states.loadingEyebrow}
        </p>
        <p className="mt-2 text-lg font-semibold">
          {messages.states.loadingTitle}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ messages }: { messages: AppStringsDictionary }) {
  return (
    <div className="grid min-h-96 place-items-center rounded-md border border-dashed border-[var(--line-strong)] bg-[rgba(255,253,248,0.55)] px-6 text-center">
      <div>
        <p className="text-xs font-semibold uppercase text-[var(--ink-muted)]">
          {messages.states.emptyEyebrow}
        </p>
        <p className="mt-2 text-lg font-semibold">
          {messages.states.emptyTitle}
        </p>
      </div>
    </div>
  );
}

function ChartHistoryPanel({
  history,
  messages,
  onSelectChart,
}: {
  history: UserChartSummary[];
  messages: AppStringsDictionary;
  onSelectChart: (item: UserChartSummary) => void;
}) {
  return (
    <section className="mt-5 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--paper)]">
      <div className="border-b border-[var(--line)] px-4 py-3">
        <h2 className="font-display text-lg font-semibold">
          {messages.history.title}
        </h2>
      </div>

      {history.length === 0 ? (
        <p className="px-4 py-6 text-sm text-[var(--ink-muted)]">
          {messages.history.empty}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {history.map((item) => (
            <li key={item.id}>
              <button
                className="grid w-full gap-1 px-4 py-3 text-left transition hover:bg-[var(--background)]"
                onClick={() => onSelectChart(item)}
                type="button"
              >
                <span className="text-sm font-medium">
                  {item.subjectName || messages.history.unnamed}
                </span>
                <span className="text-xs text-[var(--ink-muted)]">
                  {item.placeName} | {item.localDateTime}
                </span>
                <span className="font-mono text-xs text-[var(--ink-faint)]">
                  {formatAppString(messages.history.savedAt, {
                    when: formatSavedAt(item.createdAt),
                  })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function formatSavedAt(createdAt: string) {
  const timestamp = Date.parse(createdAt);

  if (Number.isNaN(timestamp)) {
    return createdAt;
  }

  return `${new Date(timestamp)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ")} UTC`;
}

const inputClassName =
  "h-11 w-full rounded-sm border border-[var(--line-strong)] bg-white px-3 text-sm text-[var(--ink)] outline-none transition placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] disabled:bg-[var(--background)] disabled:opacity-70";
