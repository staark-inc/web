import Link from "next/link";
import UnifiedAnalyticsChart from "@/components/hub/unified-analytics-chart";
import { PageHeader, Metrics, Metric, SectionHeader, EmptyState, InfoChip } from "@/components/hub/workspace";

import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  Eye,
  FolderKanban,
  GitCommitHorizontal,
  LifeBuoy,
  MailPlus,
  MousePointerClick,
  Plus,
  Target,
  Users,
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

  return (
    <main className="hub-page sw-page sw-overview-layout">
      <PageHeader
        eyebrow="STAARK WORKSPACE"
        title="Overview"
        description={formatDashboardDate(now)}
        action={
          <div className="sw-overview-actions">
            <Link href="/hub/offers/new" className="sw-overview-primary"><Plus size={16} /> New offer</Link>
            <Link href="/hub/compose" className="sw-overview-secondary"><MailPlus size={15} /> Compose</Link>
            <Link href="/hub/projects/new" className="sw-overview-secondary"><FolderKanban size={15} /> New project</Link>
          </div>
        }
      />

      <Metrics label="Business performance">
        <Metric label="Live proposal value" value={formatMoneyOre(liveOfferValueOre)}
          description={`${liveOfferCount} open proposals`} icon={<CircleDollarSign size={18}/>} />
        <Metric label="Active projects" value={activeProjectCount}
          description={overdueProjectCount ? `${overdueProjectCount} overdue` : "On schedule"}
          icon={<FolderKanban size={18}/>} />
        <Metric label="New leads" value={newLeadCount} description={`${wonThisMonth} won this month`}
          icon={<Target size={18}/>} />
        <Metric label="Open support" value={openSupportCount}
          description={urgentSupportCount ? `${urgentSupportCount} urgent` : "No urgent tickets"}
          icon={<LifeBuoy size={18}/>} />
      </Metrics>

      <div className="sw-overview-primary-grid">
        <section className="sw-overview-panel sw-priority-panel" aria-label="Needs attention">
          <div className="sw-overview-panel-heading">
            <div><span className="sw-eyebrow">YOUR PRIORITIES</span><h2>Needs attention</h2></div>
            <span className="sw-attention-counter">{attentionCount}</span>
          </div>
          {attentionItems.length ? (
            <div className="sw-priority-list">
              {attentionItems.map(item => (
                <Link href={item.href} key={item.label} className="sw-priority-item">
                  <span className={`sw-priority-marker sw-priority-${item.tone}`} />
                  <span className="sw-priority-text"><strong>{item.label}</strong><small>{item.detail}</small></span>
                  <ArrowRight size={16} aria-hidden="true"/>
                </Link>
              ))}
            </div>
          ) : <div className="sw-overview-clear"><CheckCircle2 size={20}/><span>All caught up. No urgent items right now.</span></div>}
          <Link href="/hub/inbox" className="sw-overview-text-link">Open inbox <ArrowRight size={15}/></Link>
        </section>
        <section className="sw-overview-panel sw-sales-panel" aria-label="Monthly sales">
          <div className="sw-overview-panel-heading"><div><span className="sw-eyebrow">SALES SNAPSHOT</span><h2>This month</h2></div><CircleDollarSign size={18}/></div>
          <span className="sw-sales-label">Accepted offer value</span>
          <strong className="sw-sales-value">{formatMoneyOre(acceptedThisMonthValueOre)}</strong>
          <p className="sw-sales-note">{acceptedThisMonthCount} accepted offer{acceptedThisMonthCount === 1 ? "" : "s"}</p>
          <div className="sw-sales-breakdown">
            <div><span>New leads</span><strong>{newLeadCount}</strong></div>
            <div><span>Won leads</span><strong>{wonThisMonth}</strong></div>
            <div><span>Contacts</span><strong>{contactCount}</strong></div>
          </div>
          <Link href="/hub/offers" className="sw-overview-text-link">View sales pipeline <ArrowRight size={15}/></Link>
        </section>
      </div>

      <SectionHeader title="Analytics" description="Your website audience and Google Search performance, together."/>
      {(!analyticsResult.connected || !searchConsoleResult.connected) && (
        <div className="sw-source-warning" role="status">
          <span>{!analyticsResult.connected && !searchConsoleResult.connected ? "Analytics connections unavailable."
            : !analyticsResult.connected ? "GA4 connection unavailable." : "Search Console connection unavailable."}</span>
          <Link href="/api/hub/google/connect">Reconnect Google</Link>
        </div>
      )}
      <div className="sw-analytics-summary" aria-label="Analytics summary">
        <Metric label="Visitors" value={analytics.visitors} description="GA4 active users" icon={<Users size={16}/>} />
        <Metric label="Page views" value={analytics.pageViews} description="Public website" icon={<Eye size={16}/>} />
        <Metric label="Search clicks" value={searchConsole.clicks} description="Google Search" icon={<MousePointerClick size={16}/>} />
        <Metric label="Search impressions" value={searchConsole.impressions} description="Google Search" icon={<BarChart3 size={16}/>} />
      </div>
      <UnifiedAnalyticsChart
        ga4={analytics.dailyTraffic}
        search={searchConsole.dailyTraffic}
        ga4Connected={analyticsResult.connected}
        searchConnected={searchConsoleResult.connected}
      />
      <div className="sw-overview-secondary-grid">
        <section className="sw-overview-panel" aria-label="Top website pages">
          <div className="sw-overview-panel-heading">
            <div><span className="sw-eyebrow">GOOGLE ANALYTICS</span><h2>Top pages</h2></div>
            <span className="sw-panel-micro">Page views</span>
          </div>
          {analytics.topPages.length ? (
            <div className="sw-simple-list">
              {analytics.topPages.slice(0, 6).map((page, index) => (
                <div className="sw-simple-row" key={page.path + index}>
                  <span className="sw-simple-rank">{index + 1}</span>
                  <span className="sw-simple-main"><strong>{page.path}</strong><small>{page.title}</small></span>
                  <strong className="sw-simple-value">{page.views}</strong>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No page data" description="Popular pages will appear here when GA4 reports traffic." />}
        </section>
        <section className="sw-overview-panel" aria-label="Top search queries">
          <div className="sw-overview-panel-heading">
            <div><span className="sw-eyebrow">SEARCH CONSOLE</span><h2>Top queries</h2></div>
            <span className="sw-panel-micro">Clicks</span>
          </div>
          {searchConsole.topQueries.length ? (
            <div className="sw-simple-list">
              {searchConsole.topQueries.slice(0, 6).map((query, index) => (
                <div className="sw-simple-row" key={query.query + index}>
                  <span className="sw-simple-rank">{index + 1}</span>
                  <span className="sw-simple-main"><strong>{query.query}</strong><small>Avg. position {formatPosition(query.position)}</small></span>
                  <strong className="sw-simple-value">{query.clicks}</strong>
                </div>
              ))}
            </div>
          ) : <EmptyState title="No search queries" description="Your Google Search queries will appear here." />}
        </section>
      </div>

      <SectionHeader title="Operations" description="Production status and latest customer activity."/>
      <div className="sw-overview-operations-grid">
        <section className="sw-overview-panel" aria-label="Production deployment">
          <div className="sw-overview-panel-heading">
            <div><span className="sw-eyebrow">GITHUB DEPLOYMENT</span><h2>Production</h2></div>
            <InfoChip tone={workflowStatus.className === "healthy" ? "success" : workflowStatus.className === "failed" ? "warning" : "neutral"}>
              {githubResult.connected ? workflowStatus.label : "Unavailable"}
            </InfoChip>
          </div>
          {github ? (
            <div className="sw-deploy-info">
              <strong>{github.workflow?.name ?? "Production deployment"}</strong>
              <p>{workflowStatus.description}</p>
              <span className="sw-deploy-branch"><GitCommitHorizontal size={14}/>{github.branch.name} · {github.commit.shortSha}</span>
              <strong className="sw-deploy-message">{github.commit.message}</strong>
              <small>{github.commit.author} · {formatDeploymentDate(github.commit.date)}</small>
              <div className="sw-deploy-links">
                <a href={github.commit.url} target="_blank" rel="noreferrer">View commit <ExternalLink size={13}/></a>
                {github.workflow && <a href={github.workflow.url} target="_blank" rel="noreferrer">View workflow <ExternalLink size={13}/></a>}
              </div>
            </div>
          ) : <EmptyState title="GitHub unavailable" description="We could not retrieve the latest production deployment." />}
        </section>
        <section className="sw-overview-panel" aria-label="Recent leads">
          <div className="sw-overview-panel-heading">
            <div><span className="sw-eyebrow">CUSTOMER RELATIONSHIPS</span><h2>Recent leads</h2></div>
            <Link href="/hub/leads" className="sw-overview-text-link">View all <ArrowRight size={14}/></Link>
          </div>
          {recentLeads.length ? (
            <div className="sw-simple-list">
              {recentLeads.map(lead => (
                <Link href={`/hub/leads/${lead.id}`} key={lead.id} className="sw-simple-row sw-link-row">
                  <span className="sw-simple-avatar"><Users size={16}/></span>
                  <span className="sw-simple-main"><strong>{lead.contact.name || lead.contact.email || lead.contact.phone || lead.contact.facebook || "Unknown contact"}</strong><small>{lead.service || "General enquiry"}</small></span>
                  <InfoChip tone={lead.status === "WON" ? "success" : lead.status === "NEW" ? "info" : "neutral"}>{lead.status}</InfoChip>
                </Link>
              ))}
            </div>
          ) : <EmptyState title="No leads yet" description="New opportunities will appear here." />}
        </section>
        <section className="sw-overview-panel" aria-label="Recent messages">
          <div className="sw-overview-panel-heading">
            <div><span className="sw-eyebrow">COMMUNICATION</span><h2>Recent messages</h2></div>
            <Link href="/hub/inbox" className="sw-overview-text-link">View inbox <ArrowRight size={14}/></Link>
          </div>
          {recentMessages.length ? (
            <div className="sw-simple-list">
              {recentMessages.map(message => (
                <Link href={`/hub/message/${message.id}`} key={message.id} className="sw-simple-row sw-link-row">
                  <span className={`sw-message-dot ${message.isRead ? "" : "is-unread"}`}/>
                  <span className="sw-simple-main"><strong>{message.fromName || message.fromEmail}</strong><small>{message.subject}</small></span>
                  <time className="sw-message-date" dateTime={message.createdAt.toISOString()}>{formatDate(message.createdAt)}</time>
                </Link>
              ))}
            </div>
          ) : <EmptyState title="No messages yet" description="Customer messages will appear here." />}
        </section>
      </div>
    </main>
  );
}
