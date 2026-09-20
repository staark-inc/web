import { NextResponse } from "next/server";

import { redirectTo } from "@/lib/redirect";
import { getSmtpTransporter } from "@/lib/smtp";
import { prisma } from "@/lib/prisma";
import {
  publishCurrentBadges,
} from "@/lib/realtime";

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
  try {
    const contentType =
      request.headers.get(
        "content-type"
      ) ?? "";

    let name = "";
    let email = "";
    let phone = "";
    let company = "";
    let service = "";
    let budget = "";
    let message = "";

    /*
     * Read JSON or standard HTML form.
     */

    if (
      contentType.includes(
        "application/json"
      )
    ) {
      const body =
        (await request.json()) as {
          name?: unknown;
          email?: unknown;
          phone?: unknown;
          company?: unknown;
          service?: unknown;
          budget?: unknown;
          message?: unknown;
        };

      name =
        typeof body.name === "string"
          ? body.name.trim()
          : "";

      email =
        typeof body.email === "string"
          ? body.email
              .trim()
              .toLowerCase()
          : "";

      phone =
        typeof body.phone === "string"
          ? body.phone.trim()
          : "";

      company =
        typeof body.company === "string"
          ? body.company.trim()
          : "";

      service =
        typeof body.service === "string"
          ? body.service.trim()
          : "";

      budget =
        typeof body.budget === "string"
          ? body.budget.trim()
          : "";

      message =
        typeof body.message === "string"
          ? body.message.trim()
          : "";
    } else {
      const formData =
        await request.formData();

      name = String(
        formData.get("name") ?? ""
      ).trim();

      email = String(
        formData.get("email") ?? ""
      )
        .trim()
        .toLowerCase();

      phone = String(
        formData.get("phone") ?? ""
      ).trim();

      company = String(
        formData.get("company") ?? ""
      ).trim();

      service = String(
        formData.get("service") ?? ""
      ).trim();

      budget = String(
        formData.get("budget") ?? ""
      ).trim();

      message = String(
        formData.get("message") ?? ""
      ).trim();
    }

    /*
     * Validation.
     */

    if (
      !name ||
      name.length > 120 ||
      !emailPattern.test(email) ||
      email.length > 320 ||
      !message ||
      message.length > 5000
    ) {
      return NextResponse.json(
        {
          error:
            "Kontrollera namn, e-post och meddelande.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Shared values.
     */

    const to =
      requiredEnv(
        "CONTACT_TO_EMAIL"
      );

    const fromEmail =
      requiredEnv(
        "CONTACT_FROM_EMAIL"
      );

    /*
     * Prevent accidental newlines
     * inside the email subject.
     */

    const subjectName =
      name
        .replace(/[\r\n]+/g, " ")
        .trim();

    const subject =
      `Ny förfrågan från ${subjectName} | Staark Inc`;

    /*
     * Escape user-controlled content
     * before inserting into HTML.
     */

    const safeName =
      escapeHtml(name);

    const safeEmail =
      escapeHtml(email);

    const safeMessage =
      escapeHtml(message).replace(
        /\r?\n/g,
        "<br />"
      );

    /*
     * Send notification email.
     */

    const transporter =
      await getSmtpTransporter();

    try {
      const info =
        await transporter.sendMail({
          /*
           * Sender displayed in inbox.
           */

          from:
            `"Staark Inc - Kontakt" <${fromEmail}>`,

          /*
           * Staark contact inbox.
           */

          to,

          /*
           * Reply button replies
           * directly to customer.
           */

          replyTo: {
            name,
            address: email,
          },

          subject,

          /*
           * Plain-text fallback.
           */

          text: `
NY KONTAKTFÖRFRÅGAN – STAARK INC

Namn:
${name}

E-post:
${email}

Meddelande:
${message}

---
Skickat via kontaktformuläret på staarkinc.com
          `.trim(),

          /*
           * Branded HTML email.
           */

          html: `
<!doctype html>
<html lang="sv">
  <head>
    <meta charset="UTF-8" />

    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0"
    />

    <title>
      Ny kontaktförfrågan
    </title>
  </head>

  <body
    style="
      margin:0;
      padding:0;
      background:#f3f4f6;
      font-family:Arial,Helvetica,sans-serif;
      color:#111827;
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
        background:#f3f4f6;
        padding:40px 16px;
      "
    >
      <tr>
        <td align="center">

          <!-- EMAIL CONTAINER -->

          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            role="presentation"
            style="
              width:100%;
              max-width:620px;
              background:#ffffff;
              border:1px solid #e5e7eb;
              border-radius:16px;
              overflow:hidden;
            "
          >

            <!-- HEADER -->

            <tr>
              <td
                style="
                  background:#111827;
                  padding:30px 36px;
                "
              >
                <div
                  style="
                    color:#ffffff;
                    font-size:22px;
                    line-height:1.2;
                    font-weight:700;
                  "
                >
                  Staark Inc<span
                    style="color:#3b82f6;"
                  >.</span>
                </div>

                <div
                  style="
                    margin-top:8px;
                    color:#9ca3af;
                    font-size:14px;
                  "
                >
                  Ny kontaktförfrågan
                </div>
              </td>
            </tr>

            <!-- CONTENT -->

            <tr>
              <td
                style="
                  padding:36px;
                "
              >

                <!-- LEAD BADGE -->

                <table
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  role="presentation"
                  style="
                    margin-bottom:22px;
                  "
                >
                  <tr>
                    <td
                      style="
                        background:#eff6ff;
                        color:#2563eb;
                        font-size:11px;
                        font-weight:700;
                        letter-spacing:0.6px;
                        padding:7px 12px;
                        border-radius:999px;
                      "
                    >
                      NY LEAD
                    </td>
                  </tr>
                </table>

                <!-- TITLE -->

                <h1
                  style="
                    margin:0 0 10px;
                    color:#111827;
                    font-size:24px;
                    line-height:1.35;
                    font-weight:700;
                  "
                >
                  Ny förfrågan från ${safeName}
                </h1>

                <p
                  style="
                    margin:0 0 30px;
                    color:#6b7280;
                    font-size:14px;
                    line-height:1.6;
                  "
                >
                  En ny potentiell kund har skickat ett meddelande
                  via kontaktformuläret på staarkinc.com.
                </p>

                <!-- CONTACT INFORMATION -->

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  role="presentation"
                  style="
                    width:100%;
                    background:#f9fafb;
                    border:1px solid #f3f4f6;
                    border-radius:12px;
                    margin-bottom:28px;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding:20px 22px 10px;
                      "
                    >
                      <div
                        style="
                          margin-bottom:5px;
                          color:#9ca3af;
                          font-size:11px;
                          font-weight:700;
                          letter-spacing:0.5px;
                        "
                      >
                        NAMN
                      </div>

                      <div
                        style="
                          color:#111827;
                          font-size:16px;
                          font-weight:600;
                        "
                      >
                        ${safeName}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:10px 22px 20px;
                      "
                    >
                      <div
                        style="
                          margin-bottom:5px;
                          color:#9ca3af;
                          font-size:11px;
                          font-weight:700;
                          letter-spacing:0.5px;
                        "
                      >
                        E-POST
                      </div>

                      <a
                        href="mailto:${safeEmail}"
                        style="
                          color:#3b82f6;
                          font-size:16px;
                          text-decoration:none;
                        "
                      >
                        ${safeEmail}
                      </a>
                    </td>
                  </tr>
                </table>

                <!-- MESSAGE -->

                <div
                  style="
                    margin-bottom:8px;
                    color:#9ca3af;
                    font-size:11px;
                    font-weight:700;
                    letter-spacing:0.5px;
                  "
                >
                  MEDDELANDE
                </div>

                <div
                  style="
                    margin-bottom:30px;
                    padding:20px;
                    background:#ffffff;
                    border:1px solid #e5e7eb;
                    border-radius:12px;
                    color:#374151;
                    font-size:15px;
                    line-height:1.7;
                  "
                >
                  ${safeMessage}
                </div>

                <!-- REPLY BUTTON -->

                <table
                  cellpadding="0"
                  cellspacing="0"
                  border="0"
                  role="presentation"
                >
                  <tr>
                    <td
                      style="
                        background:#3b82f6;
                        border-radius:8px;
                      "
                    >
                      <a
                        href="mailto:${safeEmail}"
                        style="
                          display:inline-block;
                          padding:13px 20px;
                          color:#ffffff;
                          font-size:14px;
                          font-weight:700;
                          text-decoration:none;
                        "
                      >
                        Svara ${safeName} →
                      </a>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>

            <!-- FOOTER -->

            <tr>
              <td
                style="
                  padding:22px 36px;
                  background:#f9fafb;
                  border-top:1px solid #e5e7eb;
                  color:#9ca3af;
                  font-size:12px;
                  line-height:1.6;
                "
              >
                Detta meddelande skickades automatiskt via
                kontaktformuläret på

                <strong
                  style="
                    color:#6b7280;
                  "
                >
                  staarkinc.com
                </strong>.
              </td>
            </tr>

          </table>

          <!-- SMALL FOOTER -->

          <div
            style="
              margin-top:18px;
              color:#9ca3af;
              font-size:11px;
            "
          >
            © Staark Inc.
          </div>

        </td>
      </tr>
    </table>
  </body>
</html>
          `,
        });

      console.log(
        `[SMTP] Contact email sent successfully: ${info.messageId}`
      );
    } finally {
      transporter.close();
    }

    /*
     * Save CRM data as one transaction.
     *
     * Either Contact + Thread + Message +
     * Lead are all created successfully,
     * or none of them are committed.
     */

    await prisma.$transaction(
      async (tx) => {
        /*
         * Create/update customer.
         */

        const contact =
          await tx.contact.upsert({
            where: {
              email,
            },

            update: {
              name,

              ...(phone
                ? {
                    phone,
                  }
                : {}),

              ...(company
                ? {
                    company,
                  }
                : {}),
            },

            create: {
              name,
              email,

              phone:
                phone || null,

              company:
                company || null,
            },
          });

        /*
         * A contact-form enquiry starts
         * a brand new conversation.
         */

        const thread =
          await tx.thread.create({
            data: {
              contactId:
                contact.id,

              subject,
            },
          });

        /*
         * First inbound message
         * inside the conversation.
         */

        await tx.message.create({
          data: {
            direction:
              "INBOUND",

            contactId:
              contact.id,

            threadId:
              thread.id,

            fromName:
              name,

            fromEmail:
              email,

            toEmail:
              to,

            subject,

            body:
              message,

            isRead:
              false,
          },
        });

        /*
         * Every contact-form enquiry
         * also creates a new lead.
         */

        await tx.lead.create({
          data: {
            contactId:
              contact.id,

            service:
              service || null,

            budget:
              budget || null,

            message,

            status:
              "NEW",
          },
        });
      }
    );

    /*
     * Push updated Inbox/Lead badges
     * after the DB transaction succeeds.
     */

    await publishCurrentBadges();

    /*
     * Browser form:
     * redirect back to contact page.
     *
     * JSON/API request:
     * return JSON.
     */

    const acceptsHtml =
      !contentType.includes(
        "application/json"
      );

    if (acceptsHtml) {
      return redirectTo(
        "/kontakt?sent=1"
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    console.error(
      "Contact form delivery failed:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Meddelandet kunde inte skickas just nu.",
      },
      {
        status: 500,
      }
    );
  }
}