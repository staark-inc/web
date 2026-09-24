import { NextResponse } from "next/server";

import { createAdminNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import {
  connectorString,
  mapWordPressTicketCategory,
  mapWordPressTicketPriority,
  parseWordPressSitePayload,
  sitePayloadData,
  verifyWordPressRequest,
  wordpressTicketReference,
} from "@/lib/wordpress-connector";

export const runtime = "nodejs";

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function validCreatedAt(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function ticketWebsite(ticket: Record<string, unknown>, fallback: string) {
  const environment = record(ticket.environment);
  const siteUrl = environment ? connectorString(environment.site_url, 500) : "";
  return siteUrl || fallback;
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  try {
    const verified = await verifyWordPressRequest(request, rawBody);
    if (!verified.ok) {
      return NextResponse.json(
        { error: verified.error },
        { status: verified.status }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const sitePayload = parseWordPressSitePayload(body.site);
    if (!sitePayload || sitePayload.siteId !== verified.site.siteId) {
      return NextResponse.json(
        { error: "WordPress site identity does not match the signed request." },
        { status: 400 }
      );
    }

    const tickets = Array.isArray(body.tickets) ? body.tickets : [];
    if (tickets.length > 50) {
      return NextResponse.json(
        { error: "A sync request can contain at most 50 support tickets." },
        { status: 413 }
      );
    }

    const now = new Date();
    await prisma.wordPressSite.update({
      where: { id: verified.site.id },
      data: {
        ...sitePayloadData(sitePayload),
        status: "CONNECTED",
        lastSeenAt: now,
      },
    });

    const synced: number[] = [];

    for (const rawTicket of tickets) {
      const ticket = record(rawTicket);
      if (!ticket) continue;

      const localId = Number(ticket.localId);
      const title = connectorString(ticket.subject, 160);
      const description = connectorString(ticket.message, 10000);
      const requesterName = connectorString(ticket.contactName, 120);
      const requesterEmail = connectorString(ticket.contactEmail, 320).toLowerCase();

      if (!Number.isSafeInteger(localId) || localId <= 0 || title.length < 2 || description.length < 1) {
        continue;
      }

      const alreadySynced = await prisma.wordPressTicketSync.findUnique({
        where: {
          wordpressSiteId_localId: {
            wordpressSiteId: verified.site.id,
            localId,
          },
        },
        select: { id: true },
      });

      if (alreadySynced) {
        synced.push(localId);
        continue;
      }

      let supportRequestId: string | null = null;

      try {
        supportRequestId = await prisma.$transaction(async (tx) => {
          const supportRequest = await tx.supportRequest.create({
            data: {
              clientId: verified.site.clientId,
              projectId: verified.site.projectId,
              reference: wordpressTicketReference(verified.site.siteId, localId),
              requesterName: requesterName || null,
              requesterEmail: requesterEmail || null,
              requesterCompany: verified.site.siteName || null,
              requesterWebsite: ticketWebsite(ticket, verified.site.siteUrl),
              title,
              description,
              internalNotes: `Synced from WordPress · local ticket ${localId}`,
              category: mapWordPressTicketCategory(ticket.category),
              priority: mapWordPressTicketPriority(ticket.priority),
              status: "OPEN",
              coverage: "UNASSESSED",
              timeSpentMinutes: 0,
              createdAt: validCreatedAt(ticket.createdAt),
            },
            select: { id: true },
          });

          await tx.wordPressTicketSync.create({
            data: {
              wordpressSiteId: verified.site.id,
              localId,
              supportRequestId: supportRequest.id,
              payload: JSON.parse(JSON.stringify(ticket)),
            },
          });

          return supportRequest.id;
        });
      } catch (error) {
        const raced = await prisma.wordPressTicketSync.findUnique({
          where: {
            wordpressSiteId_localId: {
              wordpressSiteId: verified.site.id,
              localId,
            },
          },
          select: { supportRequestId: true },
        });

        if (!raced) {
          console.error(`[WORDPRESS] Could not import ticket ${localId}:`, error);
          continue;
        }

        supportRequestId = raced.supportRequestId;
      }

      synced.push(localId);

      if (supportRequestId) {
        try {
          await createAdminNotification({
            type: "support.wordpress.created",
            title: "New WordPress support request",
            message: `${verified.site.siteName} · ${title}`,
            href: `/hub/support/${supportRequestId}`,
            metadata: {
              supportRequestId,
              wordpressSiteId: verified.site.id,
              localId,
            },
            dedupeKey: `wordpress-support:${verified.site.id}:${localId}`,
            preference: "support",
          });
        } catch (notificationError) {
          console.error(
            `[WORDPRESS] Ticket ${localId} synced but notification failed:`,
            notificationError
          );
        }
      }
    }

    return NextResponse.json({
      ok: true,
      synced: { tickets: synced },
    });
  } catch (error) {
    console.error("[WORDPRESS] Sync failed:", error);
    return NextResponse.json(
      { error: "WordPress support sync failed." },
      { status: 500 }
    );
  }
}
