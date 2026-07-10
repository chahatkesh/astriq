import type { CSSProperties } from "react";
import type {
  BirthChartResult,
  KundliHouse,
  PlanetPosition,
} from "@/lib/kundli/types";

type KundliChartProps = {
  chart: BirthChartResult;
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

export function KundliChart({ chart }: KundliChartProps) {
  const planetByKey = new Map(
    chart.planets.map((planet) => [planet.key, planet] as const),
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.1fr)]">
      <section className="border border-foreground/15 bg-background">
        <div className="border-b border-foreground/15 px-4 py-3">
          <h2 className="text-base font-semibold">Kundli</h2>
          <p className="mt-1 text-sm text-foreground/60">
            {chart.metadata.placeName} / {chart.metadata.utcIso}
          </p>
        </div>

        <div className="p-4">
          <div
            aria-label="Vedic birth chart with twelve houses"
            className="relative grid aspect-square w-full grid-cols-4 grid-rows-4 border border-foreground/25"
          >
            <div className="col-start-2 col-span-2 row-start-2 row-span-2 flex flex-col items-center justify-center border border-foreground/15 bg-foreground/[0.03] p-3 text-center">
              <span className="text-xs uppercase text-foreground/50">
                Lagna
              </span>
              <span className="mt-1 text-lg font-semibold">
                {chart.ascendant.sign}
              </span>
              <span className="font-mono text-sm text-foreground/65">
                {formatDegrees(chart.ascendant.degreeInSign)}
              </span>
              <span className="mt-2 text-xs text-foreground/55">
                {chart.ascendant.nakshatra.name}{" "}
                {chart.ascendant.nakshatra.pada}
              </span>
            </div>

            {chart.houses.map((house) => (
              <HouseCell
                house={house}
                key={house.number}
                planetByKey={planetByKey}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="border border-foreground/15 bg-background">
        <div className="border-b border-foreground/15 px-4 py-3">
          <h2 className="text-base font-semibold">Planetary Positions</h2>
          <p className="mt-1 text-sm text-foreground/60">
            Lahiri / sidereal / whole sign houses
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-foreground/15 text-left text-xs uppercase text-foreground/50">
                <th className="px-4 py-3 font-medium">Graha</th>
                <th className="px-4 py-3 font-medium">Sign</th>
                <th className="px-4 py-3 font-medium">Degree</th>
                <th className="px-4 py-3 font-medium">House</th>
                <th className="px-4 py-3 font-medium">Nakshatra</th>
                <th className="px-4 py-3 font-medium">Retrograde</th>
              </tr>
            </thead>
            <tbody>
              {chart.planets.map((planet) => (
                <tr className="border-b border-foreground/10" key={planet.key}>
                  <td className="px-4 py-3 font-medium">{planet.name}</td>
                  <td className="px-4 py-3">{planet.sign}</td>
                  <td className="px-4 py-3 font-mono">
                    {formatDegrees(planet.degreeInSign)}
                  </td>
                  <td className="px-4 py-3 font-mono">{planet.house}</td>
                  <td className="px-4 py-3">
                    {planet.nakshatra.name} {planet.nakshatra.pada}
                  </td>
                  <td className="px-4 py-3">
                    {planet.retrograde ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="grid gap-0 border-t border-foreground/15 text-sm sm:grid-cols-2">
          <MetaItem
            label="Ayanamsha"
            value={formatDegrees(chart.metadata.ayanamshaDegrees)}
          />
          <MetaItem
            label="Julian day"
            value={chart.metadata.julianDay.toFixed(5)}
          />
          <MetaItem label="Time zone" value={chart.metadata.timeZone} />
          <MetaItem
            label="UTC offset"
            value={formatOffset(chart.metadata.timezoneOffsetMinutes)}
          />
        </dl>

        {chart.metadata.warnings.length > 0 ? (
          <div className="border-t border-foreground/15 px-4 py-3 text-sm leading-6 text-foreground/65">
            {chart.metadata.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function HouseCell({
  house,
  planetByKey,
}: {
  house: KundliHouse;
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
          <span className="truncate text-xs font-medium">{house.sign}</span>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {house.planets.map((planetKey) => {
          const planet = planetByKey.get(planetKey);
          return (
            <span
              className="border border-foreground/15 px-1.5 py-0.5 font-mono text-[0.68rem] text-foreground/75"
              key={planetKey}
              title={planet?.name}
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

function formatDegrees(value: number) {
  return `${value.toFixed(2)} deg`;
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
