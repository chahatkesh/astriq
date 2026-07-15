import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    birthChart: {
      findFirst: mocks.findFirst,
    },
  },
}));

vi.mock("@/lib/env", () => ({
  getMaxChartsPerUser: () => 10,
}));

import { getUserChartById } from "@/services/user-chart-service";

const chartJson = {
  subjectName: "Ada",
  metadata: {
    utcIso: "1990-08-15T09:00:00.000Z",
    placeName: "Delhi, India",
    localDateTime: "1990-08-15T14:30",
    engineBackend: "jpl_spice",
  },
  ascendant: { sign: "aries", degreeInSign: 12 },
  houses: [],
  planets: [],
};

describe("getUserChartById", () => {
  beforeEach(() => {
    mocks.findFirst.mockReset();
  });

  it("returns the chart summary when the chart belongs to the user", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "chart-1",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      subjectName: "Ada",
      birthPlace: "Delhi, India",
      localDateTime: "1990-08-15T14:30",
      chartJson,
    });

    const summary = await getUserChartById("user-1", "chart-1");

    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: {
        id: "chart-1",
        userId: "user-1",
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
    expect(summary).toEqual({
      id: "chart-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      subjectName: "Ada",
      placeName: "Delhi, India",
      localDateTime: "1990-08-15T14:30",
      chart: chartJson,
    });
  });

  it("returns null when the chart is missing or owned by another user", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const summary = await getUserChartById("user-1", "foreign-chart");

    expect(summary).toBeNull();
  });
});
