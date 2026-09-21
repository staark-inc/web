import type { gmail_v1 } from "googleapis";
import { getGmailClient } from "@/lib/gmail";

export type GmailAttachment = {
  partId: string;
  filename: string;
  size: number;
  mimeType: string;
};

function walkParts(part: gmail_v1.Schema$MessagePart | undefined | null): gmail_v1.Schema$MessagePart[] {
  if (!part) return [];
  return [part, ...(part.parts ?? []).flatMap(walkParts)];
}

export async function getGmailMessageParts(gmailMessageId: string) {
  const { gmail } = await getGmailClient();
  const response = await gmail.users.messages.get({
    userId: "me",
    id: gmailMessageId,
    format: "full",
  });
  return { gmail, parts: walkParts(response.data.payload) };
}

export async function listGmailAttachments(gmailMessageId: string): Promise<GmailAttachment[]> {
  const { parts } = await getGmailMessageParts(gmailMessageId);
  return parts
    .filter((part) => part.partId && part.filename && (part.body?.attachmentId || part.body?.data))
    .map((part) => ({
      partId: part.partId!,
      filename: part.filename!,
      size: part.body?.size ?? 0,
      mimeType: part.mimeType || "application/octet-stream",
    }))
    .sort((a, b) => a.filename.localeCompare(b.filename));
}