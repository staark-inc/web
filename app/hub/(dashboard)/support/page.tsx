import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Inbox,
  LifeBuoy,
  MessageSquareText,
} from "lucide-react";

export default function SupportPage() {
  return (
    <main className="mx-auto w-full max-w-[1180px] px-6 py-10 lg:px-10">
      <div className="mb-9">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Staark Hub / Operations
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          Support
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Keep client requests connected to conversations and projects.
        </p>
      </div>

      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<LifeBuoy size={19} />}
          label="Open requests"
          value="0"
          detail="Need action from your team"
        />
        <StatCard
          icon={<Clock3 size={19} />}
          label="Waiting on client"
          value="0"
          detail="Awaiting a reply or materials"
        />
        <StatCard
          icon={<CheckCircle2 size={19} />}
          label="Resolved"
          value="0"
          detail="Completed support requests"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">
              Support requests
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Requests will be linked to a client, project and conversation.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
            0 requests
          </span>
        </div>

        <div className="flex flex-col items-center px-6 py-16 text-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <MessageSquareText size={25} strokeWidth={1.7} />
          </div>

          <h3 className="text-base font-semibold text-slate-950">
            No support requests yet
          </h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            When a client asks for a change or reports an issue, you will be
            able to track its status and the work done from here.
          </p>

          <Link
            href="/hub/inbox"
            style={{ color: "white", fontSize: "13px" }}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 font-medium transition hover:bg-slate-800"
          >
            <Inbox size={16} />
            Open inbox
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <InfoCard
          title="From conversation to request"
          description="A client email in Inbox can become a support request linked to its project. The original conversation stays available for context."
        />
        <InfoCard
          title="Work and plan coverage"
          description="Track time spent and check whether the request is included in the client's agreement or needs a separate offer."
        />
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

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-xs leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}