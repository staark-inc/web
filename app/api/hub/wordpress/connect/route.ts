import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  encryptSiteSecret,
  hashPairingCode,
  normalizePairingCode,
  parseWordPressSitePayload,
  sitePayloadData,
} from "@/lib/wordpress-connector";

export const runtime = "nodejs";

function inputString(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const pairingCode = normalizePairingCode(inputString(body.pairingCode, 80));
    const siteSecret = inputString(body.siteSecret, 256);
    const site = parseWordPressSitePayload(body.site);

    if (!pairingCode || pairingCode.length < 6 || siteSecret.length < 32 || !site) {
      return NextResponse.json(
        { error: "Invalid WordPress pairing request." },
        { status: 400 }
      );
    }

    const codeHash = hashPairingCode(pairingCode);
    const pairing = await prisma.wordPressPairingCode.findUnique({
      where: { codeHash },
    });

    if (!pairing || pairing.usedAt || pairing.expiresAt.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: "Pairing code is invalid or expired." },
        { status: 401 }
      );
    }

    const encryptedSecret = encryptSiteSecret(siteSecret);
    const now = new Date();

    const connectedSite = await prisma.$transaction(async (tx) => {
      const currentPairing = await tx.wordPressPairingCode.findUnique({
        where: { id: pairing.id },
      });

      if (!currentPairing || currentPairing.usedAt || currentPairing.expiresAt.getTime() <= Date.now()) {
        throw new Error("PAIRING_CODE_CONSUMED");
      }

      const record = await tx.wordPressSite.upsert({
        where: { siteId: site.siteId },
        create: {
          siteId: site.siteId,
          siteSecretEncrypted: encryptedSecret,
          ...sitePayloadData(site),
          status: "CONNECTED",
          connectedAt: now,
          lastSeenAt: now,
          clientId: currentPairing.targetClientId,
          projectId: currentPairing.targetProjectId,
        },
        update: {
          siteSecretEncrypted: encryptedSecret,
          ...sitePayloadData(site),
          status: "CONNECTED",
          connectedAt: now,
          lastSeenAt: now,
          clientId: currentPairing.targetClientId,
          projectId: currentPairing.targetProjectId,
        },
      });

      await tx.wordPressPairingCode.update({
        where: { id: currentPairing.id },
        data: {
          usedAt: now,
          usedBySiteId: site.siteId,
        },
      });

      return record;
    });

    return NextResponse.json({
      ok: true,
      siteId: connectedSite.siteId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PAIRING_CODE_CONSUMED") {
      return NextResponse.json(
        { error: "Pairing code has already been used." },
        { status: 409 }
      );
    }

    console.error("[WORDPRESS] Pairing failed:", error);
    return NextResponse.json(
      { error: "Could not pair this WordPress website." },
      { status: 500 }
    );
  }
}
