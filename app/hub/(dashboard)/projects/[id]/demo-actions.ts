"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import {
  deployDemo,
  startDemo,
  stopDemo,
  removeDemo,
} from "@/lib/demo-manager";

async function requireAdmin() {
  const session = await getSession();

  if (
    !session ||
    session.role !== "ADMIN"
  ) {
    throw new Error("Unauthorized");
  }
}

function validSlug(value: string) {
  return /^[a-z0-9][a-z0-9-]{0,62}$/.test(
    value
  );
}

export async function saveDemoConfig(
  projectId: string,
  formData: FormData
) {
  await requireAdmin();

  const slug = String(
    formData.get("slug") || ""
  )
    .trim()
    .toLowerCase();

  // const image = String(
  //   formData.get("image") || ""
  // ).trim();

  const port = Number(
    formData.get("port") || 3000
  );

  if (!validSlug(slug)) {
    throw new Error("Invalid demo slug");
  }

  let image = String(
    formData.get("image") || ""
  )
    .trim()
    .replace(/^https?:\/\//, "")
    .toLowerCase();

  if (
    !/^ghcr\.io\/staark-inc\/[a-z0-9._/-]+(?::[a-z0-9._-]+)?$/.test(
      image
    )
  ) {
    throw new Error(
      `Invalid GHCR image: ${image}`
    );
  }

  if (
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error("Invalid port");
  }

  await prisma.demoDeployment.upsert({
    where: {
      projectId,
    },

    create: {
      projectId,
      slug,
      image,
      port,
    },

    update: {
      slug,
      image,
      port,
    },
  });

  revalidatePath(
    `/hub/projects/${projectId}`
  );
}

export async function deployProjectDemo(
  projectId: string
) {
  await requireAdmin();

  const demo =
    await prisma.demoDeployment.findUnique({
      where: {
        projectId,
      },
    });

  if (!demo) {
    throw new Error(
      "Demo configuration not found"
    );
  }

  await deployDemo({
    slug: demo.slug,
    image: demo.image,
    port: demo.port,
  });

  await prisma.demoDeployment.update({
    where: {
      id: demo.id,
    },
    data: {
      lastDeployedAt: new Date(),
    },
  });

  revalidatePath(
    `/hub/projects/${projectId}`
  );
}

export async function startProjectDemo(
  projectId: string
) {
  await requireAdmin();

  const demo =
    await prisma.demoDeployment.findUnique({
      where: { projectId },
    });

  if (!demo) return;

  await startDemo(demo.slug);

  revalidatePath(
    `/hub/projects/${projectId}`
  );
}

export async function stopProjectDemo(
  projectId: string
) {
  await requireAdmin();

  const demo =
    await prisma.demoDeployment.findUnique({
      where: { projectId },
    });

  if (!demo) return;

  await stopDemo(demo.slug);

  revalidatePath(
    `/hub/projects/${projectId}`
  );
}

export async function updateDemoConfig(
  projectId: string,
  formData: FormData
) {
  await requireAdmin();

  const current =
    await prisma.demoDeployment.findUnique({
      where: { projectId },
      select: { slug: true },
    });

  const nextSlug = String(
    formData.get("slug") || ""
  )
    .trim()
    .toLowerCase();

  if (
    current &&
    current.slug !== nextSlug
  ) {
    try {
      await removeDemo(current.slug);
    } catch (error) {
      console.warn(
        `[HUB] Could not remove old demo container "${current.slug}":`,
        error
      );
    }
  }

  await saveDemoConfig(
    projectId,
    formData
  );
}

export async function deleteProjectDemo(
  projectId: string
) {
  await requireAdmin();

  const demo =
    await prisma.demoDeployment.findUnique({
      where: { projectId },
    });

  if (!demo) return;

  try {
    await removeDemo(demo.slug);
  } catch (error) {
    console.warn(
      `[HUB] Could not remove demo container "${demo.slug}":`,
      error
    );
  }

  await prisma.demoDeployment.delete({
    where: { projectId },
  });

  revalidatePath(
    `/hub/projects/${projectId}`
  );
}

