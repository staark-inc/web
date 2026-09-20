import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    return NextResponse.redirect(
      new URL("/hub/login", request.url),
      303
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
      return NextResponse.redirect(
        new URL(
          `/hub/contacts/${id}/edit?error=invalid`,
          request.url
        ),
        303
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
      return NextResponse.redirect(
        new URL(
          `/hub/contacts/${id}/edit?error=email_exists`,
          request.url
        ),
        303
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

    return NextResponse.redirect(
      new URL(
        `/hub/contacts/${id}?updated=1`,
        request.url
      ),
      303
    );
  } catch (error) {
    console.error(
      "Contact update failed:",
      error
    );

    return NextResponse.redirect(
      new URL(
        `/hub/contacts/${id}/edit?error=server`,
        request.url
      ),
      303
    );
  }
}