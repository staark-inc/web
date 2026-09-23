import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { testStripeConnection } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const account = await testStripeConnection();

    return NextResponse.json({
      ok: true,
      account,
    });
  } catch (error) {
    console.error("[STRIPE] Connection test failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not connect to Stripe.",
      },
      { status: 500 }
    );
  }
}
