import { NextResponse } from "next/server";
import { prepareNewsImage } from "@/lib/news-images";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  newsPublicOrigin,
  newsSameOrigin,
  readNewsBody,
} from "@/lib/news-request";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!newsSameOrigin(request))
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  try {
    const bytes = await readNewsBody(request, 6 * 1024 * 1024);
    const form = await new Response(Buffer.from(bytes), {
      headers: { "content-type": request.headers.get("content-type") || "" },
    }).formData();
    const file = form.get("file");
    if (!(file instanceof File) || !file.size || file.size > 5 * 1024 * 1024)
      return NextResponse.json(
        { error: "Choose an image up to 5 MB." },
        { status: 413 },
      );
    const input = Buffer.from(await file.arrayBuffer());
    const { data, info } = await prepareNewsImage(input);
    const asset = await prisma.saasAnnouncementAsset.create({
      data: {
        data: new Uint8Array(data),
        width: info.width,
        height: info.height,
      },
      select: { id: true },
    });
    return NextResponse.json({
      url: `${newsPublicOrigin(request)}/api/news/images/${asset.id}`,
      width: info.width,
      height: info.height,
    });
  } catch (error) {
    console.error("[NEWS IMAGE]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error && error.message === "Request is too large."
            ? error.message
            : "Could not upload this image. Choose a valid image and try again.",
      },
      { status: 400 },
    );
  }
}
