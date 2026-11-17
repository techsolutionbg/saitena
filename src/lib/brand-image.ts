import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const sources = {
  light: "/brand/saitena-logo-light.svg",
  dark: "/brand/saitena-logo-dark.svg",
  mark: "/brand/saitena-mark.svg",
};

/** Lossless build-time rasterization of fixed approved sources, never user input. */
export async function brandImage(asset: keyof typeof sources) {
  const source = await readFile(join(process.cwd(), "public", sources[asset]));
  const image = sharp(source);
  if (asset === "mark") image.resize(64, 64);
  const png = await image.png().toBuffer();
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
}
