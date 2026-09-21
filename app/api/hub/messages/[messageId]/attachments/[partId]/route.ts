import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGmailMessageParts } from "@/lib/gmail-attachments";

export const runtime = "nodejs";

function serveFile(request: Request, filename: string, mimeType: string, data: Buffer) {
  const safeName = encodeURIComponent(filename.replace(/[\r\n"\\]/g, "_"));
  const preview = new URL(request.url).searchParams.get("preview") === "1";
  const previewable = /^(image\/(png|jpeg|webp|gif)|application\/pdf)$/.test(mimeType);
  const inline = preview && previewable;

  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": inline ? mimeType : "application/octet-stream",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="attachment"; filename*=UTF-8''${safeName}`,
      "Content-Length": String(data.length),
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox",
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ messageId: string; partId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messageId, partId } = await params;
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { gmailMessageId: true, direction: true },
  });
  if (!message) return new Response("Attachment not found", { status: 404 });

  try {
    const rows = await prisma.$queryRaw<Array<{
      filename: string;
      mimeType: string;
      data: Uint8Array;
    }>>`
      SELECT "filename", "mimeType", "data" FROM "MessageAttachment"
      WHERE "id" = ${partId} AND "messageId" = ${messageId}
    `;
    if (rows.length) {
      return serveFile(request, rows[0].filename, rows[0].mimeType, Buffer.from(rows[0].data));
    }

    if (!message.gmailMessageId) {
      return new Response("Attachment not found", { status: 404 });
    }

    const { gmail, parts } = await getGmailMessageParts(message.gmailMessageId);
    const part = parts.find((item) => item.partId === partId && item.filename);
    if (!part) return new Response("Attachment not found", { status: 404 });

    const attachmentId = part.body?.attachmentId;
    const encoded = attachmentId
      ? (await gmail.users.messages.attachments.get({
          userId: "me",
          messageId: message.gmailMessageId,
          id: attachmentId,
        })).data.data
      : part.body?.data;

    if (!encoded) return new Response("Attachment not found", { status: 404 });
    const data = Buffer.from(encoded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    return serveFile(request, part.filename!, part.mimeType || "application/octet-stream", data);
  } catch (error) {
    console.error("[HUB] Attachment download failed:", error);
    return new Response("Attachment unavailable", { status: 502 });
  }
}