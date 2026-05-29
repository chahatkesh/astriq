import { appConfig, getAppEnvironment } from "@/lib/app-config";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    status: "ok",
    service: appConfig.name,
    environment: getAppEnvironment(),
    timestamp: new Date().toISOString(),
  });
}
