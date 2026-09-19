import Link from "next/link";
import { Send } from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function HubSentPage() {
  const messages = await prisma.message.findMany({
    where: {
      direction: "OUTBOUND",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="hub-page">
      <header className="hub-page-header">
        <div>
          <h1>Sent</h1>
          <p>Messages sent from Staark Hub.</p>
        </div>

        <Link
          href="/hub/compose"
          className="hub-header-action"
        >
          <Send size={16} />
          New message
        </Link>
      </header>

      <div className="hub-mail-list">
        {messages.length === 0 ? (
          <div className="hub-empty-state">
            <Send size={24} />

            <h2>No sent messages</h2>

            <p>
              Messages you send from Staark Hub will appear here.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <Link
              key={message.id}
              href={`/hub/sent/${message.id}`}
              className="hub-mail-row"
            >
              <div className="hub-mail-avatar">
                {message.toEmail.charAt(0).toUpperCase()}
              </div>

              <div className="hub-mail-content">
                <div className="hub-mail-top">
                  <strong>
                    To: {message.toEmail}
                  </strong>

                  <span>
                    {formatDate(
                      message.sentAt ?? message.createdAt
                    )}
                  </span>
                </div>

                <div className="hub-mail-subject">
                  {message.subject}
                </div>

                <p className="hub-mail-preview">
                  {message.body}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
