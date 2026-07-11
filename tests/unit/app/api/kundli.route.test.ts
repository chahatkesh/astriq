import { describe, expect, it } from "vitest";
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

describe("POST /api/kundli", () => {
  it("returns a generated Kundli", async () => {
    const response = await POST(
      new Request("http://localhost/api/kundli", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.chart.metadata.utcIso).toBe("1990-08-15T09:00:00.000Z");
    expect(body.chart.metadata.calculationProfile.precision).toBe("prototype");
    expect(body.chart.ascendant.sign).toBeTruthy();
    expect(body.chart.houses).toHaveLength(12);
  });

  it("returns validation errors for incomplete birth details", async () => {
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
});
