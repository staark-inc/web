import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NewsInputError, parseNewsInput } from "@/lib/news-policy";
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
  const wantsJson = request.headers.get("accept")?.includes("application/json");
  const result = (
    state: string,
    data: Record<string, unknown> = {},
    status = 200,
  ) =>
    wantsJson
      ? NextResponse.json({ ok: status < 400, ...data }, { status })
      : NextResponse.redirect(
          new URL(
            `/hub/updates?state=${encodeURIComponent(state)}`,
            newsPublicOrigin(request),
          ),
          303,
        );
  try {
    const bytes = await readNewsBody(request, 128 * 1024);
    const form = await new Response(Buffer.from(bytes), {
      headers: { "content-type": request.headers.get("content-type") || "" },
    }).formData();
    const text = (key: string) =>
      typeof form.get(key) === "string" ? String(form.get(key)).trim() : "";
    const action = text("action") || "save",
      id = text("id");
    if (!["save", "delete", "publish", "unpublish", "toggle"].includes(action))
      throw new NewsInputError("Invalid action.");
    if (action !== "save") {
      if (!id) throw new NewsInputError("Announcement id is required.");
      if (action === "delete") {
        await prisma.saasAnnouncement.delete({ where: { id } });
        return result("deleted");
      }
      const current = await prisma.saasAnnouncement.findUnique({
        where: { id },
      });
      if (!current) throw new NewsInputError("Announcement was not found.");
      const published =
        action === "toggle" ? !current.published : action === "publish";
      const changed = await prisma.saasAnnouncement.updateMany({
        where: { id, updatedAt: current.updatedAt },
        data: {
          published,
          publishedAt: published ? (current.publishedAt ?? new Date()) : null,
        },
      });
      if (!changed.count)
        return result(
          "error:Update changed. Reload and try again.",
          { error: "Update changed. Reload and try again." },
          409,
        );
      return result(published ? "published" : "unpublished");
    }
    const parsed = parseNewsInput(form);
    const data = {
      ...parsed,
      audiencePlan: parsed.audiencePlan as
        | "STARTER"
        | "SAAS"
        | "BUSINESS"
        | null,
    };
    if (id) {
      const expected = text("updatedAt");
      const version = new Date(expected);
      if (!expected || Number.isNaN(version.getTime()))
        throw new NewsInputError("Reload the editor before saving.");
      const saved = await prisma.$transaction(async (tx) => {
        const changed = await tx.saasAnnouncement.updateMany({
          where: { id, updatedAt: version },
          data,
        });
        if (!changed.count) return null;
        return tx.saasAnnouncement.findUniqueOrThrow({
          where: { id },
          select: { id: true, updatedAt: true },
        });
      });
      if (!saved)
        return result(
          "error:Another session changed this update. Reload before saving.",
          {
            error:
              "Another session changed this update. Your text is kept here; copy it before reloading.",
          },
          409,
        );
      return result("saved", {
        id: saved.id,
        updatedAt: saved.updatedAt.toISOString(),
      });
    }
    const saved = await prisma.saasAnnouncement.create({
      data: { ...data, published: false },
      select: { id: true, updatedAt: true },
    });
    return result("created", {
      id: saved.id,
      updatedAt: saved.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("[HUB UPDATES]", error);
    const message =
      error instanceof NewsInputError
        ? error.message
        : "The update could not be saved.";
    return result(`error:${message}`, { error: message }, 400);
  }
}
