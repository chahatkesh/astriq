import { logger } from "@/lib/logger";
import {
  BirthChartValidationError,
  EngineExecutionError,
  generateBirthChart,
} from "@/services/birth-chart-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
    const chart = await generateBirthChart(payload);
    return Response.json({ chart });
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
