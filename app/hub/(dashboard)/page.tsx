import Link from "next/link";

import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Eye,
  FileText,
  FolderKanban,
  GitCommitHorizontal,
  GitMerge,
  Inbox,
  LifeBuoy,
  LoaderCircle,
  MailPlus,
  MousePointerClick,
  Plus,
  Rocket,
  Target,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";
import {
  getSearchConsoleOverview,
  type SearchConsoleOverview,
} from "@/lib/search-console";
import { prisma } from "@/lib/prisma";
import { getCustomerUnreadCount } from "@/lib/crm-unread";
import {
  getGa4Overview,
  type Ga4Overview,
} from "@/lib/analytics";

export const dynamic = "force-dynamic";
import {
  getGitHubOverview,
} from "@/lib/github";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatTrafficDate(date: string) {
  if (!date || date.length !== 8) {
    return date;
  }

  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(4, 6)) - 1;
  const day = Number(date.slice(6, 8));

  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
  }).format(
    new Date(year, month, day)
  );
}

function createEmptyAnalytics(): Ga4Overview {
  return {
    visitors: 0,
    sessions: 0,
    pageViews: 0,
    onlineNow: 0,
    dailyTraffic: [],
    topPages: [],
  };
}

function createEmptySearchConsole(): SearchConsoleOverview {
  return {
    clicks: 0,
    impressions: 0,
    ctr: 0,
    position: 0,
    dailyTraffic: [],
    topQueries: [],
    topPages: [],
  };
}

function formatSearchDate(date: string) {
  if (!date) {
    return date;
  }

  const parsed = new Date(`${date}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
  }).format(parsed);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatMoneyOre(value: number | null | undefined) {
  if (!value) {
    return "0 kr";
  }

  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(value / 100);
}

function formatDashboardDate(date: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Stockholm",
  }).format(date);
}

function formatPosition(value: number) {
  if (!value) {
    return "—";
  }

  return value.toFixed(1);
}

function cleanSearchPage(page: string) {
  try {
    const url = new URL(page);

    return `${url.pathname}${url.search}`;
  } catch {
    return page;
  }
}

function formatDeploymentDate(
  value: string | null
) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function HubOverviewPage() {
  const startOfMonth = new Date();

  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

const searchConsolePromise = getSearchConsoleOverview()
  .then((data) => ({
    data,
    connected: true,
  }))
  .catch((error) => {
    console.error(
      "Failed to load Search Console overview:",
      error
    );

    return {
      data: createEmptySearchConsole(),
      connected: false,
    };
  });

const githubPromise = getGitHubOverview()
  .then((data) => ({
    connected: true as const,
    data,
  }))
  .catch((error) => {
    console.error(
      "Failed to load GitHub overview:",
      error
    );

    return {
      connected: false as const,
      data: null,
    };
  });

  /**
   * GA4 is intentionally isolated.
   *
   * If Google has a temporary problem,
   * CRM data should still load normally.
   */
  const analyticsPromise = getGa4Overview()
    .then((data) => ({
      data,
      connected: true,
    }))
    .catch((error) => {
      console.error(
        "Failed to load GA4 overview:",
        error
      );

      return {
        data: createEmptyAnalytics(),
        connected: false,
      };
    });

    const [
      newLeadCount,
      unreadCount,
      contactCount,
      wonThisMonth,
      activeProjectCount,
      overdueProjectCount,
      openSupportCount,
      urgentSupportCount,
      liveOfferCount,
      viewedOfferCount,
      liveOfferValue,
      acceptedThisMonth,
      recentLeads,
      recentMessages,
      analyticsResult,
      searchConsoleResult,
      githubResult,
    ] = await Promise.all([
      prisma.lead.count({
        where: {
          status: "NEW",
        },
      }),

      getCustomerUnreadCount(),

      prisma.contact.count(),

      prisma.lead.count({
        where: {
          status: "WON",
          updatedAt: {
            gte: startOfMonth,
          },
        },
      }),

      prisma.project.count({
        where: {
          status: {
            in: [
              "PLANNING",
              "IN_PROGRESS",
              "WAITING_CLIENT",
              "REVIEW",
            ],
          },
        },
      }),

      prisma.project.count({
        where: {
          dueAt: {
            lt: new Date(),
          },
          status: {
            in: [
              "PLANNING",
              "IN_PROGRESS",
              "WAITING_CLIENT",
              "REVIEW",
            ],
          },
        },
      }),

      prisma.supportRequest.count({
        where: {
          status: {
            not: "RESOLVED",
          },
        },
      }),

      prisma.supportRequest.count({
        where: {
          priority: "URGENT",
          status: {
            not: "RESOLVED",
          },
        },
      }),

      prisma.offer.count({
        where: {
          status: {
            in: ["SHARED", "VIEWED"],
          },
        },
      }),

      prisma.offer.count({
        where: {
          status: "VIEWED",
        },
      }),

      prisma.offer.aggregate({
        where: {
          status: {
            in: ["SHARED", "VIEWED"],
          },
        },
        _sum: {
          oneTimePriceOre: true,
        },
      }),

      prisma.offer.aggregate({
        where: {
          status: "ACCEPTED",
          decidedAt: {
            gte: startOfMonth,
          },
        },
        _count: {
          _all: true,
        },
        _sum: {
          oneTimePriceOre: true,
        },
      }),

      prisma.lead.findMany({
        orderBy: {
          createdAt: "desc",
        },

        take: 5,

        include: {
          contact: true,
        },
      }),

      prisma.message.findMany({
        where: {
          direction: "INBOUND",
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 5,
      }),

      analyticsPromise,
      searchConsolePromise,
      githubPromise,
    ]);

  const now = new Date();

  const liveOfferValueOre =
    liveOfferValue._sum.oneTimePriceOre ?? 0;

  const acceptedThisMonthCount =
    acceptedThisMonth._count._all;

  const acceptedThisMonthValueOre =
    acceptedThisMonth._sum.oneTimePriceOre ?? 0;

  const attentionCount =
    newLeadCount +
    unreadCount +
    urgentSupportCount +
    overdueProjectCount +
    viewedOfferCount;

  const attentionItems = [
    newLeadCount > 0
      ? {
          label: "New leads",
          detail: `${newLeadCount} waiting for first contact`,
          href: "/hub/leads?status=NEW",
          tone: "attention",
          icon: "lead",
        }
      : null,
    unreadCount > 0
      ? {
          label: "Unread messages",
          detail: `${unreadCount} customer message${unreadCount === 1 ? "" : "s"} waiting`,
          href: "/hub/inbox",
          tone: "attention",
          icon: "inbox",
        }
      : null,
    urgentSupportCount > 0
      ? {
          label: "Urgent support",
          detail: `${urgentSupportCount} urgent request${urgentSupportCount === 1 ? "" : "s"} open`,
          href: "/hub/support",
          tone: "danger",
          icon: "support",
        }
      : null,
    overdueProjectCount > 0
      ? {
          label: "Project deadlines",
          detail: `${overdueProjectCount} project${overdueProjectCount === 1 ? "" : "s"} overdue`,
          href: "/hub/projects",
          tone: "danger",
          icon: "project",
        }
      : null,
    viewedOfferCount > 0
      ? {
          label: "Viewed offers",
          detail: `${viewedOfferCount} viewed offer${viewedOfferCount === 1 ? "" : "s"} awaiting decision`,
          href: "/hub/offers",
          tone: "info",
          icon: "offer",
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    detail: string;
    href: string;
    tone: "attention" | "danger" | "info";
    icon: "lead" | "inbox" | "support" | "project" | "offer";
  }>;

  const analytics = analyticsResult.data;
  const searchConsole = searchConsoleResult.data;
  const maxSearchImpressions = Math.max(
    ...searchConsole.dailyTraffic.map(
      (item) => item.impressions
    ),
    1
  );

  const github = githubResult.data;

  const workflowStatus = (() => {
    if (!github?.workflow) {
      return {
        label: "Unknown",
        className: "unknown",
        description: "No deployment information",
      };
    }

    if (
      github.workflow.status === "queued" ||
      github.workflow.status === "in_progress"
    ) {
      return {
        label: "Deploying",
        className: "deploying",
        description: "Deployment in progress",
      };
    }

    if (github.workflow.conclusion === "success") {
      return {
        label: "Healthy",
        className: "healthy",
        description: "Successfully deployed",
      };
    }

    if (
      github.workflow.conclusion === "failure" ||
      github.workflow.conclusion === "timed_out" ||
      github.workflow.conclusion === "cancelled"
    ) {
      return {
        label: "Failed",
        className: "failed",
        description: "Deployment needs attention",
      };
    }

    return {
      label: "Unknown",
      className: "unknown",
      description: "Deployment status unavailable",
    };
  })();

  /**
   * The graph uses page views for now.
   *
   * We calculate the maximum so the bars
   * automatically scale to the available data.
   */
  const maxPageViews = Math.max(
    ...analytics.dailyTraffic.map(
      (item) => item.pageViews
    ),
    1
  );

  return (
    <div className="hub-page hub-overview-page">
      {/* COMMAND CENTER */}

      <section className="hub-command-center">
        <div className="hub-command-hero">
          <div className="hub-command-copy">
            <span className="hub-command-kicker">
              STAARK COMMAND CENTER
            </span>

            <h1>Overview</h1>

            <p className="hub-command-date">
              {formatDashboardDate(now)}
            </p>

            <p className="hub-command-summary">
              {attentionCount > 0
                ? `${attentionCount} item${attentionCount === 1 ? "" : "s"} need attention across sales, delivery and support.`
                : "Everything looks clear. No urgent customer or delivery signals right now."}
            </p>
          </div>

          <div className="hub-command-actions">
            <Link
              href="/hub/offers/new"
              className="hub-command-action hub-command-action-primary"
            >
              <FileText size={15} />
              New offer
            </Link>

            <Link
              href="/hub/compose"
              className="hub-command-action"
            >
              <MailPlus size={15} />
              Compose
            </Link>

            <Link
              href="/hub/projects/new"
              className="hub-command-action"
            >
              <Plus size={15} />
              New project
            </Link>
          </div>
        </div>

        <div className="hub-command-metrics">
          <Link
            href="/hub/offers"
            className="hub-command-metric"
          >
            <span className="hub-command-metric-icon">
              <CircleDollarSign size={17} />
            </span>

            <div>
              <small>Live proposal value</small>
              <strong>{formatMoneyOre(liveOfferValueOre)}</strong>
              <span>
                {liveOfferCount} live offer{liveOfferCount === 1 ? "" : "s"}
              </span>
            </div>
          </Link>

          <Link
            href="/hub/projects"
            className={`hub-command-metric ${
              overdueProjectCount
                ? "hub-command-metric-alert"
                : ""
            }`}
          >
            <span className="hub-command-metric-icon">
              <FolderKanban size={17} />
            </span>

            <div>
              <small>Delivery</small>
              <strong>{activeProjectCount} active</strong>
              <span>
                {overdueProjectCount
                  ? `${overdueProjectCount} overdue`
                  : "No overdue projects"}
              </span>
            </div>
          </Link>

          <Link
            href="/hub/support"
            className={`hub-command-metric ${
              urgentSupportCount
                ? "hub-command-metric-danger"
                : ""
            }`}
          >
            <span className="hub-command-metric-icon">
              <LifeBuoy size={17} />
            </span>

            <div>
              <small>Support</small>
              <strong>{openSupportCount} open</strong>
              <span>
                {urgentSupportCount
                  ? `${urgentSupportCount} urgent`
                  : "No urgent tickets"}
              </span>
            </div>
          </Link>

          <Link
            href="/hub/inbox"
            className={`hub-command-metric ${
              unreadCount
                ? "hub-command-metric-alert"
                : ""
            }`}
          >
            <span className="hub-command-metric-icon">
              <Inbox size={17} />
            </span>

            <div>
              <small>Inbox</small>
              <strong>{unreadCount} unread</strong>
              <span>
                {newLeadCount} new lead{newLeadCount === 1 ? "" : "s"}
              </span>
            </div>
          </Link>
        </div>
      </section>

      <section className="hub-command-grid">
        <div className="hub-command-panel">
          <div className="hub-command-panel-header">
            <div>
              <span>PRIORITY QUEUE</span>
              <h2>Needs attention</h2>
            </div>

            <strong
              className={
                attentionCount
                  ? "hub-command-count hub-command-count-hot"
                  : "hub-command-count"
              }
            >
              {attentionCount}
            </strong>
          </div>

          {attentionItems.length === 0 ? (
            <div className="hub-command-clear">
              <CheckCircle2 size={20} />

              <div>
                <strong>All clear</strong>
                <span>
                  No urgent customer or delivery signals.
                </span>
              </div>
            </div>
          ) : (
            <div className="hub-command-attention-list">
              {attentionItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`hub-command-attention hub-command-attention-${item.tone}`}
                >
                  <span className="hub-command-attention-icon">
                    {item.icon === "lead" ? (
                      <Target size={15} />
                    ) : item.icon === "inbox" ? (
                      <Inbox size={15} />
                    ) : item.icon === "support" ? (
                      <LifeBuoy size={15} />
                    ) : item.icon === "project" ? (
                      <Clock3 size={15} />
                    ) : (
                      <Eye size={15} />
                    )}
                  </span>

                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.detail}</span>
                  </div>

                  <ArrowRight size={14} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="hub-command-panel hub-command-sales">
          <div className="hub-command-panel-header">
            <div>
              <span>SALES</span>
              <h2>This month</h2>
            </div>

            <CircleDollarSign size={19} />
          </div>

          <div className="hub-command-sales-value">
            <small>Accepted offer value</small>

            <strong>
              {formatMoneyOre(acceptedThisMonthValueOre)}
            </strong>

            <span>
              {acceptedThisMonthCount} accepted offer{acceptedThisMonthCount === 1 ? "" : "s"}
            </span>
          </div>

          <div className="hub-command-sales-footer">
            <div>
              <small>New leads</small>
              <strong>{newLeadCount}</strong>
            </div>

            <div>
              <small>Won leads</small>
              <strong>{wonThisMonth}</strong>
            </div>

            <div>
              <small>Contacts</small>
              <strong>{contactCount}</strong>
            </div>
          </div>

          <Link
            href="/hub/offers"
            className="hub-command-panel-link"
          >
            Open sales pipeline
            <ArrowRight size={13} />
          </Link>
        </div>
      </section>

        {/* DEPLOYMENT */}

        <div className="hub-overview-section-heading hub-deployment-heading">
          <div>
            <span className="hub-overview-section-label">
              DEPLOYMENT
            </span>

            <h2>Production</h2>
          </div>

          {githubResult.connected && github ? (
            <div
              className={`hub-deployment-status hub-deployment-${workflowStatus.className}`}
            >
              <span />

              {workflowStatus.label}
            </div>
          ) : (
            <div className="hub-deployment-status hub-deployment-unknown">
              <span />
              Unavailable
            </div>
          )}
        </div>

        <section className="hub-overview-card hub-deployment-card">
          {!githubResult.connected || !github ? (
            <div className="hub-deployment-unavailable">
              <GitMerge size={21} />

              <div>
                <strong>
                  GitHub unavailable
                </strong>

                <span>
                  Deployment information could not be loaded.
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="hub-deployment-main">
                <div className="hub-deployment-icon">
                  {workflowStatus.className === "healthy" ? (
                    <CheckCircle2 size={21} />
                  ) : workflowStatus.className === "deploying" ? (
                    <LoaderCircle size={21} />
                  ) : workflowStatus.className === "failed" ? (
                    <XCircle size={21} />
                  ) : (
                    <Rocket size={21} />
                  )}
                </div>

                <div className="hub-deployment-info">
                  <div className="hub-deployment-title">
                    <strong>
                      {github.workflow?.name ??
                        "Production deployment"}
                    </strong>

                    <span>
                      {workflowStatus.description}
                    </span>
                  </div>

                  <div className="hub-deployment-commit">
                    <div className="hub-deployment-commit-meta">
                      <span>
                        {github.branch.name}
                      </span>

                      <span className="hub-deployment-divider">
                        ·
                      </span>

                      <span className="hub-deployment-sha">
                        <GitCommitHorizontal size={13} />
                        {github.commit.shortSha}
                      </span>
                    </div>

                    <strong>
                      {github.commit.message}
                    </strong>

                    <small>
                      {github.commit.author}

                      {formatDeploymentDate(
                        github.commit.date
                      )
                        ? ` · ${formatDeploymentDate(
                            github.commit.date
                          )}`
                        : ""}
                    </small>
                  </div>
                </div>

                <div className="hub-deployment-actions">
                  <a
                    href={github.commit.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hub-secondary-button"
                  >
                    View commit
                    <ExternalLink size={12} />
                  </a>

                  {github.workflow ? (
                    <a
                      href={github.workflow.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hub-secondary-button"
                    >
                      View workflow
                      <ExternalLink size={12} />
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="hub-deployment-footer">
                <div>
                  <GitMerge size={14} />

                  <span>
                    {github.repository.fullName}
                  </span>
                </div>

                <div>
                  {github.workflow?.updatedAt ? (
                    <span>
                      Last deployment{" "}
                      {formatDeploymentDate(
                        github.workflow.updatedAt
                      )}
                    </span>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </section>

      {/* WEBSITE ANALYTICS */}

      <div className="hub-overview-section-heading hub-analytics-heading">
        <div>
          <span className="hub-overview-section-label">
            WEBSITE
          </span>

          <h2>Website analytics</h2>
        </div>

        <div className="hub-analytics-period">
          <BarChart3 size={15} />

          <span>Last 30 days</span>
        </div>
      </div>

      {!analyticsResult.connected ? (
        <div className="hub-analytics-error">
          <div>
            <strong>
              Google Analytics unavailable
            </strong>

            <span>
              We couldn&apos;t load your website
              statistics right now.
            </span>
          </div>

          <Link href="/api/hub/google/connect">
            Reconnect
          </Link>
        </div>
      ) : null}

      <section className="hub-overview-stats hub-analytics-stats">
        <div className="hub-stat-card">
          <div className="hub-stat-icon">
            <Users size={18} />
          </div>

          <div className="hub-stat-content">
            <span>Visitors</span>

            <strong>
              {analytics.visitors}
            </strong>

            <small>
              Active users
            </small>
          </div>
        </div>

        <div className="hub-stat-card">
          <div className="hub-stat-icon">
            <MousePointerClick size={18} />
          </div>

          <div className="hub-stat-content">
            <span>Sessions</span>

            <strong>
              {analytics.sessions}
            </strong>

            <small>
              Website sessions
            </small>
          </div>
        </div>

        <div className="hub-stat-card">
          <div className="hub-stat-icon">
            <Eye size={18} />
          </div>

          <div className="hub-stat-content">
            <span>Page views</span>

            <strong>
              {analytics.pageViews}
            </strong>

            <small>
              Public pages only
            </small>
          </div>
        </div>

        <div className="hub-stat-card hub-online-card">
          <div className="hub-stat-icon">
            <Activity size={18} />
          </div>

          <div className="hub-stat-content">
            <span>Online now</span>

            <strong>
              {analytics.onlineNow}
            </strong>

            <small className="hub-online-label">
              <i />
              Realtime
            </small>
          </div>
        </div>
      </section>

      {/* TRAFFIC + TOP PAGES */}

      <section className="hub-analytics-grid">
        {/* TRAFFIC */}

        <div className="hub-overview-card hub-traffic-card">
          <div className="hub-overview-card-header">
            <div>
              <h2>Website traffic</h2>

              <p>
                Page views over the last 30 days.
              </p>
            </div>

            <div className="hub-traffic-total">
              <strong>
                {analytics.pageViews}
              </strong>

              <span>views</span>
            </div>
          </div>

          {analytics.dailyTraffic.length === 0 ? (
            <div className="hub-overview-empty">
              No website traffic yet.
            </div>
          ) : (
            <div className="hub-traffic-chart">
              <div className="hub-traffic-bars">
                {analytics.dailyTraffic.map(
                  (item, index) => {
                    const hasTraffic =
                      item.pageViews > 0;

                    const height = hasTraffic
                      ? Math.max(
                          (item.pageViews /
                            maxPageViews) *
                            100,
                          8
                        )
                      : 0;

                    const showLabel =
                      index === 0 ||
                      index ===
                        analytics.dailyTraffic.length - 1 ||
                      index % 5 === 0;

                    return (
                      <div
                        className="hub-traffic-column"
                        key={item.date}
                        title={`${formatTrafficDate(
                          item.date
                        )}: ${
                          item.pageViews
                        } page views`}
                      >
                        <div className="hub-traffic-bar-area">
                          {hasTraffic ? (
                            <div
                              className="hub-traffic-bar"
                              style={{
                                height: `${height}%`,
                              }}
                            />
                          ) : (
                            <div className="hub-traffic-zero" />
                          )}
                        </div>

                        <span
                          className={
                            showLabel
                              ? "hub-traffic-date-visible"
                              : "hub-traffic-date-hidden"
                          }
                        >
                          {showLabel
                            ? formatTrafficDate(
                                item.date
                              )
                            : ""}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>

        {/* TOP PAGES */}

        <div className="hub-overview-card">
          <div className="hub-overview-card-header">
            <div>
              <h2>Top pages</h2>

              <p>
                Most visited public pages.
              </p>
            </div>
          </div>

          {analytics.topPages.length === 0 ? (
            <div className="hub-overview-empty">
              No page data yet.
            </div>
          ) : (
            <div className="hub-top-pages">
              {analytics.topPages.map(
                (page, index) => (
                  <div
                    className="hub-top-page-row"
                    key={`${page.path}-${index}`}
                  >
                    <div className="hub-top-page-rank">
                      {index + 1}
                    </div>

                    <div className="hub-top-page-main">
                      <strong>
                        {page.path}
                      </strong>

                      <span>
                        {page.title}
                      </span>
                    </div>

                    <div className="hub-top-page-views">
                      <strong>
                        {page.views}
                      </strong>

                      <span>
                        {page.views === 1
                          ? "view"
                          : "views"}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* GOOGLE SEARCH */}

      <div className="hub-overview-section-heading hub-search-heading">
        <div>
          <span className="hub-overview-section-label">
            GOOGLE SEARCH
          </span>

          <h2>Search performance</h2>
        </div>

        <div className="hub-analytics-period">
          <BarChart3 size={15} />
          <span>Last 30 days</span>
        </div>
      </div>

      {!searchConsoleResult.connected ? (
        <div className="hub-analytics-error">
          <div>
            <strong>
              Google Search Console unavailable
            </strong>

            <span>
              We couldn&apos;t load your search
              performance right now.
            </span>
          </div>

          <Link href="/api/hub/google/connect">
            Reconnect
          </Link>
        </div>
      ) : null}

      <section className="hub-overview-stats hub-search-stats">
        <div className="hub-stat-card">
          <div className="hub-stat-icon">
            <MousePointerClick size={18} />
          </div>

          <div className="hub-stat-content">
            <span>Clicks</span>

            <strong>
              {searchConsole.clicks}
            </strong>

            <small>
              From Google Search
            </small>
          </div>
        </div>

        <div className="hub-stat-card">
          <div className="hub-stat-icon">
            <Eye size={18} />
          </div>

          <div className="hub-stat-content">
            <span>Impressions</span>

            <strong>
              {searchConsole.impressions}
            </strong>

            <small>
              Search appearances
            </small>
          </div>
        </div>

        <div className="hub-stat-card">
          <div className="hub-stat-icon">
            <Target size={18} />
          </div>

          <div className="hub-stat-content">
            <span>CTR</span>

            <strong>
              {formatPercent(
                searchConsole.ctr
              )}
            </strong>

            <small>
              Click-through rate
            </small>
          </div>
        </div>

        <div className="hub-stat-card">
          <div className="hub-stat-icon">
            <BarChart3 size={18} />
          </div>

          <div className="hub-stat-content">
            <span>Avg. position</span>

            <strong>
              {formatPosition(
                searchConsole.position
              )}
            </strong>

            <small>
              Google ranking
            </small>
          </div>
        </div>
      </section>

      <section className="hub-search-grid">
        <div className="hub-overview-card hub-search-chart-card">
          <div className="hub-overview-card-header">
            <div>
              <h2>Search visibility</h2>

              <p>
                Google impressions over the last 30 days.
              </p>
            </div>

            <div className="hub-traffic-total">
              <strong>
                {searchConsole.impressions}
              </strong>

              <span>impressions</span>
            </div>
          </div>

          {searchConsole.dailyTraffic.length === 0 ? (
            <div className="hub-overview-empty">
              No search data yet.
            </div>
          ) : (
            <div className="hub-traffic-chart">
              <div className="hub-traffic-bars">
                {searchConsole.dailyTraffic.map(
                  (item, index) => {
                    const hasTraffic =
                      item.impressions > 0;

                    const height = hasTraffic
                      ? Math.max(
                          (item.impressions /
                            maxSearchImpressions) *
                            100,
                          8
                        )
                      : 0;

                    const showLabel =
                      index === 0 ||
                      index ===
                        searchConsole.dailyTraffic.length -
                          1 ||
                      index % 5 === 0;

                    return (
                      <div
                        className="hub-traffic-column"
                        key={item.date}
                        title={`${formatSearchDate(
                          item.date
                        )}: ${
                          item.impressions
                        } impressions, ${
                          item.clicks
                        } clicks`}
                      >
                        <div className="hub-traffic-bar-area">
                          {hasTraffic ? (
                            <div
                              className="hub-traffic-bar hub-search-bar"
                              style={{
                                height: `${height}%`,
                              }}
                            />
                          ) : (
                            <div className="hub-traffic-zero" />
                          )}
                        </div>

                        <span
                          className={
                            showLabel
                              ? "hub-traffic-date-visible"
                              : "hub-traffic-date-hidden"
                          }
                        >
                          {showLabel
                            ? formatSearchDate(
                                item.date
                              )
                            : ""}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hub-overview-card">
          <div className="hub-overview-card-header">
            <div>
              <h2>Top search queries</h2>

              <p>
                What people search for before finding you.
              </p>
            </div>
          </div>

          {searchConsole.topQueries.length === 0 ? (
            <div className="hub-overview-empty">
              No search queries yet.
            </div>
          ) : (
            <div className="hub-search-table">
              <div className="hub-search-table-head">
                <span>Query</span>
                <span>Clicks</span>
                <span>Pos.</span>
              </div>

              {searchConsole.topQueries.map(
                (query, index) => (
                  <div
                    className="hub-search-table-row"
                    key={`${query.query}-${index}`}
                  >
                    <strong title={query.query}>
                      {query.query}
                    </strong>

                    <span>
                      {query.clicks}
                    </span>

                    <span>
                      {formatPosition(
                        query.position
                      )}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>

      <div className="hub-overview-card hub-search-pages-card">
        <div className="hub-overview-card-header">
          <div>
            <h2>Top pages in Google</h2>

            <p>
              Pages receiving visibility from Google Search.
            </p>
          </div>
        </div>

        {searchConsole.topPages.length === 0 ? (
          <div className="hub-overview-empty">
            No Google page data yet.
          </div>
        ) : (
          <div className="hub-search-pages">
            {searchConsole.topPages.map(
              (page, index) => (
                <div
                  className="hub-search-page-row"
                  key={`${page.page}-${index}`}
                >
                  <div className="hub-top-page-rank">
                    {index + 1}
                  </div>

                  <div className="hub-search-page-main">
                    <strong
                      title={page.page}
                    >
                      {cleanSearchPage(
                        page.page
                      )}
                    </strong>

                    <span>
                      {page.impressions} impressions
                    </span>
                  </div>

                  <div className="hub-search-page-metric">
                    <strong>
                      {page.clicks}
                    </strong>

                    <span>
                      {page.clicks === 1
                        ? "click"
                        : "clicks"}
                    </span>
                  </div>

                  <div className="hub-search-page-metric">
                    <strong>
                      {formatPosition(
                        page.position
                      )}
                    </strong>

                    <span>
                      position
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* CRM ACTIVITY */}

      <div className="hub-overview-section-heading hub-activity-heading">
        <div>
          <span className="hub-overview-section-label">
            ACTIVITY
          </span>

          <h2>Recent activity</h2>
        </div>
      </div>

      <section className="hub-overview-grid">
        {/* RECENT LEADS */}

        <div className="hub-overview-card">
          <div className="hub-overview-card-header">
            <div>
              <h2>Recent leads</h2>

              <p>
                Latest business opportunities.
              </p>
            </div>

            <Link href="/hub/leads">
              View all
              <ArrowRight size={14} />
            </Link>
          </div>

          {recentLeads.length === 0 ? (
            <div className="hub-overview-empty">
              No leads yet.
            </div>
          ) : (
            <div className="hub-overview-list">
              {recentLeads.map((lead) => {
                const initials =
                  lead.contact.name
                    ? lead.contact.name
                        .split(" ")
                        .slice(0, 2)
                        .map(
                          (part) =>
                            part[0]
                        )
                        .join("")
                        .toUpperCase()
                    : lead.contact.email
                        .slice(0, 2)
                        .toUpperCase();

                return (
                  <Link
                    href={`/hub/leads/${lead.id}`}
                    className="hub-overview-row"
                    key={lead.id}
                  >
                    <div className="hub-overview-avatar">
                      {initials}
                    </div>

                    <div className="hub-overview-main">
                      <strong>
                        {lead.contact.name ||
                          lead.contact.email}
                      </strong>

                      <span>
                        {lead.service ||
                          "General enquiry"}
                      </span>
                    </div>

                    <span
                      className={`hub-lead-status hub-lead-status-${lead.status.toLowerCase()}`}
                    >
                      {lead.status}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* RECENT MESSAGES */}

        <div className="hub-overview-card">
          <div className="hub-overview-card-header">
            <div>
              <h2>Recent messages</h2>

              <p>
                Latest customer enquiries.
              </p>
            </div>

            <Link href="/hub/inbox">
              View inbox
              <ArrowRight size={14} />
            </Link>
          </div>

          {recentMessages.length === 0 ? (
            <div className="hub-overview-empty">
              No messages yet.
            </div>
          ) : (
            <div className="hub-overview-list">
              {recentMessages.map(
                (message) => (
                  <Link
                    href={`/hub/message/${message.id}`}
                    className="hub-overview-row"
                    key={message.id}
                  >
                    <div
                      className={`hub-overview-message-dot ${
                        !message.isRead
                          ? "hub-overview-message-dot-unread"
                          : ""
                      }`}
                    />

                    <div className="hub-overview-main">
                      <strong>
                        {message.fromName ||
                          message.fromEmail}
                      </strong>

                      <span>
                        {message.subject}
                      </span>
                    </div>

                    <time
                      dateTime={message.createdAt.toISOString()}
                    >
                      {formatDate(
                        message.createdAt
                      )}
                    </time>
                  </Link>
                )
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
