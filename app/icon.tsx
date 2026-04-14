import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

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
          background: "#f5f5f6",
          borderRadius: 108,
        }}
      >
        <div
          style={{
            width: 392,
            height: 392,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ff1d25",
            color: "#ffffff",
            fontSize: 248,
            fontWeight: 500,
            borderRadius: 9999,
            lineHeight: 1,
            paddingTop: 10,
          }}
        >
          R
        </div>
      </div>
    ),
    size
  );
}
