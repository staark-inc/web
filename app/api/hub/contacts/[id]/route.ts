import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirectTo } from "@/lib/redirect";

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const session = await getSession();

  if (!session) {
    return redirectTo(
      "/hub/login"
    );
  }

  const { id } = await params;

  try {
    const formData =
      await request.formData();

    const name = String(
      formData.get("name") ?? ""
    ).trim();

    const email = String(
      formData.get("email") ?? ""
    )
      .trim()
      .toLowerCase();

    const phone = String(
      formData.get("phone") ?? ""
    ).trim();

    const company = String(
      formData.get("company") ?? ""
    ).trim();

    if (
      !name ||
      name.length > 120 ||
      !emailPattern.test(email) ||
      email.length > 320
    ) {
      return redirectTo(
        `/hub/contacts/${id}/edit?error=invalid`
      );
    }

    const existingContact =
      await prisma.contact.findFirst({
        where: {
          email,
          NOT: {
            id,
          },
        },
      });

    if (existingContact) {
      return redirectTo(
        `/hub/contacts/${id}/edit?error=email_exists`
      );
    }

    await prisma.contact.update({
      where: {
        id,
      },
      data: {
        name,
        email,
        phone: phone || null,
        company: company || null,
      },
    });

    return redirectTo(
      `/hub/contacts/${id}?updated=1`
    );
  } catch (error) {
    console.error(
      "Contact update failed:",
      error
    );

    return redirectTo(
      `/hub/contacts/${id}/edit?error=server`
    );
  }
}