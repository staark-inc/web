export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      service: "gmail-watch",
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}