import sharp from "sharp";
export async function prepareNewsImage(input: Buffer) {
  if (!input.length || input.length > 5 * 1024 * 1024)
    throw new Error("Choose an image up to 5 MB.");
  const image = sharp(input, {
    limitInputPixels: 25000000,
    failOn: "warning",
    animated: false,
  });
  const metadata = await image.metadata();
  if (!["jpeg", "png", "webp", "avif", "gif"].includes(metadata.format || ""))
    throw new Error("Use JPEG, PNG, WebP, AVIF or GIF. SVG is not supported.");
  return image
    .rotate()
    .resize({
      width: 1920,
      height: 1920,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
}
