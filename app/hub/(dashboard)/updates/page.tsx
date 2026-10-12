import NewsAction from "@/components/news/NewsAction";
import { WorkspaceTabs } from "@/components/hub/WorkspaceTabs";
import { WorkspacePage, PageHeader, Metrics, Metric, ActionLink, StatusBadge, ListCard, ListCardHeader, ListCardFacts, ListCardFact, ListCardFooter } from "@/components/hub/workspace";
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
    <WorkspacePage className="hub-updates-page sw-operations-page">
      <PageHeader
        eyebrow="PLATFORM / COMMUNICATION"
        title="News & Updates"
        description="Publish product news, feature releases and service announcements directly to tenant dashboards."
        action={<ActionLink href="/hub/updates/new"><Plus size={16}/> New update</ActionLink>}
      />
      <Metrics label="News overview">
        <Metric label="Total updates" value={allUpdates.length} description="All announcements" icon={<Megaphone size={18}/>}/>
        <Metric label="Published" value={publishedCount} description="Visible to tenants" icon={<Radio size={18}/>}/>
        <Metric label="Drafts" value={draftCount} description="Waiting for review" icon={<FilePenLine size={18}/>}/>
        <Metric label="Audience" value="All plans" description="Or target one package" icon={<BellRing size={18}/>}/>
      </Metrics>

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

      <WorkspaceTabs
        label="Update filters"
        activeKey={active}
        tabs={FILTERS.map(value=>({
          key:value,
          label:value==='ALL'?'All':value==='PUBLISHED'?'Published':'Drafts',
          href:'/hub/updates?'+new URLSearchParams({status:value,q:query,kind:selectedKind??''}).toString(),
          count:countFor(value),
        }))}
      />

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
        <section className="sw-list-card-stack" aria-label="News and updates">
          {updates.map(update => (
            <ListCard key={update.id}>
              <ListCardHeader
                icon={<Megaphone size={19}/>}
                title={<Link href={'/hub/updates/'+update.id}>{update.pinned?'📌 ':''}{update.title}</Link>}
                subtitle={<span>{update.summary}</span>}
                status={<StatusBadge tone={update.published?'success':'neutral'}>{update.published?'Published':'Draft'}</StatusBadge>}
              />
              <ListCardFacts>
                <ListCardFact label="Audience"><strong>{audienceLabel(update.audiencePlan)}</strong></ListCardFact>
                <ListCardFact label="Type"><strong>{kindLabel(update.kind)}</strong></ListCardFact>
                <ListCardFact label={update.published?'Published':'Created'}><time dateTime={(update.published&&update.publishedAt?update.publishedAt:update.createdAt).toISOString()}>{formatDate(update.published?update.publishedAt:update.createdAt)}</time></ListCardFact>
              </ListCardFacts>
              <ListCardFooter>
                <Link href={'/hub/updates/'+update.id}>Edit & preview</Link>
                <div className="sw-list-card-footer-actions">
                  <NewsAction id={update.id} title={update.title} action={update.published?'unpublish':'publish'}/>
                  <NewsAction id={update.id} title={update.title} action="delete"/>
                </div>
              </ListCardFooter>
            </ListCard>
          ))}
        </section>
      )}
    </WorkspacePage>
  );
}
