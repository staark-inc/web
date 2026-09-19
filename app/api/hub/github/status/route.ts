import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { getGitHubOverview } from "@/lib/github";

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
    const github = await getGitHubOverview();

    return NextResponse.json({
      ok: true,
      github,
    });
  } catch (error) {
    console.error(
      "Failed to load GitHub status:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error: "GitHub integration unavailable.",
      },
      {
        status: 500,
      }
    );
  }
}