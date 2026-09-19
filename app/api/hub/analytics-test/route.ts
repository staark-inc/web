import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getGa4Overview } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const analytics = await getGa4Overview();

    return NextResponse.json({
      ok: true,
      period: "last 30 days",
      propertyId: process.env.GA4_PROPERTY_ID,
      analytics,
    });
  } catch (error) {
    console.error("GA4 ERROR:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}