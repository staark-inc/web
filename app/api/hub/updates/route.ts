import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function field(
  form: FormData,
  name: string,
): string {
  const value =
    form.get(name);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function redirect(
  request: Request,
  state: string,
) {
  const forwardedHost =
    request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      ?.trim() ||
    request.headers
      .get("host")
      ?.split(",")[0]
      ?.trim();

  if (!forwardedHost) {
    throw new Error(
      "Could not determine public Hub host.",
    );
  }

  const forwardedProto =
    request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim()
      .toLowerCase();

  const protocol =
    process.env.NODE_ENV === "production"
      ? "https"
      : forwardedProto === "https" ||
          forwardedProto === "http"
        ? forwardedProto
        : "http";

  const url =
    new URL(
      `/hub/updates?state=${encodeURIComponent(
        state,
      )}`,
      `${protocol}://${forwardedHost}`,
    );

  return NextResponse.redirect(
    url,
    303,
  );
}

export async function POST(
  request: Request,
) {
  const session =
    await getSession();

  if (
    !session ||
    session.role !== "ADMIN"
  ) {
    return NextResponse.json(
      {
        error:
          "Unauthorized",
      },
      {
        status: 401,
      },
    );
  }

  try {
    const form =
      await request.formData();

    const action =
      field(
        form,
        "action",
      ) || "save";

    const id =
      field(
        form,
        "id",
      );

    if (
      action === "delete"
    ) {
      if (!id) {
        throw new Error(
          "Announcement id is required.",
        );
      }

      await prisma
        .saasAnnouncement
        .delete({
          where: {
            id,
          },
        });

      return redirect(
        request,
        "deleted",
      );
    }

    if (
      action === "toggle"
    ) {
      if (!id) {
        throw new Error(
          "Announcement id is required.",
        );
      }

      const current =
        await prisma
          .saasAnnouncement
          .findUnique({
            where: {
              id,
            },

            select: {
              published:
                true,
            },
          });

      if (!current) {
        throw new Error(
          "Announcement was not found.",
        );
      }

      const published =
        !current.published;

      await prisma
        .saasAnnouncement
        .update({
          where: {
            id,
          },

          data: {
            published,

            publishedAt:
              published
                ? new Date()
                : null,
          },
        });

      return redirect(
        request,
        published
          ? "published"
          : "unpublished",
      );
    }

    const title =
      field(
        form,
        "title",
      );

    const summary =
      field(
        form,
        "summary",
      );

    const body =
      field(
        form,
        "body",
      );

    const kind =
      field(
        form,
        "kind",
      ) ||
      "announcement";

    const audienceRaw =
      field(
        form,
        "audiencePlan",
      );

    const audiencePlan =
      audienceRaw === "STARTER" ||
      audienceRaw === "SAAS" ||
      audienceRaw === "BUSINESS"
        ? audienceRaw
        : null;

    if (!title) {
      throw new Error(
        "Title is required.",
      );
    }

    if (!summary) {
      throw new Error(
        "Summary is required.",
      );
    }

    if (!body) {
      throw new Error(
        "Body is required.",
      );
    }

    if (id) {
      await prisma
        .saasAnnouncement
        .update({
          where: {
            id,
          },

          data: {
            title,
            summary,
            body,
            kind,
            audiencePlan,
          },
        });

      return redirect(
        request,
        "saved",
      );
    }

    await prisma
      .saasAnnouncement
      .create({
        data: {
          title,
          summary,
          body,
          kind,
          audiencePlan,
          published:
            false,
        },
      });

    return redirect(
      request,
      "created",
    );
  } catch (error) {
    console.error(
      "[HUB UPDATES]",
      error,
    );

    return redirect(
      request,
      error instanceof Error
        ? `error:${error.message}`
        : "error",
    );
  }
}
