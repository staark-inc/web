export type RequestBodyErrorCode =
  | "invalid"
  | "too_large"
  | "unsupported";

export class RequestBodyError extends Error {
  public readonly code: RequestBodyErrorCode;
  public readonly status: 400 | 413 | 415;

  constructor(
    code: RequestBodyErrorCode,
    status: 400 | 413 | 415
  ) {
    super(code);
    this.name = "RequestBodyError";
    this.code = code;
    this.status = status;
  }
}

const ALLOWED_MEDIA_TYPES = new Set([
  "application/json",
  "application/x-www-form-urlencoded",
  "multipart/form-data",
]);

/**
 * Read a request body with a hard byte ceiling.
 *
 * Content-Length is only a fast path. The stream itself is counted so a
 * dishonest or missing length header cannot bypass the limit.
 */
export async function readBoundedBody(
  request: Request,
  maxBytes: number
): Promise<Record<string, unknown>> {
  const contentType =
    request.headers.get("content-type") ?? "";
  const mediaType = contentType
    .split(";")[0]
    .trim()
    .toLowerCase();

  if (!ALLOWED_MEDIA_TYPES.has(mediaType)) {
    throw new RequestBodyError("unsupported", 415);
  }

  const declared = Number(
    request.headers.get("content-length")
  );

  if (
    Number.isFinite(declared) &&
    declared > maxBytes
  ) {
    throw new RequestBodyError("too_large", 413);
  }

  if (!request.body) {
    throw new RequestBodyError("invalid", 400);
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    size += value.byteLength;

    if (size > maxBytes) {
      await reader
        .cancel()
        .catch(() => undefined);
      throw new RequestBodyError("too_large", 413);
    }

    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    if (mediaType === "application/json") {
      const body: unknown = JSON.parse(
        new TextDecoder().decode(bytes)
      );

      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body)
      ) {
        throw new Error("Invalid object");
      }

      return body as Record<string, unknown>;
    }

    const form = await new Response(bytes, {
      headers: {
        "Content-Type": contentType,
      },
    }).formData();

    const fields: Record<string, unknown> = {};

    for (const [key, value] of form) {
      if (typeof value !== "string") {
        throw new Error("Files are not supported");
      }

      if (Object.hasOwn(fields, key)) {
        throw new Error("Duplicate form field");
      }

      Object.defineProperty(fields, key, {
        value,
        enumerable: true,
      });
    }

    return fields;
  } catch {
    throw new RequestBodyError("invalid", 400);
  }
}
