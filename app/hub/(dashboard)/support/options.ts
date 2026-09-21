import { prisma } from "@/lib/prisma";
import type { SupportOptions } from "./SupportForm";

export async function getSupportOptions(): Promise<SupportOptions> {
  const [clients, projects, threads] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.project.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, name: true, clientId: true, threadId: true } }),
    prisma.thread.findMany({
      where: {
        OR: [
          { contact: { clients: { some: {} } } },
          { projects: { some: {} } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        subject: true,
        contact: { select: { clients: { select: { id: true } } } },
        projects: { select: { clientId: true } },
      },
      take: 300,
    }),
  ]);

  return {
    clients,
    projects,
    threads: threads.map((thread) => ({
      id: thread.id,
      subject: thread.subject,
      clientIds: [...new Set([
        ...(thread.contact?.clients.map((client) => client.id) ?? []),
        ...thread.projects.map((project) => project.clientId),
      ])],
    })),
  };
}
