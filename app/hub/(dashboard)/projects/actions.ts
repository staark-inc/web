"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ProjectStatus } from "@/generated/prisma/client";

export type ProjectFormState = {
  error: string | null;
  success: boolean;
};

const STATUSES: ProjectStatus[] = [
  "PLANNING",
  "IN_PROGRESS",
  "WAITING_CLIENT",
  "REVIEW",
  "COMPLETED",
  "MAINTENANCE",
  "CANCELLED",
];

const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  IN_PROGRESS: "In progress",
  WAITING_CLIENT: "Waiting on client",
  REVIEW: "Review",
  COMPLETED: "Completed",
  MAINTENANCE: "Maintenance",
  CANCELLED: "Cancelled",
};

async function requireAdmin() {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

function readField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readDate(formData: FormData, name: string) {
  const value = readField(formData, name);

  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function readStatus(formData: FormData): ProjectStatus | null {
  const value = readField(formData, "status");
  return STATUSES.includes(value as ProjectStatus)
    ? (value as ProjectStatus)
    : null;
}

export async function createProject(
  _previousState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await requireAdmin();

  const name = readField(formData, "name");
  const clientId = readField(formData, "clientId");
  const offerId = readField(formData, "offerId") || null;

  if (name.length < 2 || name.length > 160) {
    return {
      error: "Project name must be between 2 and 160 characters.",
      success: false,
    };
  }

  if (!clientId) {
    return { error: "Select a client.", success: false };
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });

  if (!client) {
    return { error: "That client no longer exists.", success: false };
  }

  let sourceOfferTitle: string | null = null;

  if (offerId) {
    const sourceOffer = await prisma.offer.findUnique({
      where: { id: offerId },
      select: {
        id: true,
        title: true,
        clientId: true,
        status: true,
        project: { select: { id: true } },
      },
    });

    if (!sourceOffer || sourceOffer.status !== "ACCEPTED") {
      return {
        error: "The source offer is missing or has not been accepted.",
        success: false,
      };
    }

    if (sourceOffer.clientId !== clientId) {
      return {
        error: "The accepted offer belongs to another client.",
        success: false,
      };
    }

    if (sourceOffer.project) {
      return {
        error: "A project has already been created from this offer.",
        success: false,
      };
    }

    sourceOfferTitle = sourceOffer.title;
  }

  let projectId: string;

  try {
    const project = await prisma.project.create({
      data: {
        name,
        clientId,
        offerId,
        description: readField(formData, "description") || null,
        status: readStatus(formData) ?? "PLANNING",
        budget: readField(formData, "budget") || null,
        liveUrl: readField(formData, "liveUrl") || null,
        startedAt: readDate(formData, "startedAt"),
        dueAt: readDate(formData, "dueAt"),
        activities: sourceOfferTitle
          ? {
              create: {
                kind: "NOTE",
                title: "Project created from accepted offer",
                detail: sourceOfferTitle,
              },
            }
          : undefined,
      },
      select: { id: true },
    });

    projectId = project.id;
  } catch (error) {
    console.error("[HUB] Could not create project:", error);
    return { error: "Could not create the project.", success: false };
  }

  revalidatePath("/hub/projects");
  revalidatePath(`/hub/clients/${clientId}`);

  if (offerId) {
    revalidatePath(`/hub/offers/${offerId}`);
  }

  redirect(`/hub/projects/${projectId}`);
}

export async function updateProject(
  _previousState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await requireAdmin();

  const projectId = readField(formData, "projectId");
  const name = readField(formData, "name");
  const clientId = readField(formData, "clientId");

  if (!projectId) {
    return { error: "Missing project.", success: false };
  }

  if (name.length < 2 || name.length > 160) {
    return {
      error: "Project name must be between 2 and 160 characters.",
      success: false,
    };
  }

  if (!clientId) {
    return { error: "Select a client.", success: false };
  }

  const nextStatus = readStatus(formData);

  try {
    const before = await prisma.project.findUnique({
      where: { id: projectId },
      select: { status: true },
    });

    await prisma.project.update({
      where: { id: projectId },
      data: {
        name,
        clientId,
        description: readField(formData, "description") || null,
        status: nextStatus ?? undefined,
        budget: readField(formData, "budget") || null,
        liveUrl: readField(formData, "liveUrl") || null,
        startedAt: readDate(formData, "startedAt"),
        dueAt: readDate(formData, "dueAt"),
      },
    });

    if (nextStatus && before && before.status !== nextStatus) {
      await logActivity(
        projectId,
        "STATUS_CHANGED",
        `Status changed to ${STATUS_LABELS[nextStatus]}`
      );
    }
  } catch (error) {
    console.error("[HUB] Could not update project:", error);
    return { error: "Could not save the project.", success: false };
  }

  revalidatePath("/hub/projects");
  revalidatePath(`/hub/projects/${projectId}`);

  return { error: null, success: true };
}

async function logActivity(
  projectId: string,
  kind: "NOTE" | "STATUS_CHANGED" | "TASK_COMPLETED" | "MATERIAL_RECEIVED",
  title: string,
  detail?: string
) {
  await prisma.projectActivity.create({
    data: { projectId, kind, title, detail: detail ?? null },
  });
}

export async function setProjectStatus(formData: FormData) {
  await requireAdmin();

  const projectId = readField(formData, "projectId");
  const nextStatus = readStatus(formData);

  if (!projectId || !nextStatus) return;

  const before = await prisma.project.findUnique({
    where: { id: projectId },
    select: { status: true },
  });

  if (!before || before.status === nextStatus) return;

  await prisma.project.update({
    where: { id: projectId },
    data: { status: nextStatus },
  });

  await logActivity(
    projectId,
    "STATUS_CHANGED",
    `Status changed to ${STATUS_LABELS[nextStatus]}`
  );

  revalidatePath("/hub/projects");
  revalidatePath(`/hub/projects/${projectId}`);
}

export async function addMaterial(formData: FormData) {
  await requireAdmin();

  const projectId = readField(formData, "projectId");
  const name = readField(formData, "name");

  if (!projectId || !name || name.length > 200) {
    return;
  }

  const last = await prisma.projectMaterial.findFirst({
    where: { projectId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.projectMaterial.create({
    data: {
      projectId,
      name,
      position: (last?.position ?? 0) + 1,
    },
  });

  revalidatePath(`/hub/projects/${projectId}`);
}

export async function cycleMaterial(formData: FormData) {
  await requireAdmin();

  const materialId = readField(formData, "materialId");

  if (!materialId) return;

  const material = await prisma.projectMaterial.findUnique({
    where: { id: materialId },
    select: { status: true, projectId: true, name: true },
  });

  if (!material) return;

  /* AWAITING -> RECEIVED -> NOT_NEEDED -> AWAITING */
  const nextStatus =
    material.status === "AWAITING"
      ? "RECEIVED"
      : material.status === "RECEIVED"
        ? "NOT_NEEDED"
        : "AWAITING";

  await prisma.projectMaterial.update({
    where: { id: materialId },
    data: {
      status: nextStatus,
      receivedAt: nextStatus === "RECEIVED" ? new Date() : null,
    },
  });

  if (nextStatus === "RECEIVED") {
    await logActivity(
      material.projectId,
      "MATERIAL_RECEIVED",
      `Received: ${material.name}`
    );
  }

  revalidatePath(`/hub/projects/${material.projectId}`);
}

export async function deleteMaterial(formData: FormData) {
  await requireAdmin();

  const materialId = readField(formData, "materialId");

  if (!materialId) return;

  const material = await prisma.projectMaterial.findUnique({
    where: { id: materialId },
    select: { projectId: true },
  });

  if (!material) return;

  await prisma.projectMaterial.delete({ where: { id: materialId } });

  revalidatePath(`/hub/projects/${material.projectId}`);
}

export async function addNote(formData: FormData) {
  await requireAdmin();

  const projectId = readField(formData, "projectId");
  const title = readField(formData, "title");

  if (!projectId || !title || title.length > 300) {
    return;
  }

  await logActivity(projectId, "NOTE", title);

  revalidatePath(`/hub/projects/${projectId}`);
}

export async function linkThread(formData: FormData) {
  await requireAdmin();

  const projectId = readField(formData, "projectId");
  const threadId = readField(formData, "threadId");

  if (!projectId) return;

  await prisma.project.update({
    where: { id: projectId },
    data: { threadId: threadId || null },
  });

  revalidatePath(`/hub/projects/${projectId}`);
}

export async function addTask(formData: FormData) {
  await requireAdmin();

  const projectId = readField(formData, "projectId");
  const title = readField(formData, "title");

  if (!projectId || !title || title.length > 300) {
    return;
  }

  const last = await prisma.projectTask.findFirst({
    where: { projectId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  await prisma.projectTask.create({
    data: {
      projectId,
      title,
      position: (last?.position ?? 0) + 1,
    },
  });

  revalidatePath(`/hub/projects/${projectId}`);
}

export async function toggleTask(formData: FormData) {
  await requireAdmin();

  const taskId = readField(formData, "taskId");

  if (!taskId) return;

  const task = await prisma.projectTask.findUnique({
    where: { id: taskId },
    select: { done: true, projectId: true, title: true },
  });

  if (!task) return;

  await prisma.projectTask.update({
    where: { id: taskId },
    data: {
      done: !task.done,
      completedAt: task.done ? null : new Date(),
    },
  });

  if (!task.done) {
    await logActivity(
      task.projectId,
      "TASK_COMPLETED",
      `Completed: ${task.title}`
    );
  }

  revalidatePath(`/hub/projects/${task.projectId}`);
}

export async function deleteTask(formData: FormData) {
  await requireAdmin();

  const taskId = readField(formData, "taskId");

  if (!taskId) return;

  const task = await prisma.projectTask.findUnique({
    where: { id: taskId },
    select: { projectId: true },
  });

  if (!task) return;

  await prisma.projectTask.delete({ where: { id: taskId } });

  revalidatePath(`/hub/projects/${task.projectId}`);
}
