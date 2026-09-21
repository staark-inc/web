import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Inbox,
  LifeBuoy,
  MessageSquare,
  Timer,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function SupportPage() {
  return (
    <div className="hub-page">
      <div className="hub-page-header">
        <div>
          <h1>Support</h1>

          <p>
            Keep client requests connected to conversations
            and projects.
          </p>
        </div>
      </div>

      <section className="hub-client-stats">
        <div className="hub-client-stat">
          <span className="hub-client-stat-label">
            <LifeBuoy size={16} />
            Open requests
          </span>

          <strong>0</strong>

          <small>Need action from your team</small>
        </div>

        <div className="hub-client-stat">
          <span className="hub-client-stat-label">
            <Clock3 size={16} />
            Waiting on client
          </span>

          <strong>0</strong>

          <small>Awaiting a reply or materials</small>
        </div>

        <div className="hub-client-stat">
          <span className="hub-client-stat-label">
            <CheckCircle2 size={16} />
            Resolved
          </span>

          <strong>0</strong>

          <small>Completed support requests</small>
        </div>
      </section>

      <section className="hub-list-section">
        <div className="hub-list-section-header">
          <div>
            <h2>Support requests</h2>

            <p>
              Requests will be linked to a client, project
              and conversation.
            </p>
          </div>

          <span className="hub-list-count">0 requests</span>
        </div>

        <div className="hub-empty-state">
          <LifeBuoy size={28} />

          <h2>No support requests yet</h2>

          <p>
            When a client asks for a change or reports an issue,
            you will be able to track its status and the work
            done from here.
          </p>

          <Link href="/hub/inbox" className="hub-secondary-button">
            <Inbox size={15} />
            Open inbox
          </Link>
        </div>
      </section>

      <section className="hub-client-detail-grid">
        <div className="hub-client-panel">
          <h2>
            <MessageSquare size={16} />
            From conversation to request
          </h2>

          <p className="hub-client-empty">
            A client email in Inbox can become a support request
            linked to its project. The original conversation stays
            available for context.
          </p>
        </div>

        <div className="hub-client-panel">
          <h2>
            <Timer size={16} />
            Work and plan coverage
          </h2>

          <p className="hub-client-empty">
            Track time spent and check whether the request is
            included in the client&rsquo;s agreement or needs a
            separate offer.
          </p>
        </div>
      </section>
    </div>
  );
}
