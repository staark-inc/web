import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FolderKanban,
  UsersRound,
} from "lucide-react";

export default function ProjectsPage() {
  return (
    <main className="mx-auto w-full max-w-[1180px] px-6 py-10 lg:px-10">
      <div className="mb-9">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          Staark Hub / Work
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          Projects
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Follow delivery, client materials and launch readiness in one place.
        </p>
      </div>

      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<FolderKanban size={19} />}
          label="Active projects"
          value="0"
          detail="Currently in progress"
        />
        <StatCard
          icon={<Clock3 size={19} />}
          label="Waiting on client"
          value="0"
          detail="Materials or approval needed"
        />
        <StatCard
          icon={<CheckCircle2 size={19} />}
          label="Completed"
          value="0"
          detail="Delivered projects"
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">
              All projects
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Track each project from proposal to launch and support.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
            0 projects
          </span>
        </div>

        <div className="flex flex-col items-center px-6 py-20 text-center">
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <FolderKanban size={25} strokeWidth={1.7} />
          </div>

          <h3 className="text-base font-semibold text-slate-950">
            No projects yet
          </h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
            When a client accepts an offer, their project will appear here
            with its status, tasks, required materials and launch date.
          </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
            href="/hub/clients"
            style={{ color: "white", fontSize: "13px" }}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 font-medium transition hover:bg-slate-800"
        >
            <UsersRound size={16} />
            View clients
            <ArrowRight size={16} />
        </Link>

        <Link
            href="/hub/projects/alex-dackservice-demo"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50"
        >
            Preview project concept
            <ArrowRight size={16} />
        </Link>
        </div>
        </div>
      </section>

      <p className="mt-5 text-xs text-slate-500" style={{ marginTop: "10px" }}>
        Next: connect projects to clients and build the individual project page.
      </p>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
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