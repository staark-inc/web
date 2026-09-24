import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyWordPressRequest } from "@/lib/wordpress-connector";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const verified = await verifyWordPressRequest(request, "");
    if (!verified.ok) {
      return NextResponse.json(
        { error: verified.error },
        { status: verified.status }
      );
    }

    const now = new Date();
    await prisma.wordPressSite.update({
      where: { id: verified.site.id },
      data: {
        status: "CONNECTED",
        lastSeenAt: now,
      },
    });

    return NextResponse.json({
      ok: true,
      siteId: verified.site.siteId,
      serverTime: now.toISOString(),
    });
  } catch (error) {
    console.error("[WORDPRESS] Ping failed:", error);
    return NextResponse.json(
      { error: "Could not verify the WordPress connector." },
      { status: 500 }
    );
  }
}
