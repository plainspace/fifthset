import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") || "Find Live Jazz Tonight";
  const subtitle = searchParams.get("subtitle") || "";
  const type = searchParams.get("type") || "default";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px",
          backgroundColor: "#1a1714",
          fontFamily: "Georgia, serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              fontSize: "36px",
              color: "#d4a24e",
              letterSpacing: "-0.02em",
            }}
          >
            Fifth Set
          </span>
          {type === "venue" && (
            <span style={{ fontSize: "24px", color: "#8a7e6d" }}>
              · Venue
            </span>
          )}
          {type === "artist" && (
            <span style={{ fontSize: "24px", color: "#8a7e6d" }}>
              · Artist
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <span
            style={{
              fontSize: title.length > 40 ? "52px" : "64px",
              color: "#f0e6d3",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </span>
          {subtitle && (
            <span
              style={{
                fontSize: "28px",
                color: "#8a7e6d",
              }}
            >
              {subtitle}
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "22px", color: "#8a7e6d" }}>
            fifthset.live
          </span>
          <div
            style={{
              width: "80px",
              height: "4px",
              backgroundColor: "#d4a24e",
              borderRadius: "2px",
            }}
          />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
