import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
  override: true,
});

import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
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

  const rl = readline.createInterface({
    input,
    output,
  });

  try {
    console.log("\n🔐 Staark Hub - Create Admin\n");

    const name =
      (await rl.question("Name [Staark Inc.]: ")).trim() ||
      "Staark Inc.";

    const email = (
      await rl.question("Email: ")
    )
      .trim()
      .toLowerCase();

    if (!email) {
      throw new Error("Email is required.");
    }

    /*
     * Atenție:
     * readline nu ascunde parola în terminal.
     * O folosim doar în memorie și nu o salvăm în clar.
     */
    const password = await rl.question("Password: ");

    if (password.length < 8) {
      throw new Error(
        "Password must contain at least 8 characters."
      );
    }

    const confirmPassword =
      await rl.question("Confirm password: ");

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }

    console.log("\nHashing password...");

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const existingUser =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    const user = await prisma.user.upsert({
      where: {
        email,
      },

      update: {
        name,
        passwordHash,
        role: "ADMIN",
      },

      create: {
        name,
        email,
        passwordHash,
        role: "ADMIN",
      },
    });

    console.log("");

    if (existingUser) {
      console.log("✅ Administrator updated.");
    } else {
      console.log("✅ Administrator created.");
    }

    console.log(`Name:  ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role:  ${user.role}`);

    console.log(
      "\n🔒 Password stored only as bcrypt hash.\n"
    );
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("\n❌ Could not create administrator:");
  console.error(
    error instanceof Error
      ? error.message
      : error
  );

  process.exit(1);
});