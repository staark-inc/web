import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getSearchConsoleOverview } from "@/lib/search-console";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const analytics =
      await getSearchConsoleOverview();

    return NextResponse.json({
      ok: true,
      period: "last 30 days",
      site:
        process.env.SEARCH_CONSOLE_SITE_URL,
      searchConsole: analytics,
    });
  } catch (error) {
    console.error(
      "Search Console report failed:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Search Console request failed.",
      },
      {
        status: 500,
      }
    );
  }
}