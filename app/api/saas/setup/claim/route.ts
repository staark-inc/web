import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Legacy setup claim flow has been retired. Use the Hub setup flow instead.",
    },
    {
      status: 410,
    },
  );
}
