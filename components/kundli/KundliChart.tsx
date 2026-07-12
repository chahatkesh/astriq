import type { CSSProperties } from "react";
import type { AppStringsDictionary } from "@/lib/i18n/app-strings";
import { localizeTerm } from "@/lib/i18n/glossary";
import type { LocaleCode } from "@/lib/i18n/locales";
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

const fallbackCalculationProfile = {
  id: "legacy-unprofiled-result",
  label: "Legacy unprofiled result",
  precision: "prototype",
  ephemeris: "unknown",
  planetPositionSource: "Unprofiled chart response",
  ayanamshaModel: "unknown",
  houseModel: "unknown",
  nodeModel: "unknown",
  expectedTolerance:
    "This chart was generated before calculation profile metadata was available.",
} satisfies BirthChartResult["metadata"]["calculationProfile"];

function localizeSign(sign: string, localeCode: LocaleCode) {
  return localizeTerm(localeCode, sign.toLowerCase());
}

export function KundliChart({ chart, localeCode, messages }: KundliChartProps) {
  const planetByKey = new Map(
    chart.planets.map((planet) => [planet.key, planet] as const),
  );
  const sun = planetByKey.get("sun");
  const moon = planetByKey.get("moon");
  const profile =
    chart.metadata.calculationProfile ?? fallbackCalculationProfile;
  const precisionClassName =
    profile.precision === "reference"
      ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
      : "border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-100";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.1fr)]">
      <section className="border border-foreground/15 bg-background">
        <div className="border-b border-foreground/15 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">
                {messages.chart.kundli}
              </h2>
              <p className="mt-1 text-sm text-foreground/60">
                {chart.metadata.placeName} / {formatLocalTime(chart)}
              </p>
            </div>
            <span
              className={`border px-2 py-1 text-xs font-medium ${precisionClassName}`}
            >
              {profile.precision === "reference"
                ? messages.chart.reference
                : messages.chart.prototype}
            </span>
          </div>
        </div>

        <dl className="grid border-b border-foreground/15 text-sm sm:grid-cols-3">
          <SummaryItem
            detail={`${formatDegrees(
              chart.ascendant.degreeInSign,
              localeCode,
            )} / ${chart.ascendant.nakshatra.name} ${formatNumber(
              chart.ascendant.nakshatra.pada,
              localeCode,
            )}`}
            label={messages.chart.lagna}
            value={localizeSign(chart.ascendant.sign, localeCode)}
          />
          <SummaryItem
            detail={moon ? formatPlanetDetail(moon, localeCode) : "-"}
            label={messages.chart.moon}
            value={moon ? localizeSign(moon.sign, localeCode) : "-"}
          />
          <SummaryItem
            detail={sun ? formatPlanetDetail(sun, localeCode) : "-"}
            label={messages.chart.sun}
            value={sun ? localizeSign(sun.sign, localeCode) : "-"}
          />
        </dl>

        <div className="p-4">
          <div
            aria-label="Vedic birth chart with twelve houses"
            className="relative grid aspect-square w-full grid-cols-4 grid-rows-4 border border-foreground/25"
          >
            <div className="col-start-2 col-span-2 row-start-2 row-span-2 flex flex-col items-center justify-center border border-foreground/15 bg-foreground/[0.03] p-3 text-center">
              <span className="text-xs uppercase text-foreground/50">
                {messages.chart.lagna}
              </span>
              <span className="mt-1 text-lg font-semibold">
                {localizeSign(chart.ascendant.sign, localeCode)}
              </span>
              <span className="font-mono text-sm text-foreground/65">
                {formatDegrees(chart.ascendant.degreeInSign, localeCode)}
              </span>
              <span className="mt-2 text-xs text-foreground/55">
                {chart.ascendant.nakshatra.name}{" "}
                {formatNumber(chart.ascendant.nakshatra.pada, localeCode)}
              </span>
            </div>

            {chart.houses.map((house) => (
              <HouseCell
                house={house}
                key={house.number}
                localeCode={localeCode}
                planetByKey={planetByKey}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6">
        <div className="border border-foreground/15 bg-background">
          <div className="border-b border-foreground/15 px-4 py-3">
            <h2 className="text-base font-semibold">
              {messages.chart.calculationProfile}
            </h2>
            <p className="mt-1 text-sm text-foreground/60">{profile.label}</p>
          </div>

          <dl className="grid text-sm sm:grid-cols-2">
            <MetaItem
              label={messages.metadata.backend}
              value={chart.metadata.engineBackend ?? "prototype"}
            />
            <MetaItem
              label={messages.metadata.precision}
              value={profile.precision}
            />
            <MetaItem
              label={messages.metadata.ephemeris}
              value={profile.ephemeris}
            />
            <MetaItem
              label={messages.metadata.planetSource}
              value={profile.planetPositionSource}
            />
            <MetaItem
              label={messages.metadata.ayanamshaModel}
              value={profile.ayanamshaModel}
            />
            <MetaItem
              label={messages.metadata.houseModel}
              value={profile.houseModel}
            />
            <MetaItem
              label={messages.metadata.nodeModel}
              value={profile.nodeModel}
            />
            <MetaItem
              label={messages.metadata.ayanamsha}
              value={formatDegrees(chart.metadata.ayanamshaDegrees, localeCode)}
            />
            <MetaItem
              label={messages.metadata.julianDay}
              value={formatDecimal(chart.metadata.julianDay, localeCode, 5)}
            />
            <MetaItem
              label={messages.metadata.timeZone}
              value={chart.metadata.timeZone}
            />
            <MetaItem
              label={messages.metadata.utcOffset}
              value={formatOffset(chart.metadata.timezoneOffsetMinutes)}
            />
          </dl>

          <div className="border-t border-foreground/15 px-4 py-3 text-sm leading-6 text-foreground/65">
            <p>{profile.expectedTolerance}</p>
            {chart.metadata.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </div>

        <div className="border border-foreground/15 bg-background">
          <div className="border-b border-foreground/15 px-4 py-3">
            <h2 className="text-base font-semibold">
              {messages.chart.planetaryPositions}
            </h2>
            <p className="mt-1 text-sm text-foreground/60">
              {messages.chart.planetarySubtitle}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-foreground/15 text-left text-xs uppercase text-foreground/50">
                  <th className="px-4 py-3 font-medium">
                    {messages.table.graha}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {messages.table.sign}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {messages.table.degree}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {messages.table.house}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {messages.table.nakshatra}
                  </th>
                  <th className="px-4 py-3 font-medium">
                    {messages.table.retrograde}
                  </th>
                </tr>
              </thead>
              <tbody>
                {chart.planets.map((planet) => (
                  <tr
                    className="border-b border-foreground/10"
                    key={planet.key}
                  >
                    <td className="px-4 py-3 font-medium">
                      {localizeTerm(localeCode, planet.key)}
                    </td>
                    <td className="px-4 py-3">
                      {localizeSign(planet.sign, localeCode)}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {formatDegrees(planet.degreeInSign, localeCode)}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {formatNumber(planet.house, localeCode)}
                    </td>
                    <td className="px-4 py-3">
                      {planet.nakshatra.name}{" "}
                      {formatNumber(planet.nakshatra.pada, localeCode)}
                    </td>
                    <td className="px-4 py-3">
                      {planet.retrograde
                        ? messages.table.yes
                        : messages.table.no}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
    <div className="border-b border-foreground/10 px-4 py-3 sm:border-r sm:last:border-r-0">
      <dt className="text-xs uppercase text-foreground/45">{label}</dt>
      <dd className="mt-1 text-lg font-semibold">{value}</dd>
      <dd className="mt-1 text-xs text-foreground/60">{detail}</dd>
    </div>
  );
}

function HouseCell({
  house,
  localeCode,
  planetByKey,
}: {
  house: KundliHouse;
  localeCode: LocaleCode;
  planetByKey: Map<string, PlanetPosition>;
}) {
  return (
    <div
      className="flex min-h-0 flex-col justify-between border border-foreground/15 p-2"
      style={houseCellStyles[house.number]}
    >
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-mono text-xs text-foreground/45">
            H{house.number}
          </span>
          <span className="truncate text-xs font-medium">
            {localizeSign(house.sign, localeCode)}
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {house.planets.map((planetKey) => {
          const planet = planetByKey.get(planetKey);
          return (
            <span
              className="border border-foreground/15 px-1.5 py-0.5 font-mono text-[0.68rem] text-foreground/75"
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

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-foreground/10 px-4 py-3 sm:border-r">
      <dt className="text-xs uppercase text-foreground/45">{label}</dt>
      <dd className="mt-1 font-mono text-sm">{value}</dd>
    </div>
  );
}

function formatDegrees(value: number, localeCode: LocaleCode) {
  const totalMinutes = Math.round(value * 60);
  const degrees = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const degreeText = formatNumber(degrees, localeCode).padStart(2, "0");
  const minuteText = formatNumber(minutes, localeCode).padStart(2, "0");
  return `${degreeText}deg ${minuteText}'`;
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

function formatPlanetDetail(planet: PlanetPosition, localeCode: LocaleCode) {
  return `${formatDegrees(planet.degreeInSign, localeCode)} / ${
    planet.nakshatra.name
  } ${formatNumber(planet.nakshatra.pada, localeCode)}`;
}

function formatDecimal(
  value: number,
  localeCode: LocaleCode,
  fractionDigits: number,
) {
  return new Intl.NumberFormat(localeCode, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
    useGrouping: false,
  }).format(value);
}

function formatNumber(value: number, localeCode: LocaleCode) {
  return new Intl.NumberFormat(localeCode, {
    maximumFractionDigits: 0,
    useGrouping: false,
  }).format(value);
}

function formatLocalTime(chart: BirthChartResult) {
  return `${chart.metadata.localDateTime} ${formatOffset(
    chart.metadata.timezoneOffsetMinutes,
  )}`;
}
