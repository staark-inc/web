import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Reply } from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
  publishCurrentBadges,
} from "@/lib/realtime";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Stockholm",
  }).format(date);
}

export default async function MessagePage({ params }: PageProps) {
  const { id } = await params;

  const message = await prisma.message.findUnique({
    where: {
      id,
    },
  });

  if (!message || message.direction !== "INBOUND") {
    notFound();
  }

  // Markera meddelandet som läst
  if (!message.isRead) {
    await prisma.message.update({
      where: {
        id: message.id,
      },
      data: {
        isRead: true,
      },
    });

    await publishCurrentBadges();
  }

  return (
    <div className="hub-page">
      <div className="hub-message-actions">
        <Link href="/hub" className="hub-back-button">
          <ArrowLeft size={17} />
          Inbox
        </Link>

        <Link
          href={`/hub/compose?replyTo=${encodeURIComponent(
            message.fromEmail
          )}&subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
          className="hub-primary-button"
        >
          <Reply size={17} />
          Reply
        </Link>
      </div>

      <article className="hub-message-card">
        <header className="hub-message-header">
          <div className="hub-message-icon">
            <Mail size={20} />
          </div>

          <div>
            <span className="hub-eyebrow">INCOMING MESSAGE</span>

            <h1>{message.subject}</h1>
          </div>
        </header>

        <div className="hub-message-meta">
          <div>
            <span>From</span>
            <strong>
              {message.fromName || message.fromEmail}
            </strong>
            <a href={`mailto:${message.fromEmail}`}>
              {message.fromEmail}
            </a>
          </div>

          <div>
            <span>Received</span>
            <strong>{formatDate(message.createdAt)}</strong>
          </div>
        </div>

        <div className="hub-message-content">
          {message.body.split("\n").map((line, index) => (
            <p key={index}>{line || "\u00A0"}</p>
          ))}
        </div>
      </article>
    </div>
  );
}