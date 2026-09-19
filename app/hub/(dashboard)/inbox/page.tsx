import {
  Inbox,
  RefreshCw,
  Search,
  Star,
} from "lucide-react";
import Link from "next/link";
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

export default async function HubInboxPage() {
  const emails = await prisma.message.findMany({
    where: {
      direction: "INBOUND",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const unreadCount = emails.filter((mail) => !mail.isRead).length;

  return (
    <div className="hub-page">
      <header className="hub-page-header">
        <div>
          <span className="hub-eyebrow">STAARK HUB</span>
          <h1>Inbox</h1>
          <p>Messages and enquiries from your customers.</p>
        </div>

        <Link
          href="/hub/inbox"
          className="hub-secondary-button"
          aria-label="Refresh inbox"
        >
          <RefreshCw size={17} />
          Refresh
        </Link>
      </header>

      <div className="hub-toolbar">
        <div className="hub-search">
          <Search size={17} />

          <input
            type="search"
            placeholder="Search messages..."
            aria-label="Search messages"
          />
        </div>

        <div className="hub-inbox-total">
          <Inbox size={16} />

          <span>
            {emails.length} {emails.length === 1 ? "message" : "messages"}
          </span>
        </div>
      </div>

      {emails.length === 0 ? (
        <section className="hub-empty-inbox">
          <Inbox size={28} />

          <h2>Your inbox is empty</h2>

          <p>
            New contact requests will appear here automatically.
          </p>
        </section>
      ) : (
        <section className="hub-mail-list">
          {emails.map((mail) => (
            <Link
              href={`/hub/message/${mail.id}`}
              className={`hub-mail-row ${
                !mail.isRead ? "hub-mail-unread" : ""
              }`}
              key={mail.id}
            >
              <div className="hub-mail-status">
                {!mail.isRead && (
                  <span className="hub-unread-dot" />
                )}

                <Star size={17} />
              </div>

              <div className="hub-mail-sender">
                <strong>
                  {mail.fromName || mail.fromEmail}
                </strong>

                <span>{mail.fromEmail}</span>
              </div>

              <div className="hub-mail-body">
                <strong>{mail.subject}</strong>

                <span>
                  {mail.body.length > 120
                    ? `${mail.body.slice(0, 120)}...`
                    : mail.body}
                </span>
              </div>

              <time dateTime={mail.createdAt.toISOString()}>
                {formatDate(mail.createdAt)}
              </time>
            </Link>
          ))}
        </section>
      )}

      {unreadCount > 0 && (
        <div className="hub-inbox-summary">
          {unreadCount} unread
        </div>
      )}
    </div>
  );
}