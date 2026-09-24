import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generatePairingCode,
  hashPairingCode,
} from "@/lib/wordpress-connector";

export const runtime = "nodejs";

function text(value: unknown, max = 120) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    let clientId = text(body.clientId) || null;
    const projectId = text(body.projectId) || null;

    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { id: true },
      });
      if (!client) {
        return NextResponse.json({ error: "Client not found." }, { status: 400 });
      }
    }

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true, clientId: true },
      });
      if (!project || (clientId && project.clientId !== clientId)) {
        return NextResponse.json(
          { error: "Project does not belong to the selected client." },
          { status: 400 }
        );
      }
      clientId = project.clientId;
    }

    let code = generatePairingCode();
    let codeHash = hashPairingCode(code);

    while (
      await prisma.wordPressPairingCode.findUnique({
        where: { codeHash },
        select: { id: true },
      })
    ) {
      code = generatePairingCode();
      codeHash = hashPairingCode(code);
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.wordPressPairingCode.create({
      data: {
        codeHash,
        hint: code.slice(-4),
        targetClientId: clientId,
        targetProjectId: projectId,
        createdById: session.userId,
        expiresAt,
      },
    });

    return NextResponse.json({
      ok: true,
      code,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("[WORDPRESS] Could not create pairing code:", error);
    return NextResponse.json(
      { error: "Could not create a WordPress pairing code." },
      { status: 500 }
    );
  }
}
