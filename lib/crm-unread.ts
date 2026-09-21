import { isAutomatedSender } from "@/lib/crm-mail";
import { prisma } from "@/lib/prisma";

export async function getCustomerUnreadCount() {
  const messages = await prisma.message.findMany({
    where: { direction: "INBOUND", isRead: false },
    select: { fromEmail: true },
  });

  return messages.filter(
    (message) =>
      !isAutomatedSender(message.fromEmail, process.env.CRM_BLOCKED_SENDERS)
  ).length;
}
