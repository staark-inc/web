import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { prepareNewsImage } from "../lib/news-images.ts";
test("news assets are decoded, resized and re-encoded as WebP", async () => {
  const source = await sharp({
    create: { width: 2400, height: 1000, channels: 3, background: "red" },
  })
    .withMetadata({ exif: { IFD0: { Artist: "Private author" } } })
    .png()
    .toBuffer();
  const result = await prepareNewsImage(source);
  assert.equal(result.info.format, "webp");
  assert.equal((await sharp(result.data).metadata()).exif, undefined);
  assert.equal(result.info.width, 1920);
  assert.ok(result.info.height < 1000);
});
test("SVG and malformed images cannot become public news assets", async () => {
  await assert.rejects(
    () =>
      prepareNewsImage(
        Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"></svg>',
        ),
      ),
    /SVG/,
  );
  await assert.rejects(() => prepareNewsImage(Buffer.from("not an image")));
  await assert.rejects(
    () => prepareNewsImage(Buffer.alloc(5 * 1024 * 1024 + 1)),
    /5 MB/,
  );
});

test("decoded image pixel limits reject decompression bombs", async () => {
  const source = await sharp({
    create: { width: 6000, height: 5000, channels: 3, background: "red" },
  })
    .png()
    .toBuffer();
  await assert.rejects(() => prepareNewsImage(source), /pixel limit/i);
});
