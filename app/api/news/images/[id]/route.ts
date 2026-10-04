import { prisma } from "@/lib/prisma";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[a-z0-9]{20,40}$/.test(id))
    return new Response("Not found", { status: 404 });
  const asset = await prisma.saasAnnouncementAsset.findUnique({
    where: { id },
    select: { data: true },
  });
  if (!asset) return new Response("Not found", { status: 404 });
  const headers = {
    "Content-Type": "image/webp",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    ETag: `"${id}"`,
  };
  if (request.headers.get("if-none-match") === headers.ETag)
    return new Response(null, { status: 304, headers });
  return new Response(Buffer.from(asset.data), { headers });
}
