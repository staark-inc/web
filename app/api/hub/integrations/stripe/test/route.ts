import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { testStripeConnection, type StripeEnvironment } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { environment?: StripeEnvironment }
    | null;

  const environment: StripeEnvironment = body?.environment === "test" ? "test" : "live";

  try {
    const account = await testStripeConnection(environment);

    return NextResponse.json({
      ok: true,
      account,
    });
  } catch (error) {
    console.error(`[STRIPE] ${environment} connection test failed:`, error);

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
