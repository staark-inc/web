"use client";

import {
  ArrowRight,
  CalendarClock,
  CircleDollarSign,
  Sparkles,
  Target,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { useState } from "react";

import {
  ActionLink,
  Button,
  Card,
  Metric,
  Metrics,
  PageHeader,
  StatusBadge,
} from "@/components/hub/ui";

import {
  formatPreviewAmount,
  previewActivity,
  previewAttention,
  previewSources,
  previewTrendLabels,
  previewTrendSeries,
  type PreviewTrendRange,
} from "../preview-data";
import type { PreviewSectionId } from "../preview-sections";
import styles from "../preview.module.css";

const chartWidth = 640;
const chartHeight = 220;
const chartPadding = 18;

function TrendChart({ range }: { range: PreviewTrendRange }) {
  const values = previewTrendSeries[range];
  const max = Math.max(...values) * 1.12;
  const points = values.map((value, index) => {
    const x = chartPadding + (index / (values.length - 1)) * (chartWidth - chartPadding * 2);
    const y = chartHeight - chartPadding - (value / max) * (chartHeight - chartPadding * 2);
    return { x, y, value };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `M ${chartPadding} ${chartHeight - chartPadding} L ${line.replaceAll(" ", " L ")} L ${chartWidth - chartPadding} ${chartHeight - chartPadding} Z`;
  const last = points[points.length - 1];
  const labelIndexes = [0, 3, 6, 9, 11];

  return (
    <div className={styles.chartPlot}>
      <svg
        className={styles.chartSvg}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label={`Qualified lead trend for the last ${range}, ending at ${values[values.length - 1]} qualified leads.`}
      >
        <defs>
          <linearGradient id="preview-trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#315cf5" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#315cf5" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((lineIndex) => {
          const y = chartPadding + (lineIndex / 3) * (chartHeight - chartPadding * 2);
          return (
            <line
              key={lineIndex}
              x1={chartPadding}
              x2={chartWidth - chartPadding}
              y1={y}
              y2={y}
              className={styles.chartGridLine}
            />
          );
        })}
        <path d={area} fill="url(#preview-trend-fill)" />
        <polyline points={line} className={styles.chartLine} />
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={index === points.length - 1 ? 4.5 : 2.5}
            className={styles.chartPoint}
          />
        ))}
        <circle cx={last.x} cy={last.y} r="9" className={styles.chartPulse} />
      </svg>
      <div className={styles.chartLabels}>
        {labelIndexes.map((index) => (
          <span key={index}>{previewTrendLabels[index]}</span>
        ))}
      </div>
    </div>
  );
}

export function DashboardSection({
  onNavigate,
}: {
  onNavigate: (section: PreviewSectionId) => void;
}) {
  const [range, setRange] = useState<PreviewTrendRange>("30d");
  const currentValue = previewTrendSeries[range][previewTrendSeries[range].length - 1];

  return (
    <div className={styles.sectionStack}>
      <PageHeader
        className={styles.pageHeader}
        eyebrow="WORKSPACE / OVERVIEW"
        title="Good morning, Alexandra"
        description="A calm operational view of pipeline, delivery and the work that needs attention today."
        action={
          <ActionLink
            href="/hub/design-preview?section=collection"
            onClick={(event) => {
              event.preventDefault();
              onNavigate("collection");
            }}
          >
            Review pipeline
            <ArrowRight size={16} aria-hidden="true" />
          </ActionLink>
        }
      />

      <Metrics label="Workspace overview">
        <Metric
          label="Open pipeline"
          value="SEK 1.41M"
          description="+12.4% vs last month"
          icon={<CircleDollarSign size={18} />}
        />
        <Metric
          label="New leads"
          value="24"
          description="8 need qualification"
          icon={<Target size={18} />}
        />
        <Metric
          label="Active clients"
          value="38"
          description="4 reviews this week"
          icon={<UsersRound size={18} />}
        />
        <Metric
          label="Qualified leads"
          value={currentValue}
          description="Last 30 days trend"
          icon={<TrendingUp size={18} />}
        />
      </Metrics>

      <div className={styles.dashboardGrid}>
        <Card padding="none" className={styles.chartCard}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.eyebrow}>PIPELINE SIGNAL</span>
              <h2>Qualified leads</h2>
              <p>Movement from first conversation to sales-ready opportunity.</p>
            </div>
            <div className={styles.rangeGroup} role="group" aria-label="Chart range">
              {(["7d", "30d", "90d"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`${styles.rangeButton} ${range === option ? styles.rangeActive : ""}`}
                  aria-pressed={range === option}
                  onClick={() => setRange(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.chartSummary}>
            <strong>{currentValue}</strong>
            <StatusBadge tone="success" icon={<TrendingUp size={13} />}>+18%</StatusBadge>
            <span>qualified leads this period</span>
          </div>
          <div className={styles.chartWrap}>
            <TrendChart range={range} />
          </div>
          <div className={styles.chartFooter}>
            <span className={styles.legendItem}>
              <span className={styles.legendDot} /> Qualified leads
            </span>
            <span>Updated 09:41 · static preview data</span>
          </div>
        </Card>

        <Card padding="none" className={styles.attentionCard}>
          <div className={styles.panelHeaderCompact}>
            <div>
              <span className={styles.eyebrow}>ATTENTION</span>
              <h2>Needs a decision</h2>
            </div>
            <span className={styles.countBadge}>4</span>
          </div>
          <div className={styles.attentionList}>
            {previewAttention.map((item) => (
              <button
                type="button"
                key={item.title}
                className={styles.attentionItem}
                onClick={() => onNavigate(item.section)}
              >
                <span className={`${styles.attentionDot} ${styles[`tone-${item.tone}`]}`} aria-hidden="true" />
                <span className={styles.attentionCopy}>
                  <strong>{item.title}</strong>
                  <small>{item.meta}</small>
                </span>
                <ArrowRight size={15} aria-hidden="true" />
              </button>
            ))}
          </div>
          <div className={styles.panelFooter}>
            <Button variant="secondary" size="sm" onClick={() => onNavigate("detail")}>
              Open priority record
            </Button>
          </div>
        </Card>
      </div>

      <div className={styles.dashboardLowerGrid}>
        <Card padding="none">
          <div className={styles.panelHeaderCompact}>
            <div>
              <span className={styles.eyebrow}>ACTIVITY</span>
              <h2>Latest movement</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("detail")}>
              View all
            </Button>
          </div>
          <div className={styles.activityList}>
            {previewActivity.map((item) => (
              <div className={styles.activityItem} key={item.title}>
                <span className={styles.activityAvatar}>{item.initials}</span>
                <span className={styles.activityCopy}>
                  <strong>{item.title}</strong>
                  <small>{item.meta}</small>
                </span>
                <StatusBadge tone={item.tone}>{item.tone === "success" ? "Done" : "New"}</StatusBadge>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="none">
          <div className={styles.panelHeaderCompact}>
            <div>
              <span className={styles.eyebrow}>SOURCE MIX</span>
              <h2>Where pipeline comes from</h2>
            </div>
            <Sparkles size={18} className={styles.panelIcon} aria-hidden="true" />
          </div>
          <div className={styles.sourceList}>
            {previewSources.map((source) => (
              <div className={styles.sourceItem} key={source.label}>
                <div className={styles.sourceHead}>
                  <span>{source.label}</span>
                  <strong>{source.value}%</strong>
                </div>
                <div className={styles.sourceTrack}>
                  <span
                    className={`${styles.sourceBar} ${styles[`source-${source.color}`]}`}
                    style={{ width: `${source.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className={styles.panelFooter}>
            <span className={styles.footnote}>
              <CalendarClock size={15} aria-hidden="true" />
              Snapshot for the last 30 days
            </span>
          </div>
        </Card>
      </div>

      <Card className={styles.insightCard}>
        <div className={styles.insightIcon}>
          <TrendingUp size={20} aria-hidden="true" />
        </div>
        <div>
          <span className={styles.eyebrow}>PREVIEW INSIGHT</span>
          <h2>Pipeline quality is improving, but follow-up is uneven.</h2>
          <p>
            Referral leads convert 1.7× faster than outbound. The next design pass should make
            ownership and the next action visible in every list row.
          </p>
        </div>
        <Button variant="secondary" onClick={() => onNavigate("collection")}>
          Inspect collection
        </Button>
      </Card>

      <p className={styles.dataNote}>
        All dashboard values are deterministic mock data. No Prisma query, analytics call or external request is made.
      </p>
      <span className={styles.srOnly}>{formatPreviewAmount(1410000)} open pipeline.</span>
    </div>
  );
}
