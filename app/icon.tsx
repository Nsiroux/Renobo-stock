import { readFile } from "fs/promises";
import path from "path";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default async function Icon() {
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
