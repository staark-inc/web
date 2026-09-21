import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Send,
  UsersRound,
} from "lucide-react";

export default function OffersPage() {
  return (
    <main className="mx-auto w-full max-w-[1180px] px-6 py-10 lg:px-10">
      <div className="mb-9">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Staark Hub / Work
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          Offers
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Prepare proposals and follow them from draft to client decision.
        </p>
      </div>

      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<FileText size={19} />}
          label="Drafts"
          value="0"
          detail="Being prepared"
        />
        <StatCard
          icon={<Clock3 size={19} />}
          label="Awaiting reply"
          value="0"
          detail="Sent to clients"
        />
        <StatCard
          icon={<CheckCircle2 size={19} />}
          label="Accepted"
          value="0"
          detail="Ready for project work"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">
              All offers
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              A record of what was proposed and what the client accepted.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
            0 offers
          </span>
        </div>

        <div className="flex flex-col items-center px-6 py-16 text-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <FileText size={25} strokeWidth={1.7} />
          </div>

          <h3 className="text-base font-semibold text-slate-950">
            No offers yet
          </h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            Offers will bring together the website build, optional features,
            hosting and support terms before a project begins.
          </p>

          <Link
            href="/hub/clients"
            style={{ color: "white", fontSize: "13px" }}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 font-medium transition hover:bg-slate-800"
          >
            <UsersRound size={16} />
            View clients
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-950">
          Offer workflow
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          The stages each offer will follow.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <WorkflowStep
            icon={<FileText size={18} />}
            number="01"
            title="Draft"
            description="Define the scope, one-time price and support terms."
          />
          <WorkflowStep
            icon={<Send size={18} />}
            number="02"
            title="Sent"
            description="Send the offer and keep its version with the client."
          />
          <WorkflowStep
            icon={<CheckCircle2 size={18} />}
            number="03"
            title="Decision"
            description="Record acceptance or decline before starting billing."
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

function WorkflowStep({
  icon,
  number,
  title,
  description,
}: {
  icon: ReactNode;
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center justify-between">
        <span className="flex size-9 items-center justify-center rounded-lg bg-white text-slate-700">
          {icon}
        </span>
        <span className="text-xs font-semibold text-slate-400">
          {number}
        </span>
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-950">
        {title}
      </h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}