import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Circle,
  FileText,
  FolderKanban,
  ImageIcon,
  MapPin,
} from "lucide-react";

const demoProject = {
  id: "alex-dackservice-demo",
  name: "Alex Däckservice",
  type: "Website concept",
  location: "Vaggeryd, Sweden",
  status: "Proposal",
  tasks: [
    { title: "Prepare website concept", done: true },
    { title: "Present the concept to Alex", done: false },
    { title: "Confirm services and booking workflow", done: false },
    { title: "Agree on scope and launch plan", done: false },
  ],
  materials: [
    "Original logo",
    "Service photos",
    "Confirmed services and prices",
    "Google Business Profile and service area",
  ],
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Până conectăm Prisma, există doar această previzualizare.
  if (id !== demoProject.id) notFound();

  const completed = demoProject.tasks.filter((task) => task.done).length;

  return (
    <main className="mx-auto w-full max-w-[1180px] px-6 py-10 lg:px-10">
      <Link
        href="/hub/projects"
        className="mb-7 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft size={16} />
        Projects
      </Link>

      <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            Project / Internal concept
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
            {demoProject.name}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {demoProject.type} · {demoProject.location}
          </p>
        </div>

        <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
          {demoProject.status}
        </span>
      </div>

      <div className="mb-7 rounded-xl border border-blue-100 bg-blue-50/70 px-5 py-4 text-sm text-blue-900">
        This is an internal concept. Scope, price and launch date still need
        to be agreed with the client.
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          icon={<CheckCircle2 size={18} />}
          label="Tasks completed"
          value={`${completed} of ${demoProject.tasks.length}`}
          detail="Next: present the concept"
        />
        <SummaryCard
          icon={<ImageIcon size={18} />}
          label="Client materials"
          value={`0 of ${demoProject.materials.length}`}
          detail="Waiting for approved assets"
        />
        <SummaryCard
          icon={<CalendarDays size={18} />}
          label="Launch date"
          value="Not scheduled"
          detail="Set after client approval"
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <SectionHeading
              title="Project tasks"
              detail={`${completed} / ${demoProject.tasks.length} complete`}
            />

            <div className="px-5 py-2">
              {demoProject.tasks.map((task) => (
                <div
                  key={task.title}
                  className="flex items-center gap-3 border-b border-slate-100 py-4 text-sm last:border-0"
                >
                  {task.done ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : (
                    <Circle size={18} className="text-slate-300" />
                  )}
                  <span className={task.done ? "text-slate-500" : "text-slate-800"}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <SectionHeading title="Activity" detail="Internal timeline" />
            <div className="px-5 py-5">
              <div className="flex gap-3">
                <span className="mt-1 size-2.5 shrink-0 rounded-full bg-blue-600" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Website concept prepared
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Ready to discuss with the client
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <SectionHeading title="Materials needed" detail="From client" />
            <div className="px-5 py-2">
              {demoProject.materials.map((material) => (
                <div
                  key={material}
                  className="flex items-center justify-between gap-3 border-b border-slate-100 py-4 text-sm last:border-0"
                >
                  <span className="text-slate-700">{material}</span>
                  <span className="shrink-0 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
                    Awaiting
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <SectionHeading title="Project details" detail="Planning" />
            <div className="space-y-4 p-5">
              <Detail icon={<FolderKanban size={16} />} label="Type" value="Website concept" />
              <Detail icon={<MapPin size={16} />} label="Location" value="Vaggeryd" />
              <Detail icon={<FileText size={16} />} label="Agreement" value="Not accepted" />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function SectionHeading({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
      <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      <span className="text-xs text-slate-500">{detail}</span>
    </div>
  );
}

function SummaryCard({
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
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {icon}
        {label}
      </div>
      <strong className="mt-3 block text-lg font-semibold text-slate-950">
        {value}
      </strong>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-slate-400">{icon}</span>
      <span className="text-slate-500">{label}</span>
      <strong className="ml-auto text-right font-medium text-slate-900">
        {value}
      </strong>
    </div>
  );
}