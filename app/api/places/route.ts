import { searchPlaces } from "@/services/location-service";

export const runtime = "nodejs";

export function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  const result = searchPlaces(query);

  return Response.json(result, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
