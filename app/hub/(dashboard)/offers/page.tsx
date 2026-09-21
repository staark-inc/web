import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  FileText,
  Send,
  UsersRound,
} from "lucide-react";

export const dynamic = "force-dynamic";

const workflow = [
  {
    number: "01",
    title: "Draft",
    description:
      "Define the scope, one-time price and support terms.",
    icon: <FileText size={17} />,
  },
  {
    number: "02",
    title: "Sent",
    description:
      "Send the offer and keep its version with the client.",
    icon: <Send size={17} />,
  },
  {
    number: "03",
    title: "Decision",
    description:
      "Record acceptance or decline before starting billing.",
    icon: <CheckCircle2 size={17} />,
  },
];

export default function OffersPage() {
  return (
    <div className="hub-page">
      <div className="hub-page-header">
        <div>
          <h1>Offers</h1>

          <p>
            Prepare proposals and follow them from draft
            to client decision.
          </p>
        </div>
      </div>

      <section className="hub-client-stats">
        <div className="hub-client-stat">
          <span className="hub-client-stat-label">
            <FileText size={16} />
            Drafts
          </span>

          <strong>0</strong>

          <small>Being prepared</small>
        </div>

        <div className="hub-client-stat">
          <span className="hub-client-stat-label">
            <Clock3 size={16} />
            Awaiting reply
          </span>

          <strong>0</strong>

          <small>Sent to clients</small>
        </div>

        <div className="hub-client-stat">
          <span className="hub-client-stat-label">
            <CheckCircle2 size={16} />
            Accepted
          </span>

          <strong>0</strong>

          <small>Ready for project work</small>
        </div>
      </section>

      <section className="hub-list-section">
        <div className="hub-list-section-header">
          <div>
            <h2>All offers</h2>

            <p>
              A record of what was proposed and what the client
              accepted.
            </p>
          </div>

          <span className="hub-list-count">0 offers</span>
        </div>

        <div className="hub-empty-state">
          <FileText size={28} />

          <h2>No offers yet</h2>

          <p>
            Offers will bring together the website build, optional
            features, hosting and support terms before a project
            begins.
          </p>

          <Link href="/hub/clients" className="hub-secondary-button">
            <UsersRound size={15} />
            View clients
          </Link>
        </div>
      </section>

      <section className="hub-client-panel">
        <h2>Offer workflow</h2>

        <p className="hub-client-empty">
          The stages each offer will follow.
        </p>

        <div className="hub-workflow-steps">
          {workflow.map((step) => (
            <div key={step.number} className="hub-workflow-step">
              <span className="hub-workflow-icon">{step.icon}</span>

              <span className="hub-workflow-number">{step.number}</span>

              <strong>{step.title}</strong>

              <small>{step.description}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
