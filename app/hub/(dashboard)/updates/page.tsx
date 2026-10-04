import { prisma } from "@/lib/prisma";

export const dynamic =
  "force-dynamic";

type SearchParams =
  Promise<{
    state?: string;
  }>;

function date(
  value: Date | null,
) {
  if (!value) {
    return "Draft";
  }

  return new Intl.DateTimeFormat(
    "sv-SE",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    },
  ).format(value);
}

function audienceLabel(
  value: string | null,
) {
  if (!value) {
    return "All plans";
  }

  if (value === "SAAS") {
    return "Growth";
  }

  return (
    value.charAt(0) +
    value
      .slice(1)
      .toLowerCase()
  );
}

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params =
    await searchParams;

  const updates =
    await prisma
      .saasAnnouncement
      .findMany({
        orderBy: [
          {
            publishedAt:
              "desc",
          },
          {
            createdAt:
              "desc",
          },
        ],
      });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            SaaS communication
          </p>

          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            News & Updates
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Publish product news, maintenance notices and feature announcements directly to tenant dashboards.
          </p>
        </div>

        <span className="text-sm text-slate-500">
          {updates.length} update{updates.length === 1 ? "" : "s"}
        </span>
      </header>

      {params.state ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            params.state.startsWith("error")
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {params.state.startsWith("error:")
            ? params.state.slice(6)
            : params.state === "published"
              ? "Update published."
              : params.state === "unpublished"
                ? "Update moved back to draft."
                : params.state === "deleted"
                  ? "Update deleted."
                  : params.state === "created"
                    ? "Draft created."
                    : "Update saved."}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-950">
            New announcement
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            New items start as drafts. Review them before publishing.
          </p>
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

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Title

              <input
                name="title"
                required
                maxLength={140}
                className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-400"
                placeholder="New analytics dashboard"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Audience

              <select
                name="audiencePlan"
                className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-400"
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

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Type

              <select
                name="kind"
                defaultValue="feature"
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
              Short summary

              <input
                name="summary"
                required
                maxLength={240}
                className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-400"
                placeholder="A short summary shown on the tenant dashboard."
              />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Full update

            <textarea
              name="body"
              required
              rows={6}
              maxLength={6000}
              className="rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-blue-400"
              placeholder="Explain what changed and what the customer needs to know."
            />
          </label>

          <div>
            <button
              type="submit"
              className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Create draft
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-4">
        {updates.map((update) => (
          <article
            key={update.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span
                  className={`rounded-full px-2.5 py-1 ${
                    update.published
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {update.published
                    ? "Published"
                    : "Draft"}
                </span>

                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
                  {audienceLabel(
                    update.audiencePlan,
                  )}
                </span>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                  {update.kind}
                </span>
              </div>

              <span className="text-xs text-slate-500">
                {date(
                  update.publishedAt,
                )}
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
                    defaultValue={
                      update.title
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2.5"
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
                    className="rounded-xl border border-slate-200 px-3 py-2.5"
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
                    defaultValue={
                      update.kind
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2.5"
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
                    defaultValue={
                      update.summary
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2.5"
                  />
                </label>
              </div>

              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Body

                <textarea
                  name="body"
                  required
                  rows={5}
                  defaultValue={
                    update.body
                  }
                  className="rounded-xl border border-slate-200 px-3 py-2.5"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  Save changes
                </button>
              </div>
            </form>

            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
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
                  className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                    update.published
                      ? "bg-amber-50 text-amber-800"
                      : "bg-emerald-600 text-white"
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
                  className="rounded-xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
                >
                  Delete
                </button>
              </form>
            </div>
          </article>
        ))}

        {!updates.length ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
            No announcements yet.
          </div>
        ) : null}
      </section>
    </div>
  );
}
