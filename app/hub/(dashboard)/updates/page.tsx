import NewsAction from "@/components/news/NewsAction";
import { NEWS_KINDS } from "@/lib/news-policy";
import Link from "next/link";
import {
  BellRing,
  FilePenLine,
  Megaphone,
  Plus,
  Radio,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FILTERS = [
  "ALL",
  "PUBLISHED",
  "DRAFT",
] as const;

type Filter =
  (typeof FILTERS)[number];

type SearchParams =
  Promise<{
    state?: string;
    status?: string;
    q?: string;
    kind?: string;
  }>;

function formatDate(
  value: Date | null,
) {
  if (!value) {
    return "Not published";
  }

  return new Intl.DateTimeFormat(
    "sv-SE",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
    value.slice(1).toLowerCase()
  );
}

function kindLabel(
  value: string,
) {
  if (value === "fix") return "Fix";
  if (value === "improvement") return "Improvement";
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

function stateMessage(
  state?: string,
) {
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

  const messages:
    Record<string, string> = {
      created:
        "Draft created.",
      saved:
        "Changes saved.",
      published:
        "Update published.",
      unpublished:
        "Update moved back to draft.",
      deleted:
        "Update deleted.",
    };

  return {
    tone: "success",
    text:
      messages[state] ??
      "Changes saved.",
  };
}

export default async function UpdatesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params =
    await searchParams;

  const active: Filter =
    FILTERS.includes(
      params.status as Filter,
    )
      ? (params.status as Filter)
      : "ALL";

  const query = (params.q ?? "").trim().slice(0, 140);
  const selectedKind = NEWS_KINDS.includes(params.kind as typeof NEWS_KINDS[number]) ? params.kind : "";

  const allUpdates =
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

  const publishedCount =
    allUpdates.filter(
      (update) =>
        update.published,
    ).length;

  const draftCount =
    allUpdates.length -
    publishedCount;

  const updates =
    allUpdates.filter(
      (update) => {
        if (query && !`${update.title} ${update.summary}`.toLowerCase().includes(query.toLowerCase())) return false;
        if (selectedKind && update.kind !== selectedKind) return false;
        if (
          active ===
          "PUBLISHED"
        ) {
          return update.published;
        }

        if (
          active ===
          "DRAFT"
        ) {
          return !update.published;
        }

        return true;
      },
    );

  const countFor = (
    value: Filter,
  ) => {
    if (value === "PUBLISHED") {
      return publishedCount;
    }

    if (value === "DRAFT") {
      return draftCount;
    }

    return allUpdates.length;
  };

  const notice =
    stateMessage(
      params.state,
    );

  return (
    <div className="hub-page hub-updates-page">
      <header className="hub-workspace-head">
        <div>
          <span className="hub-workspace-kicker">
            PLATFORM / COMMUNICATION
          </span>

          <h1>
            News & Updates
          </h1>

          <p>
            Publish product news, feature releases and service announcements directly to tenant dashboards.
          </p>
        </div>

        <Link
          href="/hub/updates/new"
          className="hub-workspace-primary-action"
        >
          <Plus size={15} />
          New update
        </Link>
      </header>

      <section
        className="hub-workspace-stats hub-updates-stats"
        aria-label="News overview"
      >
        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon">
            <Megaphone size={16} />
          </span>

          <div>
            <small>
              Total updates
            </small>

            <strong>
              {allUpdates.length}
            </strong>

            <span>
              All announcements
            </span>
          </div>
        </div>

        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon hub-workspace-stat-icon-good">
            <Radio size={16} />
          </span>

          <div>
            <small>
              Published
            </small>

            <strong>
              {publishedCount}
            </strong>

            <span>
              Visible to tenants
            </span>
          </div>
        </div>

        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon hub-workspace-stat-icon-info">
            <FilePenLine size={16} />
          </span>

          <div>
            <small>
              Drafts
            </small>

            <strong>
              {draftCount}
            </strong>

            <span>
              Waiting for review
            </span>
          </div>
        </div>

        <div className="hub-workspace-stat">
          <span className="hub-workspace-stat-icon hub-workspace-stat-icon-value">
            <BellRing size={16} />
          </span>

          <div>
            <small>
              Audience
            </small>

            <strong>
              All plans
            </strong>

            <span>
              Or target one package
            </span>
          </div>
        </div>
      </section>

      {notice ? (
        <div
          className={
            notice.tone ===
            "error"
              ? "hub-updates-notice hub-updates-notice-error"
              : "hub-updates-notice hub-updates-notice-success"
          }
        >
          {notice.text}
        </div>
      ) : null}

      <form className="news-search" method="get">
        <input type="hidden" name="status" value={active} />
        <label><span>Search updates</span><input name="q" defaultValue={query} placeholder="Title or summary…" /></label>
        <label><span>Type</span><select name="kind" defaultValue={selectedKind}><option value="">All types</option>{NEWS_KINDS.map(kind => <option key={kind} value={kind}>{kindLabel(kind)}</option>)}</select></label>
        <button className="hub-updates-primary-button">Filter</button>
      </form>

      <nav
        className="hub-workspace-filters"
        aria-label="Update filters"
      >
        {FILTERS.map(
          (value) => (
            <Link
              key={value}
              href={`/hub/updates?${new URLSearchParams({ status: value, q: query, kind: selectedKind ?? "" })}`}
              className={
                active === value
                  ? "hub-workspace-filter-active"
                  : undefined
              }
              aria-current={
                active === value
                  ? "page"
                  : undefined
              }
            >
              <span>
                {value === "ALL"
                  ? "All"
                  : value ===
                      "PUBLISHED"
                    ? "Published"
                    : "Drafts"}
              </span>

              <strong>
                {countFor(
                  value,
                )}
              </strong>
            </Link>
          ),
        )}
      </nav>

      {updates.length === 0 ? (
        <div className="hub-empty-state">
          <Megaphone size={28} />

          <h2>
            {active ===
            "PUBLISHED"
              ? "No published updates"
              : active ===
                  "DRAFT"
                ? "No drafts"
                : "No updates yet"}
          </h2>

          <p>
            {active ===
            "ALL"
              ? "Create your first customer announcement."
              : "Choose another filter to see more updates."}
          </p>
        </div>
      ) : (
        <section
          className="hub-updates-list"
          aria-label="News and updates"
        >
          {updates.map(
            (update) => (
              <article
                key={update.id}
                className="hub-updates-row"
              >
                <div className="hub-updates-row-main">
                  <span
                    className={`hub-updates-kind hub-updates-kind-${update.kind}`}
                  >
                    <Megaphone
                      size={15}
                    />
                  </span>

                  <div>
                    <div className="hub-updates-title-line">
                      <strong>
                        {update.pinned ? "📌 " : ""}{update.title}
                      </strong>

                      <span
                        className={
                          update.published
                            ? "hub-updates-status hub-updates-status-published"
                            : "hub-updates-status hub-updates-status-draft"
                        }
                      >
                        {update.published
                          ? "Published"
                          : "Draft"}
                      </span>
                    </div>

                    <p>
                      {update.summary}
                    </p>
                  </div>
                </div>

                <div className="hub-updates-row-meta">
                  <small>
                    Audience
                  </small>

                  <strong>
                    {audienceLabel(
                      update.audiencePlan,
                    )}
                  </strong>

                  <span>
                    {kindLabel(
                      update.kind,
                    )}
                  </span>
                </div>

                <div className="hub-updates-row-date">
                  <small>
                    {update.published
                      ? "Published"
                      : "Created"}
                  </small>

                  <strong>
                    {formatDate(
                      update.published
                        ? update.publishedAt
                        : update.createdAt,
                    )}
                  </strong>
                </div>

                <div className="hub-updates-row-actions">
                  <Link className="hub-updates-button" href={`/hub/updates/${update.id}`}>Edit & preview</Link>
                  <NewsAction id={update.id} title={update.title} action={update.published ? "unpublish" : "publish"} />
                  <NewsAction id={update.id} title={update.title} action="delete" />
                </div>
              </article>
            ),
          )}
        </section>
      )}
    </div>
  );
}
