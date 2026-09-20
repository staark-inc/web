export const runtime = "nodejs";

export async function POST() {
  return new Response(null, {
    status: 204,
  });
}

export async function GET() {
  return Response.json({
    ok: true,
    service: "gmail-webhook",
  });
}