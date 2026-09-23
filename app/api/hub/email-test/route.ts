import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirectTo } from "@/lib/redirect";
import { getSmtpTransporter } from "@/lib/smtp";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();

  if (!session) {
    return redirectTo("/hub/login");
  }

  try {
    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    const senderName = settings?.senderName?.trim() || "Staark Inc.";
    const senderEmail =
      settings?.senderEmail?.trim().toLowerCase() ||
      process.env.HUB_FROM_EMAIL ||
      "contact@staarkinc.com";
    const replyToEmail =
      settings?.replyToEmail?.trim().toLowerCase() || senderEmail;

    const transporter = await getSmtpTransporter();

    try {
      await transporter.sendMail({
        from: {
          name: senderName,
          address: senderEmail,
        },
        to: replyToEmail,
        subject: "Staark Hub email test",
        text: [
          "Staark Hub email delivery test.",
          "",
          `Sender: ${senderName} <${senderEmail}>`,
          `Reply-To: ${replyToEmail}`,
          "",
          "If this message arrived correctly, the configured outbound relay is working.",
        ].join("\n"),
      });
    } finally {
      transporter.close();
    }

    return redirectTo("/hub/settings?tab=email&test=success");
  } catch (error) {
    console.error("Email test failed:", error);
    return redirectTo("/hub/settings?tab=email&test=error");
  }
}
