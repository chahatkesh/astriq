import { logger } from "@/lib/logger";
import {
  BirthChartValidationError,
  EngineExecutionError,
  generateBirthChart,
} from "@/services/birth-chart-service";

import {
  ChartQuotaError,
  ensureUserCanGenerateChart,
  getSessionUserIdFromRequest,
  getUserById,
  getUserChartQuota,
  saveGeneratedChartForUser,
} from "@/services";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const userId = await getSessionUserIdFromRequest(request);
  if (!userId) {
    return Response.json(
      {
        error: {
          message: "Sign in to generate your kundli.",
          requiresLogin: true,
        },
      },
      { status: 401 },
    );
  }

  const user = await getUserById(userId);
  if (!user) {
    return Response.json(
      {
        error: {
          message: "Sign in to generate your kundli.",
          requiresLogin: true,
        },
      },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      {
        error: {
          message: "Send birth details as JSON.",
          fields: { form: "The request body must be valid JSON." },
        },
      },
      { status: 400 },
    );
  }

  try {
    await ensureUserCanGenerateChart(user.id);
    const chart = await generateBirthChart(payload);
    const savedChart = await saveGeneratedChartForUser(user.id, chart);
    const quota = await getUserChartQuota(user.id);

    return Response.json({ chart, savedChart, quota });
  } catch (error) {
    if (error instanceof BirthChartValidationError) {
      return Response.json(
        {
          error: {
            message: error.message,
            fields: error.fields,
          },
        },
        { status: 400 },
      );
    }

    if (error instanceof ChartQuotaError) {
      return Response.json(
        {
          error: {
            message: error.message,
            quota: error.quota,
          },
        },
        { status: 403 },
      );
    }

    if (error instanceof EngineExecutionError) {
      logger.error(
        {
          route: "/api/kundli",
          errorName: error.name,
        },
        "Kundli engine failed",
      );

      return Response.json(
        {
          error: {
            message:
              "The chart engine could not complete this calculation. Try again or verify the birth details.",
          },
        },
        { status: 502 },
      );
    }

    logger.error(
      {
        route: "/api/kundli",
        errorName: error instanceof Error ? error.name : "UnknownError",
      },
      "Unexpected Kundli API failure",
    );

    return Response.json(
      {
        error: {
          message: "Something went wrong while generating the chart.",
        },
      },
      { status: 500 },
    );
  }
}
