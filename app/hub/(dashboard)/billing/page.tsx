import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CalendarDays,
  CreditCard,
  FileText,
  Repeat2,
} from "lucide-react";

export default function BillingPage() {
  return (
    <main className="mx-auto w-full max-w-[1180px] px-6 py-10 lg:px-10">
      <div className="mb-9">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Staark Hub / Operations
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          Billing
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Track website payments, hosting plans and upcoming renewals.
        </p>
      </div>

      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Repeat2 size={19} />}
          label="Active subscriptions"
          value="0"
          detail="Recurring hosting and support"
        />
        <StatCard
          icon={<CalendarDays size={19} />}
          label="Included periods"
          value="0"
          detail="Awaiting first billing date"
        />
        <StatCard
          icon={<CreditCard size={19} />}
          label="Payments needing attention"
          value="0"
          detail="Failed or overdue payments"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">
              Client billing
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              One-time payments and recurring plans by client.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
            0 billing records
          </span>
        </div>

        <div className="flex flex-col items-center px-6 py-16 text-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <CreditCard size={25} strokeWidth={1.7} />
          </div>

          <h3 className="text-base font-semibold text-slate-950">
            No billing records yet
          </h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            Once an offer is accepted, you will be able to follow its website
            payment and hosting subscription here.
          </p>

          <Link
            href="/hub/offers"
            style={{ color: "white", fontSize: "13px" }}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 font-medium transition hover:bg-slate-800"
          >
            <FileText size={16} />
            View offers
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-950">
          Planned billing flow
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          The subscription starts only under the terms agreed with the client.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <FlowStep
            number="01"
            title="Offer accepted"
            description="Confirm the scope, one-time price and monthly terms."
          />
          <FlowStep
            number="02"
            title="Website launched"
            description="Set the launch date and calculate the included period."
          />
          <FlowStep
            number="03"
            title="Recurring billing"
            description="Follow payments after the included period ends."
          />
        </div>
      </section>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </span>
      </div>
      <strong className="mt-2 block text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </strong>
      <span className="mt-1 block text-xs text-slate-500">{detail}</span>
    </div>
  );
}

function FlowStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <span className="text-xs font-semibold text-slate-400">{number}</span>
      <h3 className="mt-4 text-sm font-semibold text-slate-950">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}