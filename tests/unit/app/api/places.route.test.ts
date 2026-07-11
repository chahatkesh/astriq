import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/places/route";

describe("GET /api/places", () => {
  it("returns ranked candidates for a query", async () => {
    const response = GET(new Request("http://localhost/api/places?q=delhi"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.candidates[0].name).toBe("Delhi");
    expect(body.candidates[0].timeZone).toBe("Asia/Kolkata");
  });

  it("flags ambiguous place names", async () => {
    const response = GET(
      new Request("http://localhost/api/places?q=hyderabad"),
    );
    const body = await response.json();

    expect(body.ambiguous).toBe(true);
    expect(body.candidates.length).toBeGreaterThan(1);
  });

  it("returns an empty result for a missing query", async () => {
    const response = GET(new Request("http://localhost/api/places"));
    const body = await response.json();

    expect(body.candidates).toHaveLength(0);
    expect(body.ambiguous).toBe(false);
  });
});
