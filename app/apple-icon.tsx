import { readFile } from "fs/promises";
import path from "path";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default async function AppleIcon() {
  const buffer = await readFile(
    path.join(process.cwd(), "public", "renobo logo bol.png")
  );

  return new Response(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
