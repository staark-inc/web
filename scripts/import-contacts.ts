import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
  override: true,
});

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Importing existing contacts...");

  const messages = await prisma.message.findMany({
    where: {
      direction: "INBOUND",
    },

    orderBy: {
      createdAt: "asc",
    },
  });

  console.log(
    `Found ${messages.length} inbound message(s).`
  );

  let created = 0;
  let existing = 0;

  for (const message of messages) {
    const email = message.fromEmail
      .trim()
      .toLowerCase();

    const current = await prisma.contact.findUnique({
      where: {
        email,
      },
    });

    if (current) {
      existing++;

      // Completează numele dacă lipsește.
      if (!current.name && message.fromName) {
        await prisma.contact.update({
          where: {
            id: current.id,
          },

          data: {
            name: message.fromName,
          },
        });
      }

      continue;
    }

    await prisma.contact.create({
      data: {
        name: message.fromName || null,
        email,
      },
    });

    created++;
  }

  console.log("");
  console.log("Import completed.");
  console.log(`Created: ${created}`);
  console.log(`Already existed: ${existing}`);

  const total = await prisma.contact.count();

  console.log(`Total contacts: ${total}`);
}

main()
  .catch((error) => {
    console.error("Import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
