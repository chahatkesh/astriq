import { db } from "@/lib/db";
import { getMaxChartsPerUser } from "@/lib/env";
import type {
  BirthChartResult,
  ChartQuota,
  UserChartSummary,
} from "@/lib/kundli/types";

const birthChartSummarySelect = {
  id: true,
  createdAt: true,
  subjectName: true,
  birthPlace: true,
  localDateTime: true,
  chartJson: true,
} as const;

type BirthChartSummaryRow = {
  id: string;
  createdAt: Date;
  subjectName: string | null;
  birthPlace: string | null;
  localDateTime: string | null;
  chartJson: unknown;
};

function mapBirthChartRow(row: BirthChartSummaryRow): UserChartSummary {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    subjectName: row.subjectName ?? undefined,
    placeName: row.birthPlace ?? "Unknown place",
    localDateTime: row.localDateTime ?? "",
    chart: row.chartJson as BirthChartResult,
  };
}

export class ChartQuotaError extends Error {
  readonly quota: ChartQuota;

  constructor(quota: ChartQuota) {
    super("You have reached your chart generation limit.");
    this.name = "ChartQuotaError";
    this.quota = quota;
  }
}

export async function getUserChartQuota(userId: string): Promise<ChartQuota> {
  const limit = getMaxChartsPerUser();
  const used = await db.birthChart.count({
    where: {
      userId,
    },
  });

  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
  };
}

export async function ensureUserCanGenerateChart(userId: string) {
  const quota = await getUserChartQuota(userId);
  if (quota.used >= quota.limit) {
    throw new ChartQuotaError(quota);
  }

  return quota;
}

export async function saveGeneratedChartForUser(
  userId: string,
  chart: BirthChartResult,
) {
  const created = await db.birthChart.create({
    data: {
      userId,
      subjectName: chart.subjectName ?? null,
      birthDateTime: new Date(chart.metadata.utcIso),
      birthPlace: chart.metadata.placeName,
      latitude: chart.metadata.latitude,
      longitude: chart.metadata.longitude,
      timezone: chart.metadata.timeZone,
      timezoneOffsetMinutes: chart.metadata.timezoneOffsetMinutes,
      engineBackend: chart.metadata.engineBackend,
      engineVersion: chart.metadata.engineVersion,
      localDateTime: chart.metadata.localDateTime,
      chartJson: chart,
    },
    select: birthChartSummarySelect,
  });

  return mapBirthChartRow(created);
}

export async function getUserChartHistory(userId: string, take = 20) {
  const rows = await db.birthChart.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take,
    select: birthChartSummarySelect,
  });

  return rows.map(mapBirthChartRow) satisfies UserChartSummary[];
}

export async function getUserChartById(userId: string, chartId: string) {
  const row = await db.birthChart.findFirst({
    where: {
      id: chartId,
      userId,
    },
    select: birthChartSummarySelect,
  });

  if (!row) {
    return null;
  }

  return mapBirthChartRow(row);
}
