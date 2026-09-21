import { Download, Paperclip } from "lucide-react";

import { listGmailAttachments } from "@/lib/gmail-attachments";

type GmailAttachmentsProps = {
  messageId: string;
  gmailMessageId: string;
};

/*
 * Streamed separately from the thread: each Gmail lookup is a
 * network round trip, so the conversation renders first and the
 * attachments fill in when they arrive.
 */
export default async function GmailAttachments({
  messageId,
  gmailMessageId,
}: GmailAttachmentsProps) {
  let attachments;

  try {
    attachments = await listGmailAttachments(gmailMessageId);
  } catch (error) {
    console.error("[GMAIL] Could not load attachments:", error);
    return null;
  }

  if (!attachments.length) {
    return null;
  }

  return (
    <div className="hub-thread-attachments">
      <span className="hub-thread-attachments-title">
        <Paperclip size={15} /> Attachments
      </span>

      {attachments.map((attachment) => {
        const href = `/api/hub/messages/${messageId}/attachments/${encodeURIComponent(attachment.partId)}`;
        const previewable =
          attachment.mimeType === "application/pdf" ||
          /^image\/(png|jpeg|webp|gif)$/.test(attachment.mimeType);

        return (
          <div key={attachment.partId} className="hub-thread-attachment-row">
            <a href={href} className="hub-thread-attachment">
              <span>
                <strong>{attachment.filename}</strong>
                <small>{Math.ceil(attachment.size / 1024)} KB</small>
              </span>

              <Download size={16} aria-hidden="true" />
            </a>

            {previewable && (
              <a
                className="hub-thread-attachment-preview"
                href={`${href}?preview=1`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Preview
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
