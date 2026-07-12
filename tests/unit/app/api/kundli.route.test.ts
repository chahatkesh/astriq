import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class MockBirthChartValidationError extends Error {
    readonly fields: Record<string, string>;

    constructor(fields: Record<string, string>) {
      super("Check the highlighted birth details.");
      this.name = "BirthChartValidationError";
      this.fields = fields;
    }
  }

  class MockEngineExecutionError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "EngineExecutionError";
    }
  }

  class MockChartQuotaError extends Error {
    readonly quota: { limit: number; used: number; remaining: number };

    constructor(quota: { limit: number; used: number; remaining: number }) {
      super("You have reached your chart generation limit.");
      this.name = "ChartQuotaError";
      this.quota = quota;
    }
  }

  return {
    generateBirthChart: vi.fn(),
    ensureUserCanGenerateChart: vi.fn(),
    getSessionUserIdFromRequest: vi.fn(),
    getUserById: vi.fn(),
    getUserChartQuota: vi.fn(),
    saveGeneratedChartForUser: vi.fn(),
    MockBirthChartValidationError,
    MockEngineExecutionError,
    MockChartQuotaError,
  };
});

vi.mock("@/services/birth-chart-service", () => ({
  BirthChartValidationError: mocks.MockBirthChartValidationError,
  EngineExecutionError: mocks.MockEngineExecutionError,
  generateBirthChart: mocks.generateBirthChart,
}));

vi.mock("@/services", () => ({
  ChartQuotaError: mocks.MockChartQuotaError,
  ensureUserCanGenerateChart: mocks.ensureUserCanGenerateChart,
  getSessionUserIdFromRequest: mocks.getSessionUserIdFromRequest,
  getUserById: mocks.getUserById,
  getUserChartQuota: mocks.getUserChartQuota,
  saveGeneratedChartForUser: mocks.saveGeneratedChartForUser,
}));

import { POST } from "@/app/api/kundli/route";

const payload = {
  subjectName: "Ada",
  birthDate: "1990-08-15",
  birthTime: "14:30",
  placeName: "Delhi, India",
  latitude: 28.6139,
  longitude: 77.209,
  timeZone: "Asia/Kolkata",
};

const chartFixture = {
  subjectName: "Ada",
  metadata: {
    utcIso: "1990-08-15T09:00:00.000Z",
    engineBackend: "jpl_spice",
    calculationProfile: {
      precision: "reference",
    },
  },
  ascendant: {
    sign: "Leo",
  },
  houses: Array.from({ length: 12 }, () => ({})),
};

describe("POST /api/kundli", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getSessionUserIdFromRequest.mockResolvedValue("user-1");
    mocks.getUserById.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      displayName: "Ada",
    });
    mocks.ensureUserCanGenerateChart.mockResolvedValue({
      limit: 3,
      used: 0,
      remaining: 3,
    });
    mocks.generateBirthChart.mockResolvedValue(chartFixture);
    mocks.saveGeneratedChartForUser.mockResolvedValue({
      id: "chart-1",
      createdAt: "2026-07-12T00:00:00.000Z",
      placeName: "Delhi, India",
      localDateTime: "1990-08-15T14:30:00",
      chart: chartFixture,
    });
    mocks.getUserChartQuota.mockResolvedValue({
      limit: 3,
      used: 1,
      remaining: 2,
    });
  });

  it("returns 401 for unauthenticated requests", async () => {
    mocks.getSessionUserIdFromRequest.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/kundli", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.requiresLogin).toBe(true);
  });

  it("returns a generated and saved kundli with quota", async () => {
    const response = await POST(
      new Request("http://localhost/api/kundli", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.chart.metadata.utcIso).toBe("1990-08-15T09:00:00.000Z");
    expect(body.chart.metadata.engineBackend).toBe("jpl_spice");
    expect(body.chart.metadata.calculationProfile.precision).toBe("reference");
    expect(body.savedChart.id).toBe("chart-1");
    expect(body.quota.remaining).toBe(2);
  });

  it("returns validation errors for incomplete birth details", async () => {
    mocks.generateBirthChart.mockRejectedValue(
      new mocks.MockBirthChartValidationError({
        birthTime: "Time of birth is required.",
      }),
    );

    const response = await POST(
      new Request("http://localhost/api/kundli", {
        method: "POST",
        body: JSON.stringify({ ...payload, birthTime: "" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.fields.birthTime).toMatch(/required/);
  });

  it("returns quota errors when user exceeds limit", async () => {
    mocks.ensureUserCanGenerateChart.mockRejectedValue(
      new mocks.MockChartQuotaError({ limit: 3, used: 3, remaining: 0 }),
    );

    const response = await POST(
      new Request("http://localhost/api/kundli", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.quota.remaining).toBe(0);
  });
});
