import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Filter = "all" | "published" | "drafts";

type SearchParams = Promise<{
  state?: string;
  filter?: string;
}>;

function formatDate(value: Date | null): string {
  if (!value) {
    return "Not published";
  }

  return new Intl.DateTimeFormat(
    "sv-SE",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  ).format(value);
}

function audienceLabel(value: string | null): string {
  if (!value) {
    return "All plans";
  }

  if (value === "SAAS") {
    return "Growth";
  }

  return (
    value.charAt(0) +
    value.slice(1).toLowerCase()
  );
}

function kindLabel(value: string): string {
  if (value === "feature") {
    return "Feature";
  }

  if (value === "maintenance") {
    return "Maintenance";
  }

  if (value === "security") {
    return "Security";
  }

  return "Announcement";
}

function stateMessage(state?: string): {
  tone: "success" | "error";
  text: string;
} | null {
  if (!state) {
    return null;
  }

  if (state.startsWith("error:")) {
    return {
      tone: "error",
      text:
        state.slice(6) ||
        "The update could not be saved.",
    };
  }

  const messages: Record<string, string> = {
    published: "Update published successfully.",
    unpublished: "Update moved back to drafts.",
    deleted: "Update deleted.",
    created: "Draft created.",
    saved: "Changes saved.",
  };

  return {
    tone: "success",
    text:
      messages[state] ??
      "Changes saved.",
  };
}

function filterHref(filter: Filter): string {
  return filter === "all"
    ? "/hub/updates"
    : `/hub/updates?filter=${filter}`;
}

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params =
    await searchParams;

  const filter: Filter =
    params.filter === "published" ||
    params.filter === "drafts"
      ? params.filter
      : "all";

  const allUpdates =
    await prisma.saasAnnouncement.findMany({
      orderBy: [
        {
          publishedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

  const publishedCount =
    allUpdates.filter(
      (update) => update.published,
    ).length;

  const draftCount =
    allUpdates.length -
    publishedCount;

  const updates =
    allUpdates.filter((update) => {
      if (filter === "published") {
        return update.published;
      }

      if (filter === "drafts") {
        return !update.published;
      }

      return true;
    });

  const notice =
    stateMessage(params.state);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            SaaS communication
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">
            News & Updates
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Publish product news, feature releases and important service announcements directly to your customers.
          </p>
        </div>

        <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-5 py-3.5">
            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Total
            </span>

            <strong className="mt-1 block text-xl text-slate-950">
              {allUpdates.length}
            </strong>
          </div>

          <div className="border-l border-slate-100 px-5 py-3.5">
            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Live
            </span>

            <strong className="mt-1 block text-xl text-emerald-700">
              {publishedCount}
            </strong>
          </div>

          <div className="border-l border-slate-100 px-5 py-3.5">
            <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Drafts
            </span>

            <strong className="mt-1 block text-xl text-slate-700">
              {draftCount}
            </strong>
          </div>
        </div>
      </header>

      {notice ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            notice.tone === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      <details
        className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        open={allUpdates.length === 0}
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:hidden">
          <div>
            <strong className="block text-sm font-semibold text-slate-950">
              Create an update
            </strong>

            <span className="mt-0.5 block text-xs text-slate-500">
              Write now, review as a draft, publish when ready.
            </span>
          </div>

          <span className="flex h-9 items-center rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition group-open:bg-slate-100 group-open:text-slate-700">
            <span className="group-open:hidden">
              + New update
            </span>

            <span className="hidden group-open:inline">
              Close
            </span>
          </span>
        </summary>

        <div className="border-t border-slate-100 p-5">
          <form
            action="/api/hub/updates"
            method="post"
            className="grid gap-4"
          >
            <input
              type="hidden"
              name="action"
              value="save"
            />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(260px,.6fr)]">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Title

                <input
                  name="title"
                  required
                  maxLength={140}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  placeholder="What's new?"
                />
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Audience

                <select
                  name="audiencePlan"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  defaultValue=""
                >
                  <option value="">
                    All plans
                  </option>

                  <option value="STARTER">
                    Starter
                  </option>

                  <option value="SAAS">
                    Growth
                  </option>

                  <option value="BUSINESS">
                    Business
                  </option>
                </select>
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Type

                <select
                  name="kind"
                  defaultValue="feature"
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  <option value="feature">
                    Feature
                  </option>

                  <option value="announcement">
                    Announcement
                  </option>

                  <option value="maintenance">
                    Maintenance
                  </option>

                  <option value="security">
                    Security
                  </option>
                </select>
              </label>

              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Short summary

                <input
                  name="summary"
                  required
                  maxLength={240}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  placeholder="One sentence customers will see in the dashboard."
                />
              </label>
            </div>

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Full update

              <textarea
                name="body"
                required
                rows={5}
                maxLength={6000}
                className="resize-y rounded-xl border border-slate-200 px-3 py-2.5 leading-6 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                placeholder="Explain what changed and anything the customer needs to know."
              />
            </label>

            <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
              <span className="hidden text-xs text-slate-400 sm:block">
                Nothing goes live until you publish it.
              </span>

              <button
                type="submit"
                className="ml-auto rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Save as draft
              </button>
            </div>
          </form>
        </div>
      </details>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              Published & drafts
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Manage everything customers can see from one place.
            </p>
          </div>

          <nav
            className="inline-flex w-fit rounded-xl border border-slate-200 bg-white p-1"
            aria-label="Filter updates"
          >
            {([
              ["all", "All", allUpdates.length],
              ["published", "Published", publishedCount],
              ["drafts", "Drafts", draftCount],
            ] as const).map(
              ([value, label, count]) => (
                <Link
                  key={value}
                  href={filterHref(value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold no-underline transition ${
                    filter === value
                      ? "bg-slate-950 text-white"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {label}
                  <span
                    className={`ml-1.5 ${
                      filter === value
                        ? "text-slate-300"
                        : "text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </Link>
              ),
            )}
          </nav>
        </div>

        <div className="grid gap-3">
          {updates.map((update) => (
            <article
              key={update.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${
                          update.published
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {update.published
                          ? "Published"
                          : "Draft"}
                      </span>

                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-blue-700">
                        {audienceLabel(
                          update.audiencePlan,
                        )}
                      </span>

                      <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                        {kindLabel(
                          update.kind,
                        )}
                      </span>

                      <span className="text-xs text-slate-400">
                        {formatDate(
                          update.publishedAt,
                        )}
                      </span>
                    </div>

                    <h3 className="truncate text-[17px] font-semibold tracking-tight text-slate-950">
                      {update.title}
                    </h3>

                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                      {update.summary}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:flex-none">
                    <details className="group/edit">
                      <summary className="cursor-pointer list-none rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 marker:hidden">
                        Edit
                      </summary>

                      <div className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[1px]" />

                      <div className="fixed inset-x-4 top-1/2 z-50 mx-auto max-h-[calc(100vh-40px)] max-w-3xl -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:inset-x-8">
                        <div className="mb-5 flex items-start justify-between gap-4">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                              Edit update
                            </span>

                            <h3 className="mt-1 text-xl font-semibold text-slate-950">
                              {update.title}
                            </h3>
                          </div>

                          <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">
                            Close with browser back or save
                          </span>
                        </div>

                        <form
                          action="/api/hub/updates"
                          method="post"
                          className="grid gap-4"
                        >
                          <input
                            type="hidden"
                            name="action"
                            value="save"
                          />

                          <input
                            type="hidden"
                            name="id"
                            value={update.id}
                          />

                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                              Title

                              <input
                                name="title"
                                required
                                defaultValue={update.title}
                                className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-400"
                              />
                            </label>

                            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                              Audience

                              <select
                                name="audiencePlan"
                                defaultValue={
                                  update.audiencePlan ??
                                  ""
                                }
                                className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-400"
                              >
                                <option value="">
                                  All plans
                                </option>

                                <option value="STARTER">
                                  Starter
                                </option>

                                <option value="SAAS">
                                  Growth
                                </option>

                                <option value="BUSINESS">
                                  Business
                                </option>
                              </select>
                            </label>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                              Type

                              <select
                                name="kind"
                                defaultValue={update.kind}
                                className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-400"
                              >
                                <option value="feature">
                                  Feature
                                </option>

                                <option value="announcement">
                                  Announcement
                                </option>

                                <option value="maintenance">
                                  Maintenance
                                </option>

                                <option value="security">
                                  Security
                                </option>
                              </select>
                            </label>

                            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                              Summary

                              <input
                                name="summary"
                                required
                                defaultValue={update.summary}
                                className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-400"
                              />
                            </label>
                          </div>

                          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                            Full update

                            <textarea
                              name="body"
                              required
                              rows={6}
                              defaultValue={update.body}
                              className="resize-y rounded-xl border border-slate-200 px-3 py-2.5 leading-6 outline-none focus:border-blue-400"
                            />
                          </label>

                          <div className="flex justify-end border-t border-slate-100 pt-4">
                            <button
                              type="submit"
                              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                              Save changes
                            </button>
                          </div>
                        </form>
                      </div>
                    </details>

                    <form
                      action="/api/hub/updates"
                      method="post"
                    >
                      <input
                        type="hidden"
                        name="action"
                        value="toggle"
                      />

                      <input
                        type="hidden"
                        name="id"
                        value={update.id}
                      />

                      <button
                        type="submit"
                        className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
                          update.published
                            ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
                            : "bg-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {update.published
                          ? "Unpublish"
                          : "Publish"}
                      </button>
                    </form>

                    <form
                      action="/api/hub/updates"
                      method="post"
                    >
                      <input
                        type="hidden"
                        name="action"
                        value="delete"
                      />

                      <input
                        type="hidden"
                        name="id"
                        value={update.id}
                      />

                      <button
                        type="submit"
                        className="rounded-xl px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </article>
          ))}

          {!updates.length ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <strong className="block text-sm font-semibold text-slate-800">
                {filter === "published"
                  ? "Nothing published yet"
                  : filter === "drafts"
                    ? "No drafts waiting"
                    : "No updates yet"}
              </strong>

              <span className="mt-1 block text-sm text-slate-500">
                {filter === "all"
                  ? "Create your first announcement above."
                  : "Try another filter to see your other updates."}
              </span>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
