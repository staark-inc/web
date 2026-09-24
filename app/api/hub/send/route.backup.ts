import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getSmtpTransporter } from "@/lib/smtp";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}`
    );
  }

  return value;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
    const body = (await request.json()) as {
      to?: unknown;
      subject?: unknown;
      message?: unknown;
      threadId?: unknown;
    };

    const to =
      typeof body.to === "string"
        ? body.to
            .trim()
            .toLowerCase()
        : "";

    const subject =
      typeof body.subject === "string"
        ? body.subject.trim()
        : "";

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    const requestedThreadId =
      typeof body.threadId === "string"
        ? body.threadId.trim()
        : "";

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
     * If this is a reply, load the
     * existing thread first.
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
     * A thread connected to a contact
     * should not suddenly send to a
     * different email address.
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

    const fromEmail =
      requiredEnv(
        "CONTACT_FROM_EMAIL"
      );

    /*
     * SEND EMAIL
     */

    const transporter =
      await getSmtpTransporter();

    let messageId = "";

    try {
      const info =
        await transporter.sendMail({
          from: `"Staark Inc." <${fromEmail}>`,

          to,

          subject,

          replyTo: fromEmail,

          text: message,

          html: `
<!doctype html>
<html>
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
      role="presentation"
      style="
        width:100%;
        padding:40px 16px;
      "
    >
      <tr>
        <td align="center">

          <table
            width="600"
            cellpadding="0"
            cellspacing="0"
            role="presentation"
            style="
              max-width:600px;
              width:100%;
              background:#ffffff;
              border-radius:12px;
              overflow:hidden;
            "
          >

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
                Staark Inc.
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:32px;
                  font-size:15px;
                  line-height:1.7;
                "
              >
                ${escapeHtml(
                  message
                ).replace(
                  /\r?\n/g,
                  "<br>"
                )}
              </td>
            </tr>

            <tr>
              <td
                style="
                  padding:20px 32px;
                  border-top:1px solid #eeeeee;
                  color:#92959a;
                  font-size:12px;
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

      messageId =
        info.messageId ?? "";

      console.log(
        `[SMTP] Hub email sent successfully: ${messageId}`
      );
    } finally {
      transporter.close();
    }

    /*
     * SAVE CRM / THREAD DATA
     */

    const result =
      await prisma.$transaction(
        async (tx) => {
          /*
           * Find or create contact.
           *
           * Compose to a new email address
           * automatically creates a contact.
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
           * Reply:
           * reuse existing thread.
           *
           * Compose:
           * create a new thread.
           */

          let thread;

          if (existingThread) {
            thread =
              await tx.thread.update({
                where: {
                  id: existingThread.id,
                },

                data: {
                  contactId:
                    existingThread.contactId ??
                    contact.id,

                  /*
                   * Touch updatedAt so this
                   * conversation moves to
                   * the top of Inbox/Sent.
                   */
                  updatedAt:
                    new Date(),
                },
              });
          } else {
            thread =
              await tx.thread.create({
                data: {
                  contactId:
                    contact.id,

                  subject,
                },
              });
          }

          /*
           * Save outbound message inside
           * the conversation.
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
                  "Staark Inc.",

                fromEmail,

                toEmail:
                  to,

                subject,

                body:
                  message,

                isRead:
                  true,

                sentAt:
                  new Date(),
              },
            });

          return {
            contact,
            thread,
            message:
              savedMessage,
          };
        }
      );

    return NextResponse.json({
      ok: true,

      messageId,

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