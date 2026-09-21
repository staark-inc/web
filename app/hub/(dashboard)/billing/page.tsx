import Link from "next/link";
import {
  AlertCircle,
  CalendarClock,
  CreditCard,
  FileText,
  Rocket,
  RefreshCw,
} from "lucide-react";

export const dynamic = "force-dynamic";

const workflow = [
  {
    number: "01",
    title: "Offer accepted",
    description:
      "Confirm the scope, one-time price and monthly terms.",
    icon: <FileText size={17} />,
  },
  {
    number: "02",
    title: "Website launched",
    description:
      "Set the launch date and calculate the included period.",
    icon: <Rocket size={17} />,
  },
  {
    number: "03",
    title: "Recurring billing",
    description:
      "Follow payments after the included period ends.",
    icon: <RefreshCw size={17} />,
  },
];

export default function BillingPage() {
  return (
    <div className="hub-page">
      <div className="hub-page-header">
        <div>
          <h1>Billing</h1>

          <p>
            Track website payments, hosting plans and
            upcoming renewals.
          </p>
        </div>
      </div>

      <section className="hub-client-stats">
        <div className="hub-client-stat">
          <span className="hub-client-stat-label">
            <CreditCard size={16} />
            Active subscriptions
          </span>

          <strong>0</strong>

          <small>Recurring hosting and support</small>
        </div>

        <div className="hub-client-stat">
          <span className="hub-client-stat-label">
            <CalendarClock size={16} />
            Included periods
          </span>

          <strong>0</strong>

          <small>Awaiting first billing date</small>
        </div>

        <div className="hub-client-stat">
          <span className="hub-client-stat-label">
            <AlertCircle size={16} />
            Payments needing attention
          </span>

          <strong>0</strong>

          <small>Failed or overdue payments</small>
        </div>
      </section>

      <section className="hub-list-section">
        <div className="hub-list-section-header">
          <div>
            <h2>Client billing</h2>

            <p>
              One-time payments and recurring plans by client.
            </p>
          </div>

          <span className="hub-list-count">0 billing records</span>
        </div>

        <div className="hub-empty-state">
          <CreditCard size={28} />

          <h2>No billing records yet</h2>

          <p>
            Once an offer is accepted, you will be able to follow
            its website payment and hosting subscription here.
          </p>

          <Link href="/hub/offers" className="hub-secondary-button">
            <FileText size={15} />
            View offers
          </Link>
        </div>
      </section>

      <section className="hub-client-panel">
        <h2>Planned billing flow</h2>

        <p className="hub-client-empty">
          The subscription starts only under the terms agreed
          with the client.
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
