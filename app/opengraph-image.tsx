import { ImageResponse } from "next/og";
import { appConfig } from "@/lib/app-config";

export const alt = `${appConfig.name} — Vedic birth chart generator`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(255,253,248,0.95) 0%, #f4f0e8 48%, rgba(224,232,224,0.85) 100%)",
        backgroundImage:
          "linear-gradient(rgba(37,34,31,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,34,31,0.04) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        color: "#25221f",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          maxWidth: "760px",
        }}
      >
        <div
          style={{
            color: "#c84f38",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Vedic birth chart
        </div>
        <div
          style={{
            fontFamily: 'Georgia, "Iowan Old Style", Baskerville, serif',
            fontSize: 96,
            fontWeight: 600,
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
          }}
        >
          {appConfig.name}
        </div>
        <div
          style={{
            fontSize: 34,
            lineHeight: 1.35,
            color: "#6f6961",
            maxWidth: "680px",
          }}
        >
          Generate and save precise kundli charts with Lahiri sidereal
          calculations.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <div
          style={{
            height: 4,
            width: 120,
            background: "#c84f38",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            fontSize: 22,
            color: "#928b81",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Lahiri / sidereal / whole sign
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
