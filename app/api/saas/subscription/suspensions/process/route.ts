import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { processDueSaaSSuspensions } from "@/lib/saas/payment-failures";

export const runtime = "nodejs";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDueSaaSSuspensions();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error("[SAAS SUSPENSIONS] Could not process due suspensions:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not process due SaaS suspensions.",
      },
      { status: 500 },
    );
  }
}
