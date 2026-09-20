import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirectTo } from "@/lib/redirect";

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
    return redirectTo("/hub/login");
  }

  const { id } = await params;

  try {
    const contact =
      await prisma.contact.findUnique({
        where: {
          id,
        },
      });

    if (!contact) {
      return redirectTo(
        "/hub/contacts?error=not_found"
      );
    }

    await prisma.contact.delete({
      where: {
        id,
      },
    });

    return redirectTo(
      "/hub/contacts?deleted=1"
    );
  } catch (error) {
    console.error(
      "Contact deletion failed:",
      error
    );

    return redirectTo(
      `/hub/contacts/${id}?error=delete_failed`
    );
  }
}