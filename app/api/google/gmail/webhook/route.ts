import type {
  gmail_v1,
} from "googleapis";

import {
  getGmailClient,
} from "@/lib/gmail";

import { prisma } from "@/lib/prisma";

import {
  publishCurrentBadges,
} from "@/lib/realtime";

export const runtime = "nodejs";

type PubSubBody = {
  message?: {
    data?: string;
    messageId?: string;
  };

  subscription?: string;
};

type GmailNotification = {
  emailAddress?: string;
  historyId?: string;
};

function requiredEnv(
  name: string
) {
  const value =
    process.env[name];

  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}`
    );
  }

  return value;
}

function decodeBase64Url(
  value: string
) {
  return Buffer.from(
    value
      .replace(/-/g, "+")
      .replace(/_/g, "/"),
    "base64"
  ).toString("utf8");
}

function getHeader(
  headers:
    | gmail_v1.Schema$MessagePartHeader[]
    | null
    | undefined,
  name: string
) {
  const header =
    headers?.find(
      (item) =>
        item.name?.toLowerCase() ===
        name.toLowerCase()
    );

  return (
    header?.value?.trim() ??
    ""
  );
}

function parseMailbox(
  value: string
) {
  const angle =
    value.match(
      /^(.*?)<([^<>]+)>/
    );

  if (angle) {
    return {
      name:
        angle[1]
          .trim()
          .replace(
            /^["']|["']$/g,
            ""
          ) || null,

      email:
        angle[2]
          .trim()
          .toLowerCase(),
    };
  }

  const email =
    value.match(
      /[^\s<>,]+@[^\s<>,]+/
    )?.[0];

  return {
    name: null,

    email:
      email
        ?.trim()
        .toLowerCase() ??
      "",
  };
}

function extractParts(
  part:
    | gmail_v1.Schema$MessagePart
    | null
    | undefined
): {
  plain: string[];
  html: string[];
} {
  const result = {
    plain: [] as string[],
    html: [] as string[],
  };

  if (!part) {
    return result;
  }

  const data =
    part.body?.data;

  if (
    data &&
    part.mimeType ===
      "text/plain"
  ) {
    result.plain.push(
      decodeBase64Url(data)
    );
  }

  if (
    data &&
    part.mimeType ===
      "text/html"
  ) {
    result.html.push(
      decodeBase64Url(data)
    );
  }

  for (
    const child of
    part.parts ?? []
  ) {
    const childResult =
      extractParts(child);

    result.plain.push(
      ...childResult.plain
    );

    result.html.push(
      ...childResult.html
    );
  }

  return result;
}

function htmlToText(
  value: string
) {
  return value
    .replace(
      /<style[\s\S]*?<\/style>/gi,
      " "
    )
    .replace(
      /<script[\s\S]*?<\/script>/gi,
      " "
    )
    .replace(
      /<br\s*\/?>/gi,
      "\n"
    )
    .replace(
      /<\/p>/gi,
      "\n"
    )
    .replace(
      /<[^>]+>/g,
      " "
    )
    .replace(
      /&nbsp;/gi,
      " "
    )
    .replace(
      /&amp;/gi,
      "&"
    )
    .replace(
      /&lt;/gi,
      "<"
    )
    .replace(
      /&gt;/gi,
      ">"
    )
    .replace(
      /&quot;/gi,
      '"'
    )
    .replace(
      /&#39;/gi,
      "'"
    )
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim();
}

function cleanReplyBody(
  value: string
) {
  let text =
    value
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .trim();

  /*
   * Gmail / Outlook / Apple Mail often
   * append the previous conversation.
   *
   * Examples:
   *
   * On Sun, 20 Sep ... wrote:
   * În dum., 20 sept. ... a scris:
   * Den sön ... skrev:
   */

  const replySeparators = [
    /*
     * English
     */
    /^On .+ wrote:\s*$/im,

    /*
     * Romanian
     */
    /^În .+ a scris:\s*$/im,
    /^La data de .+ a scris:\s*$/im,

    /*
     * Swedish
     */
    /^Den .+ skrev .+:\s*$/im,
    /^Den .+ skrev:\s*$/im,

    /*
     * Generic forwarded/original
     * message separators.
     */
    /^-{2,}\s*Original Message\s*-{2,}\s*$/im,
    /^-{2,}\s*Forwarded message\s*-{2,}\s*$/im,
    /^-{2,}\s*Vidarebefordrat meddelande\s*-{2,}\s*$/im,
  ];

  let cutIndex =
    text.length;

  for (
    const pattern of
    replySeparators
  ) {
    const match =
      pattern.exec(text);

    if (
      match?.index !== undefined &&
      match.index < cutIndex
    ) {
      cutIndex =
        match.index;
    }
  }

  if (
    cutIndex <
    text.length
  ) {
    text =
      text
        .slice(
          0,
          cutIndex
        )
        .trim();
  }

  /*
   * If quoted lines remain, remove
   * them and everything following
   * the first quoted block.
   */

  const lines =
    text.split("\n");

  const cleanedLines:
    string[] = [];

  for (
    const line of lines
  ) {
    const trimmed =
      line.trim();

    if (
      trimmed.startsWith(">")
    ) {
      break;
    }

    cleanedLines.push(
      line
    );
  }

  text =
    cleanedLines
      .join("\n")
      .replace(
        /\n{3,}/g,
        "\n\n"
      )
      .trim();

  /*
   * Remove common mobile/email
   * signature separators at the end.
   */

  const signaturePatterns = [
    /\n--\s*\n[\s\S]*$/m,

    /\nSent from my iPhone[\s\S]*$/i,
    /\nSent from my Android[\s\S]*$/i,

    /\nSkickat från min iPhone[\s\S]*$/i,
    /\nSkickat från min Android[\s\S]*$/i,

    /\nTrimis de pe iPhone[\s\S]*$/i,
    /\nTrimis de pe Android[\s\S]*$/i,
  ];

  for (
    const pattern of
    signaturePatterns
  ) {
    text =
      text
        .replace(
          pattern,
          ""
        )
        .trim();
  }

  return text;
}

function extractBody(
  payload:
    | gmail_v1.Schema$MessagePart
    | null
    | undefined,
  snippet = ""
) {
  const parts =
    extractParts(payload);

  const plain =
    parts.plain
      .join("\n")
      .trim();

  if (plain) {
    return plain;
  }

  const html =
    parts.html
      .join("\n")
      .trim();

  if (html) {
    return htmlToText(
      html
    );
  }

  /*
   * Some simple Gmail messages store
   * their body directly on payload.body.
   */

  if (
    payload?.body?.data
  ) {
    return decodeBase64Url(
      payload.body.data
    ).trim();
  }

  return snippet.trim();
}

function cleanThreadSubject(
  subject: string
) {
  const clean =
    subject
      .replace(
        /^(re|sv|fw|fwd):\s*/gi,
        ""
      )
      .trim();

  return (
    clean ||
    "(No subject)"
  );
}

function referenceIds(
  value: string
) {
  if (!value) {
    return [];
  }

  const angleIds =
    value.match(
      /<[^>]+>/g
    );

  if (angleIds?.length) {
    return angleIds;
  }

  return value
    .split(/\s+/)
    .map(
      (item) =>
        item.trim()
    )
    .filter(Boolean);
}

async function findStaarkThread(
  gmailThreadId:
    string | null,
  inReplyTo:
    string,
  references:
    string
) {
  /*
   * First preference:
   * Gmail thread already mapped.
   */

  if (gmailThreadId) {
    const byGmailThread =
      await prisma.thread.findUnique({
        where: {
          gmailThreadId,
        },
      });

    if (byGmailThread) {
      return byGmailThread;
    }
  }

  /*
   * Second preference:
   * RFC In-Reply-To points directly
   * to one of our outbound messages.
   */

  if (inReplyTo) {
    const parentMessage =
      await prisma.message.findUnique({
        where: {
          rfcMessageId:
            inReplyTo,
        },

        include: {
          thread: true,
        },
      });

    if (
      parentMessage?.thread
    ) {
      return parentMessage.thread;
    }
  }

  /*
   * Third preference:
   * walk References backwards and
   * find a known Message-ID.
   */

  const refs =
    referenceIds(
      references
    ).reverse();

  for (const ref of refs) {
    const parentMessage =
      await prisma.message.findUnique({
        where: {
          rfcMessageId:
            ref,
        },

        include: {
          thread: true,
        },
      });

    if (
      parentMessage?.thread
    ) {
      return parentMessage.thread;
    }
  }

  return null;
}

async function importGmailMessage(
  gmailMessageId: string,
  expectedAccount: string
) {
  /*
   * Pub/Sub can redeliver notifications.
   * Gmail message ID makes importing
   * idempotent.
   */

  const alreadyImported =
    await prisma.message.findUnique({
      where: {
        gmailMessageId,
      },
    });

  if (alreadyImported) {
    return false;
  }

  const {
    gmail,
  } =
    await getGmailClient();

  const response =
    await gmail.users.messages.get({
      userId: "me",

      id:
        gmailMessageId,

      format: "full",
    });

  const gmailMessage =
    response.data;

  if (!gmailMessage.id) {
    return false;
  }

  /*
   * Only import messages that are
   * actually present in Inbox.
   */

  if (
    !gmailMessage.labelIds
      ?.includes("INBOX")
  ) {
    return false;
  }

  const headers =
    gmailMessage.payload
      ?.headers;

  const fromHeader =
    getHeader(
      headers,
      "From"
    );

  const toHeader =
    getHeader(
      headers,
      "To"
    );

  const subject =
    getHeader(
      headers,
      "Subject"
    ) ||
    "(No subject)";

  const rfcMessageId =
    getHeader(
      headers,
      "Message-ID"
    );

  const inReplyTo =
    getHeader(
      headers,
      "In-Reply-To"
    );

  const references =
    getHeader(
      headers,
      "References"
    );

  const from =
    parseMailbox(
      fromHeader
    );

  const to =
    parseMailbox(
      toHeader
    );

  if (!from.email) {
    console.warn(
      `[GMAIL] Message ${gmailMessage.id} has no sender`
    );

    return false;
  }

  /*
   * Do not accidentally import our
   * own mailbox as an inbound customer.
   */

  if (
    from.email ===
    expectedAccount
  ) {
    return false;
  }

  /*
   * RFC Message-ID is also useful
   * as a second deduplication key.
   */

  if (rfcMessageId) {
    const existingRfc =
      await prisma.message.findUnique({
        where: {
          rfcMessageId,
        },
      });

    if (existingRfc) {
      /*
       * If Gmail has now exposed a message
       * we already knew about, remember
       * its Gmail ID where possible.
       */

      if (
        !existingRfc.gmailMessageId
      ) {
        await prisma.message.update({
          where: {
            id:
              existingRfc.id,
          },

          data: {
            gmailMessageId:
              gmailMessage.id,
          },
        });
      }

      return false;
    }
  }

  const rawBody =
    extractBody(
      gmailMessage.payload,
      gmailMessage.snippet ??
        ""
    );

  const body =
    cleanReplyBody(
      rawBody
    );

  const gmailThreadId =
    gmailMessage.threadId ??
    null;

  let thread =
    await findStaarkThread(
      gmailThreadId,
      inReplyTo,
      references
    );

  const contact =
    await prisma.contact.upsert({
      where: {
        email:
          from.email,
      },

      update: {
        ...(from.name
          ? {
              name:
                from.name,
            }
          : {}),
      },

      create: {
        name:
          from.name,

        email:
          from.email,
      },
    });

  /*
   * Existing reply:
   * attach Gmail's thread ID to our
   * Staark thread.
   *
   * New standalone email:
   * create a new Staark thread.
   */

  if (thread) {
    if (
      !thread.gmailThreadId &&
      gmailThreadId
    ) {
      thread =
        await prisma.thread.update({
          where: {
            id:
              thread.id,
          },

          data: {
            gmailThreadId,

            contactId:
              thread.contactId ??
              contact.id,

            updatedAt:
              new Date(),
          },
        });
    } else {
      thread =
        await prisma.thread.update({
          where: {
            id:
              thread.id,
          },

          data: {
            contactId:
              thread.contactId ??
              contact.id,

            updatedAt:
              new Date(),
          },
        });
    }
  } else {
    thread =
      await prisma.thread.create({
        data: {
          contactId:
            contact.id,

          subject:
            cleanThreadSubject(
              subject
            ),

          gmailThreadId,
        },
      });
  }

  const internalDate =
    gmailMessage.internalDate
      ? Number(
          gmailMessage.internalDate
        )
      : NaN;

  const createdAt =
    Number.isFinite(
      internalDate
    )
      ? new Date(
          internalDate
        )
      : new Date();

  await prisma.message.create({
    data: {
      direction:
        "INBOUND",

      contactId:
        thread.contactId ??
        contact.id,

      threadId:
        thread.id,

      gmailMessageId:
        gmailMessage.id,

      rfcMessageId:
        rfcMessageId ||
        null,

      inReplyTo:
        inReplyTo ||
        null,

      references:
        references ||
        null,

      fromName:
        from.name,

      fromEmail:
        from.email,

      toEmail:
        expectedAccount ||
        to.email,

      subject,

      body,

      isRead:
        false,

      createdAt,
    },
  });

  console.log(
    `[GMAIL] Imported ${gmailMessage.id} from ${from.email} into thread ${thread.id}`
  );

  return true;
}

export async function POST(
  request: Request
) {
  try {
    /*
     * Simple Pub/Sub verification token.
     *
     * The push subscription URL will be:
     * /webhook?token=SECRET
     */

    const url =
      new URL(
        request.url
      );

    const receivedToken =
      url.searchParams.get(
        "token"
      );

    const expectedToken =
      requiredEnv(
        "GOOGLE_GMAIL_WEBHOOK_TOKEN"
      );

    if (
      !receivedToken ||
      receivedToken !==
        expectedToken
    ) {
      console.warn(
        "[GMAIL] Invalid webhook token"
      );

      return new Response(
        "Unauthorized",
        {
          status: 401,
        }
      );
    }

    const body =
      (await request.json()) as PubSubBody;

    const data =
      body.message?.data;

    if (!data) {
      return new Response(
        "Invalid Pub/Sub payload",
        {
          status: 400,
        }
      );
    }

    const notification =
      JSON.parse(
        decodeBase64Url(
          data
        )
      ) as GmailNotification;

    const emailAddress =
      notification.emailAddress
        ?.trim()
        .toLowerCase();

    const notificationHistoryId =
      notification.historyId;

    const expectedAccount =
      (
        process.env
          .GOOGLE_GMAIL_ACCOUNT ??
        process.env
          .CONTACT_TO_EMAIL ??
        ""
      )
        .trim()
        .toLowerCase();

    if (
      !emailAddress ||
      !notificationHistoryId
    ) {
      return new Response(
        "Invalid Gmail notification",
        {
          status: 400,
        }
      );
    }

    if (
      expectedAccount &&
      emailAddress !==
        expectedAccount
    ) {
      console.warn(
        `[GMAIL] Ignoring notification for ${emailAddress}`
      );

      return new Response(
        null,
        {
          status: 204,
        }
      );
    }

    const {
      gmail,
      settings,
    } =
      await getGmailClient();

    /*
     * The first watch notification can
     * arrive immediately.
     *
     * If no baseline exists yet, store
     * the current history ID instead of
     * trying to read backwards.
     */

    if (
      !settings.gmailHistoryId
    ) {
      await prisma.settings.update({
        where: {
          id: "default",
        },

        data: {
          gmailHistoryId:
            notificationHistoryId,
        },
      });

      console.log(
        `[GMAIL] Initial history ID stored: ${notificationHistoryId}`
      );

      return new Response(
        null,
        {
          status: 204,
        }
      );
    }

    /*
     * Gmail history can span multiple
     * pages.
     */

    let pageToken:
      | string
      | undefined;

    let latestHistoryId =
      notificationHistoryId;

    const gmailMessageIds =
      new Set<string>();

    do {
      const historyResponse =
        await gmail.users.history.list({
          userId: "me",

          startHistoryId:
            settings.gmailHistoryId,

          historyTypes: [
            "messageAdded",
          ],

          labelId:
            "INBOX",

          maxResults:
            100,

          pageToken,
        });

      for (
        const history of
        historyResponse.data
          .history ?? []
      ) {
        for (
          const item of
          history.messagesAdded ??
          []
        ) {
          if (
            item.message?.id
          ) {
            gmailMessageIds.add(
              item.message.id
            );
          }
        }
      }

      if (
        historyResponse.data
          .historyId
      ) {
        latestHistoryId =
          historyResponse.data
            .historyId;
      }

      pageToken =
        historyResponse.data
          .nextPageToken ??
        undefined;
    } while (pageToken);

    let imported = 0;

    /*
     * Only advance historyId after all
     * messages have been processed.
     *
     * If something fails before this,
     * Pub/Sub can retry safely.
     */

    for (
      const gmailMessageId of
      gmailMessageIds
    ) {
      const didImport =
        await importGmailMessage(
          gmailMessageId,
          expectedAccount ||
            emailAddress
        );

      if (didImport) {
        imported++;
      }
    }

    await prisma.settings.update({
      where: {
        id: "default",
      },

      data: {
        gmailHistoryId:
          latestHistoryId,
      },
    });

    if (imported > 0) {
      await publishCurrentBadges();
    }

    console.log(
      `[GMAIL] History ${settings.gmailHistoryId} → ${latestHistoryId}; imported ${imported} message(s)`
    );

    /*
     * 204 acknowledges Pub/Sub.
     */

    return new Response(
      null,
      {
        status: 204,
      }
    );
  } catch (error) {
    console.error(
      "[GMAIL] Webhook failed:",
      error
    );

    /*
     * Non-2xx tells Pub/Sub to retry.
     */

    return new Response(
      "Webhook processing failed",
      {
        status: 500,
      }
    );
  }
}

export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      service: "gmail-webhook",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}