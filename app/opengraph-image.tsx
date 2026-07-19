import { ImageResponse } from "next/og";
import { appConfig } from "@/lib/app-config";

export const alt = `${appConfig.name} — Vedic birth chart generator`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const starPositions = [
  { top: "12%", left: "15%", size: 4 },
  { top: "18%", left: "74%", size: 3 },
  { top: "28%", left: "58%", size: 4 },
  { top: "36%", left: "10%", size: 3 },
  { top: "48%", left: "86%", size: 3 },
  { top: "62%", left: "20%", size: 4 },
  { top: "74%", left: "67%", size: 3 },
  { top: "82%", left: "38%", size: 4 },
];

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        background:
          "radial-gradient(circle at 52% 18%, #3a2468 0%, #1b1234 46%, #0a0816 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        padding: "56px 70px",
        color: "#f6efe0",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 58% 46% at 50% 95%, rgba(217,164,65,0.14), transparent 72%)",
        }}
      />

      {starPositions.map((star, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            borderRadius: 99,
            backgroundColor: "rgba(253,246,227,0.9)",
            boxShadow: "0 0 8px rgba(253,246,227,0.5)",
          }}
        />
      ))}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: "24px",
          marginTop: 86,
          width: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            color: "#e8c375",
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: 64,
              height: 2,
              backgroundColor: "rgba(232,195,117,0.65)",
            }}
          />
          <span>Vedic Birth Chart</span>
          <span
            style={{
              width: 64,
              height: 2,
              backgroundColor: "rgba(232,195,117,0.65)",
            }}
          />
        </div>

        <div
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 108,
            fontWeight: 600,
            lineHeight: 0.98,
            letterSpacing: "-0.02em",
            color: "#f6efe0",
            textAlign: "center",
            maxWidth: 980,
          }}
        >
          {appConfig.name}
        </div>

        <div
          style={{
            fontSize: 30,
            color: "#ddd0b0",
            letterSpacing: "0.06em",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          Generate precise Vedic birth charts with a minimal astrology
          workspace.
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
