import { prisma } from "../lib/prisma";

function normalizeSubject(subject: string) {
  return subject
    .replace(/^(re|sv|fw|fwd):\s*/gi, "")
    .trim()
    .toLowerCase();
}

async function main() {
  const messages = await prisma.message.findMany({
    where: {
      threadId: null,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(
    `[BACKFILL] Found ${messages.length} messages without threadId`
  );

  const groups = new Map<
    string,
    typeof messages
  >();

  for (const message of messages) {
    const customerEmail =
      message.direction === "INBOUND"
        ? message.fromEmail.toLowerCase()
        : message.toEmail.toLowerCase();

    const normalizedSubject =
      normalizeSubject(message.subject);

    const key =
      `${customerEmail}::${normalizedSubject}`;

    const group =
      groups.get(key) ?? [];

    group.push(message);
    groups.set(key, group);
  }

  for (const [
    key,
    group,
  ] of groups) {
    if (group.length === 0) {
      continue;
    }

    const first =
      group[0];

    const last =
      group[group.length - 1];

    const customerEmail =
      first.direction === "INBOUND"
        ? first.fromEmail.toLowerCase()
        : first.toEmail.toLowerCase();

    const inbound =
      group.find(
        (message) =>
          message.direction === "INBOUND"
      );

    const contactName =
      inbound?.fromName ?? null;

    console.log(
      `[BACKFILL] ${key} (${group.length} messages)`
    );

    let contact =
      await prisma.contact.findUnique({
        where: {
          email: customerEmail,
        },
      });

    if (!contact) {
      contact =
        await prisma.contact.create({
          data: {
            email: customerEmail,
            name: contactName,
          },
        });
    }

    const cleanSubject =
      first.subject.replace(
        /^(re|sv|fw|fwd):\s*/gi,
        ""
      );

    const thread =
      await prisma.thread.create({
        data: {
          contactId: contact.id,
          subject: cleanSubject,
          createdAt: first.createdAt,
          updatedAt: last.createdAt,
        },
      });

    await prisma.message.updateMany({
      where: {
        id: {
          in: group.map(
            (message) => message.id
          ),
        },
      },

      data: {
        contactId: contact.id,
        threadId: thread.id,
      },
    });

    console.log(
      `[BACKFILL] Created thread ${thread.id}`
    );
  }

  console.log(
    "[BACKFILL] Finished successfully"
  );
}

main()
  .catch((error) => {
    console.error(
      "[BACKFILL] Failed:",
      error
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });