import { NewsInputError } from "./news-policy.ts";

export function newsPublicOrigin(request: Request): string {
  const configured = process.env.APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return new URL(configured).origin;
  return process.env.NODE_ENV === "production"
    ? "https://staarkinc.com"
    : new URL(request.url).origin;
}
export function newsSameOrigin(request: Request): boolean {
  try {
    return (
      new URL(request.headers.get("origin") || "").origin ===
      newsPublicOrigin(request)
    );
  } catch {
    return false;
  }
}
/** Bound the actual streamed bytes, not only the caller's Content-Length. */
export async function readNewsBody(
  request: Request,
  maxBytes: number,
): Promise<Uint8Array> {
  if (!request.body) throw new NewsInputError("Missing request body.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new NewsInputError("Request is too large.");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }
  return body;
}
