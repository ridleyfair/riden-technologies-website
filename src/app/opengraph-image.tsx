import { ImageResponse } from "next/og";

export const alt = "Riden Technologies — Web Design Agency London";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0f1e 0%, #0d1530 50%, #0a1628 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "64px 72px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Grid pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(59,130,246,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        {/* Glow */}
        <div style={{
          position: "absolute", top: -100, left: -100,
          width: 600, height: 600,
          background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          borderRadius: "50%",
        }} />

        {/* Logo text */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52,
            background: "linear-gradient(135deg, #3b82f6, #7c3aed)",
            borderRadius: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 900, color: "white",
          }}>
            R
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "white", letterSpacing: -0.5 }}>
            Riden Technologies
          </div>
        </div>

        {/* Headline */}
        <div style={{
          fontSize: 58, fontWeight: 800, color: "white",
          lineHeight: 1.1, letterSpacing: -2, maxWidth: 780, marginBottom: 24,
        }}>
          Professional websites for{" "}
          <span style={{ background: "linear-gradient(90deg, #3b82f6, #7c3aed)", WebkitBackgroundClip: "text", color: "transparent" }}>
            small businesses
          </span>
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: 24, color: "#94a3b8", maxWidth: 640, lineHeight: 1.5, marginBottom: 40 }}>
          Live in 2–5 business days. From £299. Based in London, serving the whole UK.
        </div>

        {/* Pills */}
        <div style={{ display: "flex", gap: 14 }}>
          {["From £299", "2–5 Day Build", "14-Day Guarantee", "UK Based"].map((t) => (
            <div key={t} style={{
              padding: "10px 20px",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 50,
              fontSize: 16, color: "#cbd5e1", fontWeight: 500,
            }}>
              {t}
            </div>
          ))}
        </div>

        {/* URL */}
        <div style={{
          position: "absolute", bottom: 48, right: 72,
          fontSize: 18, color: "#475569", fontWeight: 500,
        }}>
          ridentechnologies.com
        </div>
      </div>
    ),
    { ...size }
  );
}
