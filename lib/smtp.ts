import dns from "node:dns/promises";
import nodemailer from "nodemailer";

const SMTP_HOST =
  process.env.SMTP_HOST ??
  "smtp-relay.gmail.com";

const SMTP_PORT =
  Number(process.env.SMTP_PORT ?? "587");

const SMTP_USER = process.env.SMTP_USER;

const SMTP_PASSWORD =
  process.env.SMTP_PASSWORD ??
  process.env.SMTP_PASS;

async function createSmtpTransporter() {
  const ipv4Addresses =
    await dns.resolve4(SMTP_HOST);

  const smtpIpv4 =
    ipv4Addresses[0];

  if (!smtpIpv4) {
    throw new Error(
      `Could not resolve IPv4 for ${SMTP_HOST}`
    );
  }

  console.log(
    `[SMTP] Connecting to ${SMTP_HOST} via IPv4 ${smtpIpv4}`
  );

  return nodemailer.createTransport({
    /*
     * Connect directly over IPv4.
     */
    host: smtpIpv4,

    port: SMTP_PORT,

    /*
     * Port 587 + STARTTLS.
     */
    secure: false,
    requireTLS: true,

    /*
     * EHLO/HELO hostname.
     */
    name: "staarkinc.com",

    /*
     * Even though we connect to an IP,
     * TLS must validate Google's hostname.
     */
    tls: {
      servername: SMTP_HOST,
    },

    /*
     * smtp-relay.gmail.com authorises by IP, while
     * smtp.gmail.com requires an app password.
     */
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
  const transporter =
    await createSmtpTransporter();

  await transporter.verify();

  console.log(
    "[SMTP] Google Workspace relay verified successfully"
  );

  transporter.close();

  return true;
}

export async function getSmtpTransporter() {
  return createSmtpTransporter();
}