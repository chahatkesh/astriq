import { describe, expect, it } from "vitest";
import { buildChartPdfFilename } from "@/lib/kundli/chart-pdf";
import {
  decodeDraftContext,
  encodeDraftContext,
} from "@/lib/kundli/draft-context";

describe("birth chart document", () => {
  it("preserves the chart name through the login draft", () => {
    const token = encodeDraftContext({
      subjectName: "Ada's birth chart",
      birthDate: "1815-12-10",
    });

    expect(decodeDraftContext(token)).toEqual({
      subjectName: "Ada's birth chart",
      birthDate: "1815-12-10",
    });
  });

  it("uses a filesystem-safe PDF filename", () => {
    expect(buildChartPdfFilename("  Élodie's / Birth Chart  ")).toBe(
      "elodie-s-birth-chart.pdf",
    );
    expect(buildChartPdfFilename()).toBe("birth-chart.pdf");
  });
});
