import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1714",
          borderRadius: "6px",
          fontFamily: "Georgia, serif",
          fontSize: "20px",
          fontWeight: "bold",
          color: "#d4a24e",
        }}
      >
        5
      </div>
    ),
    { ...size }
  );
}
