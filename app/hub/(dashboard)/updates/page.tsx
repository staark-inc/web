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
            SAAS / COMMUNICATION
          </span>

          <h1>
            News & Updates
          </h1>

          <p>
            Publish product news, feature releases and service announcements directly to tenant dashboards.
          </p>
        </div>

        <a
          href="#new-update"
          className="hub-workspace-primary-action"
        >
          <Plus size={15} />
          New update
        </a>
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

      <section
        id="new-update"
        className="hub-updates-compose"
      >
        <details
          open={
            allUpdates.length ===
            0
          }
        >
          <summary>
            <div>
              <strong>
                Create an update
              </strong>

              <span>
                Draft first, publish when ready.
              </span>
            </div>

            <span className="hub-updates-compose-toggle">
              <Plus size={14} />
              New update
            </span>
          </summary>

          <div className="hub-updates-compose-body">
            <form
              action="/api/hub/updates"
              method="post"
              className="hub-updates-form"
            >
              <input
                type="hidden"
                name="action"
                value="save"
              />

              <div className="hub-updates-form-grid hub-updates-form-grid-wide">
                <label>
                  <span>
                    Title
                  </span>

                  <input
                    name="title"
                    required
                    maxLength={140}
                    placeholder="New analytics dashboard"
                  />
                </label>

                <label>
                  <span>
                    Audience
                  </span>

                  <select
                    name="audiencePlan"
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

              <div className="hub-updates-form-grid hub-updates-form-grid-type">
                <label>
                  <span>
                    Type
                  </span>

                  <select
                    name="kind"
                    defaultValue="feature"
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

                <label>
                  <span>
                    Short summary
                  </span>

                  <input
                    name="summary"
                    required
                    maxLength={240}
                    placeholder="Short text shown on the tenant dashboard."
                  />
                </label>
              </div>

              <label>
                <span>
                  Full update
                </span>

                <textarea
                  name="body"
                  required
                  rows={5}
                  maxLength={6000}
                  placeholder="Explain what changed and what the customer needs to know."
                />
              </label>

              <div className="hub-updates-form-actions">
                <small>
                  Updates stay private until published.
                </small>

                <button
                  type="submit"
                  className="hub-updates-primary-button"
                >
                  Save draft
                </button>
              </div>
            </form>
          </div>
        </details>
      </section>

      <nav
        className="hub-workspace-filters"
        aria-label="Update filters"
      >
        {FILTERS.map(
          (value) => (
            <Link
              key={value}
              href={
                value ===
                "ALL"
                  ? "/hub/updates"
                  : `/hub/updates?status=${value}`
              }
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
                        {update.title}
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
                  <details className="hub-updates-edit">
                    <summary>
                      Edit
                    </summary>

                    <div className="hub-updates-edit-panel">
                      <div className="hub-updates-edit-head">
                        <div>
                          <small>
                            EDIT UPDATE
                          </small>

                          <strong>
                            {update.title}
                          </strong>
                        </div>
                      </div>

                      <form
                        action="/api/hub/updates"
                        method="post"
                        className="hub-updates-form"
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

                        <div className="hub-updates-form-grid">
                          <label>
                            <span>
                              Title
                            </span>

                            <input
                              name="title"
                              required
                              defaultValue={
                                update.title
                              }
                            />
                          </label>

                          <label>
                            <span>
                              Audience
                            </span>

                            <select
                              name="audiencePlan"
                              defaultValue={
                                update.audiencePlan ??
                                ""
                              }
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

                        <div className="hub-updates-form-grid">
                          <label>
                            <span>
                              Type
                            </span>

                            <select
                              name="kind"
                              defaultValue={
                                update.kind
                              }
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

                          <label>
                            <span>
                              Summary
                            </span>

                            <input
                              name="summary"
                              required
                              defaultValue={
                                update.summary
                              }
                            />
                          </label>
                        </div>

                        <label>
                          <span>
                            Full update
                          </span>

                          <textarea
                            name="body"
                            required
                            rows={6}
                            defaultValue={
                              update.body
                            }
                          />
                        </label>

                        <div className="hub-updates-form-actions">
                          <span />

                          <button
                            type="submit"
                            className="hub-updates-primary-button"
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
                      className={
                        update.published
                          ? "hub-updates-button hub-updates-button-unpublish"
                          : "hub-updates-button hub-updates-button-publish"
                      }
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
                      className="hub-updates-delete"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </article>
            ),
          )}
        </section>
      )}
    </div>
  );
}
