import { ImageResponse } from "next/og";

export const alt = "Staark Inc. – Webbdesign, webbutveckling och SEO i Småland";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 80px", background: "#f3f7ff", color: "#14213b", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", background: "#2563eb", color: "white", borderRadius: 18, padding: "14px 22px", fontSize: 38, fontWeight: 700 }}>S</div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>Staark Inc.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 66, lineHeight: 1.12, fontWeight: 700, maxWidth: 1000 }}>Webbplatser som hjälper ditt företag att växa.</div>
          <div style={{ display: "flex", fontSize: 28, color: "#425475" }}>Webbdesign · Webbutveckling · SEO</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#2563eb" }}>
          <div style={{ display: "flex" }}>Jönköping · Värnamo · Småland</div>
          <div style={{ display: "flex" }}>staarkinc.com</div>
        </div>
      </div>
    ),
    size,
  );
}
