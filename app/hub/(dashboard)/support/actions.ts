"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type {
  SupportCategory,
  SupportCoverage,
  SupportPriority,
  SupportStatus,
} from "@/generated/prisma/client";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SupportActionState = { error: string | null; success: boolean };

const statuses: SupportStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_CLIENT", "RESOLVED"];
const coverages: SupportCoverage[] = ["UNASSESSED", "INCLUDED", "EXTRA"];
const categories: SupportCategory[] = ["WEBSITE", "HOSTING", "EMAIL", "BUG", "CHANGE", "OTHER"];
const priorities: SupportPriority[] = ["NORMAL", "URGENT"];

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") throw new Error("Unauthorized");
}

function field(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function readRequest(data: FormData, { requireClient }: { requireClient: boolean }) {
  const clientId = field(data, "clientId") || null;
  const projectId = field(data, "projectId") || null;
  const threadId = field(data, "threadId") || null;
  const title = field(data, "title");
  const description = field(data, "description");
  const internalNotes = field(data, "internalNotes");
  const timeValue = field(data, "timeSpentMinutes");
  const timeSpentMinutes = Number(timeValue);
  const status = field(data, "status") as SupportStatus;
  const coverage = field(data, "coverage") as SupportCoverage;
  const category = field(data, "category") as SupportCategory;
  const priority = field(data, "priority") as SupportPriority;

  if (title.length < 2 || title.length > 160) return { error: "Title must be between 2 and 160 characters." } as const;
  if (description.length > 10000 || internalNotes.length > 10000) return { error: "Description or notes are too long." } as const;
  if (!statuses.includes(status) || !coverages.includes(coverage)) return { error: "Choose a valid status and coverage." } as const;
  if (!categories.includes(category) || !priorities.includes(priority)) return { error: "Choose a valid category and priority." } as const;
  if (!/^\d+$/.test(timeValue) || !Number.isSafeInteger(timeSpentMinutes) || timeSpentMinutes > 600000) {
    return { error: "Time must be between 0 and 600000 minutes." } as const;
  }

  if (requireClient && !clientId) return { error: "Select an existing client." } as const;

  if (clientId) {
    const client = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
    if (!client) return { error: "Select an existing client." } as const;
  }

  if (!clientId && (projectId || threadId)) {
    return { error: "Link a client before selecting a project or conversation." } as const;
  }

  const project = projectId && clientId
    ? await prisma.project.findFirst({ where: { id: projectId, clientId }, select: { id: true, threadId: true } })
    : null;
  if (projectId && !project) return { error: "Select a project belonging to this client." } as const;

  if (threadId && clientId) {
    const thread = await prisma.thread.findFirst({
      where: {
        id: threadId,
        OR: [
          { contact: { clients: { some: { id: clientId } } } },
          ...(project?.threadId === threadId ? [{ id: threadId }] : []),
        ],
      },
      select: { id: true },
    });
    if (!thread) return { error: "Select a conversation belonging to this client." } as const;
  }

  return {
    data: {
      clientId,
      projectId,
      threadId,
      title,
      description: description || null,
      internalNotes: internalNotes || null,
      timeSpentMinutes,
      status,
      coverage,
      category,
      priority,
    },
  } as const;
}

export async function createSupportRequest(_state: SupportActionState, formData: FormData): Promise<SupportActionState> {
  await requireAdmin();
  const result = await readRequest(formData, { requireClient: true });
  if ("error" in result) return { error: result.error ?? "Invalid request.", success: false };

  let id: string;
  try {
    const request = await prisma.supportRequest.create({
      data: {
        ...result.data,
        resolvedAt: result.data.status === "RESOLVED" ? new Date() : null,
      },
      select: { id: true },
    });
    id = request.id;
  } catch (error) {
    console.error("[HUB] Could not create support request:", error);
    return { error: "Could not create the support request.", success: false };
  }

  revalidatePath("/hub/support");
  if (result.data.clientId) revalidatePath(`/hub/clients/${result.data.clientId}`);
  if (result.data.projectId) revalidatePath(`/hub/projects/${result.data.projectId}`);
  redirect(`/hub/support/${id}`);
}

export async function updateSupportRequest(_state: SupportActionState, formData: FormData): Promise<SupportActionState> {
  await requireAdmin();
  const id = field(formData, "requestId");
  const existing = await prisma.supportRequest.findUnique({ where: { id }, select: { clientId: true, projectId: true, status: true, resolvedAt: true } });
  if (!existing) return { error: "Support request not found.", success: false };

  const result = await readRequest(formData, { requireClient: false });
  if ("error" in result) return { error: result.error ?? "Invalid request.", success: false };
  if (existing.clientId && existing.clientId !== result.data.clientId) return { error: "A support request cannot be moved to another client.", success: false };

  try {
    await prisma.supportRequest.update({
      where: { id },
      data: {
        ...result.data,
        resolvedAt: result.data.status === "RESOLVED"
          ? existing.resolvedAt ?? new Date()
          : null,
      },
    });
  } catch (error) {
    console.error("[HUB] Could not update support request:", error);
    return { error: "Could not save the support request.", success: false };
  }

  revalidatePath("/hub/support");
  revalidatePath(`/hub/support/${id}`);
  if (existing.clientId) revalidatePath(`/hub/clients/${existing.clientId}`);
  if (result.data.clientId) revalidatePath(`/hub/clients/${result.data.clientId}`);
  if (existing.projectId) revalidatePath(`/hub/projects/${existing.projectId}`);
  if (result.data.projectId) revalidatePath(`/hub/projects/${result.data.projectId}`);
  return { error: null, success: true };
}
