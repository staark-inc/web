import dns from "node:dns/promises";
import nodemailer from "nodemailer";

import { prisma } from "@/lib/prisma";

const SMTP_HOST = process.env.SMTP_HOST ?? "smtp-relay.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT ?? "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD ?? process.env.SMTP_PASS;

async function createSmtpTransporter() {
  const ipv4Addresses = await dns.resolve4(SMTP_HOST);
  const smtpIpv4 = ipv4Addresses[0];

  if (!smtpIpv4) {
    throw new Error(`Could not resolve IPv4 for ${SMTP_HOST}`);
  }

  console.log(`[SMTP] Connecting to ${SMTP_HOST} via IPv4 ${smtpIpv4}`);

  return nodemailer.createTransport({
    host: smtpIpv4,
    port: SMTP_PORT,
    secure: false,
    requireTLS: true,
    name: "staarkinc.com",
    tls: {
      servername: SMTP_HOST,
    },
    ...(SMTP_USER && SMTP_PASSWORD
      ? {
          auth: {
            user: SMTP_USER,
            pass: SMTP_PASSWORD,
          },
        }
      : {}),
  });
}

export async function verifySmtpConnection() {
  const transporter = await createSmtpTransporter();

  await transporter.verify();

  console.log("[SMTP] Google Workspace relay verified successfully");

  transporter.close();

  return true;
}

export async function getSmtpTransporter() {
  const transporter = await createSmtpTransporter();
  const settings = await prisma.settings.findUnique({
    where: { id: "default" },
    select: {
      senderName: true,
      replyToEmail: true,
    },
  });

  const replyToEmail = settings?.replyToEmail?.trim().toLowerCase() || null;
  const replyToName = settings?.senderName?.trim() || "Staark Inc.";

  return {
    verify: () => transporter.verify(),
    close: () => transporter.close(),
    sendMail: (options: Parameters<typeof transporter.sendMail>[0]) =>
      transporter.sendMail(
        replyToEmail
          ? {
              ...options,
              replyTo: {
                name: replyToName,
                address: replyToEmail,
              },
            }
          : options
      ),
  };
}
