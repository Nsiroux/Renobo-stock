import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f6",
          borderRadius: 38,
        }}
      >
        <div
          style={{
            width: 138,
            height: 138,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ff1d25",
            color: "#ffffff",
            fontSize: 88,
            fontWeight: 500,
            borderRadius: 9999,
            lineHeight: 1,
            paddingTop: 4,
            fontFamily: "Arial, sans-serif",
          }}
        >
          R
        </div>
      </div>
    ),
    size
  );
}
