import nodemailer from "nodemailer";

function parseSecure(value: string | undefined) {
  return value === "true" || value === "1";
}

export function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const secure = parseSecure(
    process.env.SMTP_SECURE
  );
  const user = process.env.SMTP_USER;
  const password =
    process.env.SMTP_PASSWORD;

  if (
    !host ||
    !port ||
    !user ||
    !password
  ) {
    throw new Error(
      "SMTP configuration is incomplete."
    );
  }

  return {
    host,
    port,
    secure,
    user,
    password,
  };
}

export function createSmtpTransport() {
  const config = getSmtpConfig();

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,

    auth: {
      user: config.user,
      pass: config.password,
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

export async function verifySmtpConnection() {
  const transporter =
    createSmtpTransport();

  await transporter.verify();

  return {
    connected: true,
  };
}