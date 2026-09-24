import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getSmtpTransporter } from "@/lib/smtp";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textToHtml(value: string) {
  return escapeHtml(value).replace(
    /\r?\n/g,
    "<br />"
  );
}

export async function POST(
  request: Request
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "Attachments exceed the 15 MB limit." }, { status: 413 });
    }

    const multipart = request.headers.get("content-type")?.includes("multipart/form-data");
    const body = multipart
      ? await request.formData()
      : (await request.json()) as {
          to?: unknown;
          subject?: unknown;
          message?: unknown;
          threadId?: unknown;
        };
    const getField = (name: "to" | "subject" | "message" | "threadId") =>
      body instanceof FormData ? body.get(name) : body[name];
    const files = body instanceof FormData
      ? body.getAll("attachments").filter((value): value is File => value instanceof File && value.size > 0)
      : [];
    if (files.length > 5 || files.some((file) => file.size > 5 * 1024 * 1024) ||
        files.reduce((sum, file) => sum + file.size, 0) > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "Maximum 5 files, 5 MB each and 15 MB total." }, { status: 413 });
    }
    const outgoingFiles = await Promise.all(files.map(async (file) => ({
      filename: file.name.replaceAll("/", "_").replaceAll(String.fromCharCode(92), "_").replaceAll(String.fromCharCode(10), "_").replaceAll(String.fromCharCode(13), "_").slice(0, 200) || "attachment",
      contentType: file.type || "application/octet-stream",
      content: Buffer.from(await file.arrayBuffer()),
    })));

    const rawTo = getField("to");
    const to = typeof rawTo === "string" ? rawTo.trim().toLowerCase() : "";

    const rawSubject = getField("subject");
    const subject = typeof rawSubject === "string" ? rawSubject.trim() : "";

    const rawMessage = getField("message");
    const message = typeof rawMessage === "string" ? rawMessage.trim() : "";

    const rawThreadId = getField("threadId");
    const requestedThreadId = typeof rawThreadId === "string" ? rawThreadId.trim() : "";

    /*
     * VALIDATION
     */

    if (
      !to ||
      !subject ||
      !message
    ) {
      return NextResponse.json(
        {
          error:
            "To, subject and message are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!emailPattern.test(to)) {
      return NextResponse.json(
        {
          error:
            "Invalid email address.",
        },
        {
          status: 400,
        }
      );
    }

    if (subject.length > 300) {
      return NextResponse.json(
        {
          error:
            "Subject is too long.",
        },
        {
          status: 400,
        }
      );
    }

    if (message.length > 20000) {
      return NextResponse.json(
        {
          error:
            "Message is too long.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * LOAD EXISTING THREAD
     *
     * If threadId exists, this is a reply.
     */

    const existingThread =
      requestedThreadId
        ? await prisma.thread.findUnique({
            where: {
              id: requestedThreadId,
            },
            include: {
              contact: true,
            },
          })
        : null;

    if (
      requestedThreadId &&
      !existingThread
    ) {
      return NextResponse.json(
        {
          error:
            "Conversation not found.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Prevent an existing customer
     * conversation from accidentally
     * being sent to another recipient.
     */

    if (
      existingThread?.contact &&
      existingThread.contact.email?.toLowerCase() !== to
    ) {
      return NextResponse.json(
        {
          error:
            "Recipient does not match this conversation.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * HUB EMAIL SETTINGS
     *
     * These values come from:
     * Settings -> Email
     */

    const settings =
      await prisma.settings.findUnique({
        where: {
          id: "default",
        },
      });

    const senderName =
      settings?.senderName?.trim() ||
      "Staark Inc.";

    const senderEmail =
      settings?.senderEmail
        ?.trim()
        .toLowerCase() ||
      process.env.HUB_FROM_EMAIL ||
      "contact@staarkinc.com";

    const signature =
      settings?.signature?.trim() ||
      "";

    /*
     * Safety check in case an invalid
     * email was somehow stored in DB.
     */

    if (
      !emailPattern.test(senderEmail)
    ) {
      console.error(
        "[SMTP] Invalid Hub sender email:",
        senderEmail
      );

      return NextResponse.json(
        {
          error:
            "Hub sender email is invalid. Check Settings.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * The signature is added only to
     * the actual outgoing email.
     *
     * We keep Message.body in CRM clean,
     * containing only what the user typed.
     */

    const finalText = signature
      ? `${message}\n\n${signature}`
      : message;

    const messageHtml =
      textToHtml(message);

    const signatureHtml =
      signature
        ? textToHtml(signature)
        : "";

    /*
     * SEND EMAIL
     *
     * Hub messages are conversational:
     *
     * From:     contact@
     * Reply-To: contact@
     *
     * Never no-reply here.
     */

    const transporter =
      await getSmtpTransporter();

    let rfcMessageId:
      | string
      | null = null;

    try {
      const info =
        await transporter.sendMail({
          from: {
            name: senderName,
            address: senderEmail,
          },

          replyTo: {
            name: senderName,
            address: senderEmail,
          },

          to,

          subject,

          text: finalText,
          attachments: outgoingFiles,

          html: `
<!doctype html>
<html lang="sv">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />
    <title>${escapeHtml(subject)}</title>
  </head>

  <body
    style="
      margin:0;
      padding:0;
      background:#f5f5f5;
      font-family:Arial,Helvetica,sans-serif;
      color:#202226;
    "
  >
    <table
      width="100%"
      cellpadding="0"
      cellspacing="0"
      border="0"
      role="presentation"
      style="
        width:100%;
        padding:40px 16px;
        background:#f5f5f5;
      "
    >
      <tr>
        <td align="center">

          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            border="0"
            role="presentation"
            style="
              width:100%;
              max-width:600px;
              background:#ffffff;
              border-radius:12px;
              overflow:hidden;
            "
          >

            <!-- HEADER -->

            <tr>
              <td
                style="
                  padding:28px 32px;
                  background:#17181a;
                  color:#ffffff;
                  font-size:20px;
                  font-weight:700;
                "
              >
                ${escapeHtml(senderName)}
              </td>
            </tr>

            <!-- MESSAGE -->

            <tr>
              <td
                style="
                  padding:32px;
                  font-size:15px;
                  line-height:1.7;
                  color:#202226;
                "
              >
                ${messageHtml}

                ${
                  signatureHtml
                    ? `
                      <div
                        style="
                          margin-top:28px;
                          padding-top:22px;
                          border-top:1px solid #eeeeee;
                          color:#55585d;
                        "
                      >
                        ${signatureHtml}
                      </div>
                    `
                    : ""
                }
              </td>
            </tr>

            <!-- FOOTER -->

            <tr>
              <td
                style="
                  padding:20px 32px;
                  border-top:1px solid #eeeeee;
                  color:#92959a;
                  font-size:12px;
                  line-height:1.5;
                "
              >
                Staark Inc. · Sweden
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </body>
</html>
          `,
        });

      rfcMessageId =
        info.messageId || null;

      console.log(
        `[SMTP] Hub email sent successfully: ${rfcMessageId}`
      );
    } finally {
      transporter.close();
    }

    /*
     * SAVE CRM + THREAD
     */

    const result =
      await prisma.$transaction(
        async (tx) => {
          /*
           * FIND / CREATE CONTACT
           */

          let contact =
            existingThread?.contact ??
            (await tx.contact.findUnique({
              where: {
                email: to,
              },
            }));

          if (!contact) {
            contact =
              await tx.contact.create({
                data: {
                  email: to,
                },
              });
          }

          /*
           * REPLY:
           * reuse existing thread.
           *
           * COMPOSE:
           * create new thread.
           */

          const thread =
            existingThread
              ? await tx.thread.update({
                  where: {
                    id:
                      existingThread.id,
                  },
                  data: {
                    contactId:
                      existingThread
                        .contactId ??
                      contact.id,

                    updatedAt:
                      new Date(),
                  },
                })
              : await tx.thread.create({
                  data: {
                    contactId:
                      contact.id,

                    subject,
                  },
                });

          /*
           * SAVE OUTBOUND MESSAGE
           *
           * IMPORTANT:
           *
           * rfcMessageId allows Gmail
           * inbound sync to later match:
           *
           * In-Reply-To:
           * <our-rfc-message-id>
           *
           * with this Hub conversation.
           */

          const savedMessage =
            await tx.message.create({
              data: {
                direction:
                  "OUTBOUND",

                contactId:
                  contact.id,

                threadId:
                  thread.id,

                fromName:
                  senderName,

                fromEmail:
                  senderEmail,

                toEmail:
                  to,

                subject,

                /*
                 * Store only the actual
                 * CRM message here.
                 *
                 * Do not store the automatic
                 * signature in body.
                 */
                body:
                  message,

                isRead:
                  true,

                sentAt:
                  new Date(),

                rfcMessageId,
              },
            });

          for (const file of outgoingFiles) {
            await tx.$executeRaw`
              INSERT INTO "MessageAttachment"
              ("id", "messageId", "filename", "mimeType", "size", "data")
              VALUES (${crypto.randomUUID()}, ${savedMessage.id}, ${file.filename},
                      ${file.contentType}, ${file.content.length}, ${file.content})
            `;
          }

          return {
            thread,
            message:
              savedMessage,
          };
        }
      );

    return NextResponse.json({
      ok: true,

      messageId:
        rfcMessageId,

      threadId:
        result.thread.id,

      savedMessageId:
        result.message.id,
    });
  } catch (error) {
    console.error(
      "Hub send failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Could not send the message.",
      },
      {
        status: 500,
      }
    );
  }
}