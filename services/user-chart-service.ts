import { db } from "@/lib/db";
import { getMaxChartsPerUser } from "@/lib/env";
import type {
  BirthChartResult,
  ChartQuota,
  UserChartSummary,
} from "@/lib/kundli/types";

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
    select: {
      id: true,
      createdAt: true,
      subjectName: true,
      birthPlace: true,
      localDateTime: true,
      chartJson: true,
    },
  });

  return {
    id: created.id,
    createdAt: created.createdAt.toISOString(),
    subjectName: created.subjectName ?? undefined,
    placeName: created.birthPlace ?? "Unknown place",
    localDateTime: created.localDateTime ?? "",
    chart: created.chartJson as BirthChartResult,
  } satisfies UserChartSummary;
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
    select: {
      id: true,
      createdAt: true,
      subjectName: true,
      birthPlace: true,
      localDateTime: true,
      chartJson: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    subjectName: row.subjectName ?? undefined,
    placeName: row.birthPlace ?? "Unknown place",
    localDateTime: row.localDateTime ?? "",
    chart: row.chartJson as BirthChartResult,
  })) satisfies UserChartSummary[];
}
