import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { name?: unknown; email?: unknown; message?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!name || name.length > 120 || !emailPattern.test(email) || email.length > 320 || !message || message.length > 5000) {
      return NextResponse.json({ error: "Kontrollera namn, e-post och meddelande." }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: requiredEnv("SMTP_HOST"),
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: requiredEnv("SMTP_USER"), pass: requiredEnv("SMTP_PASSWORD") },
    });

    const to = requiredEnv("CONTACT_TO_EMAIL");
    const from = process.env.CONTACT_FROM_EMAIL ?? requiredEnv("SMTP_USER");
    await transporter.sendMail({
      from,
      to,
      replyTo: email,
      subject: `Nytt kontaktmeddelande från ${name}`,
      text: `Namn: ${name}\nE-post: ${email}\n\n${message}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Contact form delivery failed", error);
    return NextResponse.json({ error: "Meddelandet kunde inte skickas just nu." }, { status: 500 });
  }
}
