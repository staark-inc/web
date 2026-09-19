import Link from "next/link";
import { ArrowLeft, Mail, UserRound } from "lucide-react";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function SentMessagePage({
  params,
}: PageProps) {
  const { id } = await params;

  const message = await prisma.message.findUnique({
    where: {
      id,
    },
  });

  if (!message || message.direction !== "OUTBOUND") {
    notFound();
  }

  const date = formatDate(
    message.sentAt ?? message.createdAt
  );

  return (
    <div className="hub-page hub-message-page">
      <header className="hub-page-header">
        <div>
          <Link
            href="/hub/sent"
            className="hub-back"
          >
            <ArrowLeft size={16} />
            Sent
          </Link>

          <h1>{message.subject}</h1>

          <p>Sent message details.</p>
        </div>
      </header>

      <article className="hub-message-card">
        <div className="hub-message-header">
          <div className="hub-message-avatar">
            <UserRound size={19} />
          </div>

          <div className="hub-message-sender">
            <strong>Staark Inc.</strong>

            <span>
              From: {message.fromEmail}
            </span>
          </div>

          <time className="hub-message-date">
            {date}
          </time>
        </div>

        <div className="hub-message-details">
          <div>
            <Mail size={15} />

            <span>To:</span>

            <strong>{message.toEmail}</strong>
          </div>
        </div>

        <div className="hub-message-body">
          {message.body}
        </div>
      </article>
    </div>
  );
}