"use client";

import { Download, LoaderCircle } from "lucide-react";
import { useRef, useState, type CSSProperties } from "react";
import type { AppStringsDictionary } from "@/lib/i18n/app-strings";
import { localizeTerm } from "@/lib/i18n/glossary";
import type { LocaleCode } from "@/lib/i18n/locales";
import { downloadChartAsPdf } from "@/lib/kundli/chart-pdf";
import {
  formatChartDegrees,
  formatChartNumber,
} from "@/lib/kundli/chart-notation";
import type {
  BirthChartResult,
  KundliHouse,
  PlanetPosition,
} from "@/lib/kundli/types";

type KundliChartProps = {
  chart: BirthChartResult;
  localeCode: LocaleCode;
  messages: AppStringsDictionary;
};

const houseCellStyles: Record<number, CSSProperties> = {
  1: { gridColumn: "1", gridRow: "1" },
  2: { gridColumn: "2", gridRow: "1" },
  3: { gridColumn: "3", gridRow: "1" },
  4: { gridColumn: "4", gridRow: "1" },
  5: { gridColumn: "4", gridRow: "2" },
  6: { gridColumn: "4", gridRow: "3" },
  7: { gridColumn: "4", gridRow: "4" },
  8: { gridColumn: "3", gridRow: "4" },
  9: { gridColumn: "2", gridRow: "4" },
  10: { gridColumn: "1", gridRow: "4" },
  11: { gridColumn: "1", gridRow: "3" },
  12: { gridColumn: "1", gridRow: "2" },
};

const planetLabels: Record<string, string> = {
  sun: "Su",
  moon: "Mo",
  mars: "Ma",
  mercury: "Me",
  jupiter: "Ju",
  venus: "Ve",
  saturn: "Sa",
  rahu: "Ra",
  ketu: "Ke",
};

function localizeSign(sign: string, localeCode: LocaleCode) {
  return localizeTerm(localeCode, sign.toLowerCase());
}

export function KundliChart({ chart, localeCode, messages }: KundliChartProps) {
  const paperRef = useRef<HTMLElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const planetByKey = new Map(
    chart.planets.map((planet) => [planet.key, planet] as const),
  );
  const sun = planetByKey.get("sun");
  const moon = planetByKey.get("moon");

  async function handleDownload() {
    if (!paperRef.current || isExporting) {
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      await downloadChartAsPdf(paperRef.current, chart.subjectName);
    } catch {
      setExportError(messages.chart.downloadFailed);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--line) pb-3">
        <div>
          <h2 className="font-display text-2xl font-semibold">
            {messages.chart.kundli}
          </h2>
          <p className="text-sm text-(--ink-muted)">
            {chart.subjectName || messages.chart.unnamed}
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-sm bg-(--ink) px-3 text-sm font-semibold text-white transition hover:bg-(--accent) disabled:cursor-not-allowed disabled:opacity-55"
          disabled={isExporting}
          onClick={handleDownload}
          type="button"
        >
          {isExporting ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Download aria-hidden="true" className="size-4" />
          )}
          {isExporting
            ? messages.chart.downloading
            : messages.chart.downloadPdf}
        </button>
      </div>

      {exportError ? (
        <p
          aria-live="polite"
          className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {exportError}
        </p>
      ) : null}

      <section
        className="kundli-paper mx-auto w-full p-5 sm:p-8"
        ref={paperRef}
      >
        <header className="kundli-paper-header text-center">
          <p className="kundli-paper-kicker">{messages.app.title}</p>
          <h3 className="mt-2 text-2xl leading-tight font-semibold sm:text-3xl">
            {chart.subjectName || messages.chart.unnamed}
          </h3>
          <p className="kundli-paper-muted mt-1 text-xs uppercase sm:text-sm">
            {messages.app.eyebrow}
          </p>
          <div className="kundli-paper-rule mx-auto mt-4 w-20" />
          <p className="kundli-paper-muted mt-4 text-xs leading-5 sm:text-sm">
            {chart.metadata.placeName}
            <span aria-hidden="true"> · </span>
            {formatLocalTime(chart)}
          </p>
        </header>

        <dl className="kundli-paper-summary mt-6 grid grid-cols-3 text-center text-sm">
          <SummaryItem
            detail={`${formatChartDegrees(
              chart.ascendant.degreeInSign,
              messages.chart.degreeUnit,
            )} / ${chart.ascendant.nakshatra.name} ${formatChartNumber(
              chart.ascendant.nakshatra.pada,
            )}`}
            label={messages.chart.lagna}
            value={localizeSign(chart.ascendant.sign, localeCode)}
          />
          <SummaryItem
            detail={
              moon ? formatPlanetDetail(moon, messages.chart.degreeUnit) : "-"
            }
            label={messages.chart.moon}
            value={moon ? localizeSign(moon.sign, localeCode) : "-"}
          />
          <SummaryItem
            detail={
              sun ? formatPlanetDetail(sun, messages.chart.degreeUnit) : "-"
            }
            label={messages.chart.sun}
            value={sun ? localizeSign(sun.sign, localeCode) : "-"}
          />
        </dl>

        <div className="mx-auto mt-5 w-full max-w-md">
          <div
            aria-label={messages.chart.ariaLabel}
            className="kundli-paper-chart relative grid aspect-square w-full grid-cols-4 grid-rows-4"
          >
            <div className="kundli-paper-center col-start-2 col-span-2 row-start-2 row-span-2 flex flex-col items-center justify-center p-3 text-center">
              <span className="kundli-paper-muted text-[0.65rem] uppercase sm:text-xs">
                {messages.chart.lagna}
              </span>
              <span className="mt-1 text-base font-semibold sm:text-xl">
                {localizeSign(chart.ascendant.sign, localeCode)}
              </span>
              <span className="kundli-paper-muted font-mono text-xs sm:text-sm">
                {formatChartDegrees(
                  chart.ascendant.degreeInSign,
                  messages.chart.degreeUnit,
                )}
              </span>
              <span className="kundli-paper-muted mt-2 text-[0.65rem] sm:text-xs">
                {chart.ascendant.nakshatra.name}{" "}
                {formatChartNumber(chart.ascendant.nakshatra.pada)}
              </span>
            </div>

            {chart.houses.map((house) => (
              <HouseCell
                house={house}
                key={house.number}
                localeCode={localeCode}
                messages={messages}
                planetByKey={planetByKey}
              />
            ))}
          </div>
        </div>

        <section className="mt-5">
          <div className="flex items-end justify-between gap-3">
            <h4 className="text-sm font-semibold uppercase sm:text-base">
              {messages.chart.planetaryPositions}
            </h4>
            <p className="kundli-paper-muted text-[0.6rem] sm:text-xs">
              {messages.chart.planetarySubtitle}
            </p>
          </div>
          <ul className="kundli-paper-planets mt-3 grid grid-cols-3">
            {chart.planets.map((planet) => (
              <li className="min-w-0 p-2 sm:p-3" key={planet.key}>
                <div className="flex items-baseline justify-between gap-1">
                  <span className="min-w-0 wrap-break-word text-xs font-semibold sm:text-sm">
                    {localizeTerm(localeCode, planet.key)}
                    {planet.retrograde
                      ? ` ${messages.chart.retrogradeMarker}`
                      : ""}
                  </span>
                  <span className="kundli-paper-muted font-mono text-[0.6rem] sm:text-xs">
                    {messages.chart.housePrefix}
                    {formatChartNumber(planet.house)}
                  </span>
                </div>
                <p className="kundli-paper-muted mt-1 wrap-break-word text-[0.6rem] sm:text-xs">
                  {localizeSign(planet.sign, localeCode)} ·{" "}
                  {formatChartDegrees(
                    planet.degreeInSign,
                    messages.chart.degreeUnit,
                  )}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <footer className="kundli-paper-footer mt-5 pt-3 text-center text-[0.6rem] leading-4 sm:text-xs">
          <p>
            {messages.chart.footerProfile} ·{" "}
            {chart.metadata.calculationProfile?.ephemeris ??
              chart.metadata.ephemeris}
          </p>
          {chart.metadata.warnings.map((warning) => (
            <p className="mt-1" key={warning}>
              {warning}
            </p>
          ))}
        </footer>
      </section>
    </div>
  );
}

function SummaryItem({
  detail,
  label,
  value,
}: {
  detail: string;
  label: string;
  value: string;
}) {
  return (
    <div className="kundli-paper-summary-item min-w-0 px-2 py-3 sm:px-4">
      <dt className="kundli-paper-muted text-[0.6rem] uppercase sm:text-xs">
        {label}
      </dt>
      <dd className="mt-1 wrap-break-word text-sm font-semibold sm:text-lg">
        {value}
      </dd>
      <dd className="kundli-paper-muted mt-1 wrap-break-word text-[0.55rem] leading-4 sm:text-xs">
        {detail}
      </dd>
    </div>
  );
}

function HouseCell({
  house,
  localeCode,
  messages,
  planetByKey,
}: {
  house: KundliHouse;
  localeCode: LocaleCode;
  messages: AppStringsDictionary;
  planetByKey: Map<string, PlanetPosition>;
}) {
  return (
    <div
      className="kundli-paper-house flex min-h-0 flex-col justify-between p-1 sm:p-2"
      style={houseCellStyles[house.number]}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="kundli-paper-muted font-mono text-[0.55rem] sm:text-xs">
          {messages.chart.housePrefix}
          {house.number}
        </span>
        <span className="max-w-[75%] wrap-break-word text-right text-[0.55rem] font-medium leading-tight sm:text-xs">
          {localizeSign(house.sign, localeCode)}
        </span>
      </div>

      <div className="mt-1 flex flex-wrap gap-0.5 sm:gap-1">
        {house.planets.map((planetKey) => {
          const planet = planetByKey.get(planetKey);
          return (
            <span
              className="kundli-paper-planet-tag px-1 py-0.5 font-mono text-[0.5rem] sm:px-1.5 sm:text-[0.68rem]"
              key={planetKey}
              title={localizeTerm(localeCode, planetKey)}
            >
              {planetLabels[planetKey] ?? planetKey.slice(0, 2)}
              {planet?.retrograde ? "R" : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function formatPlanetDetail(planet: PlanetPosition, degreeUnit: string) {
  return `${formatChartDegrees(planet.degreeInSign, degreeUnit)} / ${
    planet.nakshatra.name
  } ${formatChartNumber(planet.nakshatra.pada)}`;
}

function formatLocalTime(chart: BirthChartResult) {
  return `${chart.metadata.localDateTime} ${formatOffset(
    chart.metadata.timezoneOffsetMinutes,
  )}`;
}

function formatOffset(minutes: number) {
  const sign = minutes >= 0 ? "+" : "-";
  const absolute = Math.abs(minutes);
  const hours = Math.floor(absolute / 60)
    .toString()
    .padStart(2, "0");
  const mins = (absolute % 60).toString().padStart(2, "0");
  return `UTC${sign}${hours}:${mins}`;
}
