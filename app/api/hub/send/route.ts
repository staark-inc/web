import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { getSmtpTransporter } from "@/lib/smtp";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const to = String(body.to ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!to || !subject || !message) {
      return NextResponse.json(
        {
          error: "To, subject and message are required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json(
        {
          error: "Invalid email address.",
        },
        {
          status: 400,
        }
      );
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    if (!smtpUser || !smtpPassword) {
      throw new Error("SMTP is not configured");
    }

    const fromEmail =
      process.env.CONTACT_FROM_EMAIL ?? smtpUser;

    const transporter = await getSmtpTransporter();

    const info = await transporter.sendMail({
      from: `"Staark Inc." <${fromEmail}>`,
      to,
      subject,
      replyTo: fromEmail,

      text: message,

      html: `
        <!doctype html>
        <html>
          <body style="
            margin:0;
            padding:0;
            background:#f5f5f5;
            font-family:Arial,Helvetica,sans-serif;
            color:#202226;
          ">
            <table
              width="100%"
              cellpadding="0"
              cellspacing="0"
              style="padding:40px 16px;"
            >
              <tr>
                <td align="center">
                  <table
                    width="600"
                    cellpadding="0"
                    cellspacing="0"
                    style="
                      max-width:600px;
                      width:100%;
                      background:#ffffff;
                      border-radius:12px;
                      overflow:hidden;
                    "
                  >
                    <tr>
                      <td style="
                        padding:28px 32px;
                        background:#17181a;
                        color:#ffffff;
                        font-size:20px;
                        font-weight:700;
                      ">
                        Staark Inc.
                      </td>
                    </tr>

                    <tr>
                      <td style="
                        padding:32px;
                        font-size:15px;
                        line-height:1.7;
                      ">
                        ${escapeHtml(message).replaceAll("\n", "<br>")}
                      </td>
                    </tr>

                    <tr>
                      <td style="
                        padding:20px 32px;
                        border-top:1px solid #eeeeee;
                        color:#92959a;
                        font-size:12px;
                      ">
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
    
    console.log(
      `[SMTP] Hub send email successfully: ${info.messageId}`
    );
    transporter.close();

    await prisma.message.create({
      data: {
        direction: "OUTBOUND",
        fromName: "Staark Inc.",
        fromEmail,
        toEmail: to,
        subject,
        body: message,
        isRead: true,
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error("Hub send failed:", error);

    return NextResponse.json(
      {
        error: "Could not send the message.",
      },
      {
        status: 500,
      }
    );
  }
}