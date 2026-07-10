import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

describe("GET /api/health", () => {
  it("returns the production runtime contract shape", async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      status: "ok",
      service: "Birth Chart Generator",
      environment: "test",
    });
    expect(new Date(body.timestamp).toString()).not.toBe("Invalid Date");
  });
});
