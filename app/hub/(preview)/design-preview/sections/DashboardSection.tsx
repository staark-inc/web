"use client";

import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ArrowRight,
  Target,
  TrendingUp,
  UsersRound,
} from "lucide-react";
import { useState } from "react";

import {
  Button,
  Card,
  PageHeader,
  StatusBadge,
} from "@/components/hub/ui";

import {
  previewActivity,
  previewAttention,
  previewSources,
  previewTrendSeries,
  type PreviewTrendRange,
} from "../preview-data";
import type { PreviewSectionId } from "../preview-sections";
import styles from "../preview.module.css";

const chartWidth = 360;
const chartHeight = 112;
const chartPadding = 8;

const priorityLabels = {
  danger: "Critical",
  warning: "Due today",
  info: "Review",
  success: "Clear",
} as const;

function HeroChart({ range }: { range: PreviewTrendRange }) {
  const values = previewTrendSeries[range];
  const max = Math.max(...values) * 1.12;
  const points = values.map((value, index) => {
    const x = chartPadding + (index / (values.length - 1)) * (chartWidth - chartPadding * 2);
    const y = chartHeight - chartPadding - (value / max) * (chartHeight - chartPadding * 2);
    return { x, y };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `M ${chartPadding} ${chartHeight - chartPadding} L ${line.replaceAll(" ", " L ")} L ${chartWidth - chartPadding} ${chartHeight - chartPadding} Z`;
  const last = points[points.length - 1];

  return (
    <svg
      className={styles.heroChartSvg}
      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
      role="img"
      aria-label={`Pipeline trend for the last ${range}, ending at ${values[values.length - 1]} qualified opportunities.`}
    >
      {[0, 1, 2].map((lineIndex) => {
        const y = chartPadding + (lineIndex / 2) * (chartHeight - chartPadding * 2);
        return (
          <line
            key={lineIndex}
            x1={chartPadding}
            x2={chartWidth - chartPadding}
            y1={y}
            y2={y}
            className={styles.heroChartGrid}
          />
        );
      })}
      <path d={area} className={styles.heroChartArea} />
      <polyline points={line} className={styles.heroChartLine} />
      <circle cx={last.x} cy={last.y} r="4" className={styles.heroChartPoint} />
      <circle cx={last.x} cy={last.y} r="10" className={styles.heroChartSignal} />
    </svg>
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
        eyebrow="NOVEMBER / OPERATIONS"
        title="Good morning, Alexandra"
        description="A live operational view of the pipeline, the decisions waiting today and the work that keeps delivery moving."
        action={
          <div className={styles.headerActions}>
            <Button type="button" variant="secondary" onClick={() => onNavigate("detail")}>
              Open priorities
            </Button>
            <Button type="button" onClick={() => onNavigate("collection")}>
              Open pipeline
              <ArrowUpRight size={16} aria-hidden="true" />
            </Button>
          </div>
        }
      />

      <div className={styles.heroGrid}>
        <section className={styles.heroPanel} aria-labelledby="pipeline-hero-title">
          <div className={styles.heroHeader}>
            <div>
              <span className={styles.heroEyebrow}>
                <span className={styles.signalDot} aria-hidden="true" />
                LIVE PIPELINE
              </span>
              <p>Commercial momentum, not vanity metrics.</p>
            </div>
            <div className={styles.heroRange} role="group" aria-label="Pipeline chart period">
              {(["7d", "30d", "90d"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`${styles.heroRangeButton} ${range === option ? styles.heroRangeActive : ""}`}
                  aria-pressed={range === option}
                  onClick={() => setRange(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.heroMain}>
            <div className={styles.heroValueBlock}>
              <span>Open pipeline</span>
              <strong id="pipeline-hero-title">
                <span className={styles.heroCurrency}>SEK</span>
                2.48M
              </strong>
              <div className={styles.heroDelta}>
                <TrendingUp size={16} aria-hidden="true" />
                <strong>+18.2%</strong>
                <span>vs previous period</span>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => onNavigate("collection")}>
                Inspect opportunities
                <ArrowRight size={15} aria-hidden="true" />
              </Button>
            </div>
            <div className={styles.heroChartWrap}>
              <div className={styles.heroChartTopline}>
                <span>Qualified opportunities</span>
                <strong>{currentValue}</strong>
              </div>
              <HeroChart range={range} />
              <div className={styles.heroChartRange}>Sep 1 — Oct 4 · static preview data</div>
            </div>
          </div>

          <div className={styles.heroFooter}>
            <span><span className={styles.heroFooterNumber}>14</span> opportunities need a next step</span>
            <span><span className={styles.heroFooterNumber}>4</span> high-priority decisions</span>
            <span className={styles.heroFooterLink}>Updated 09:41</span>
          </div>
        </section>

        <section className={styles.priorityPanel} aria-labelledby="priority-title">
          <header className={styles.priorityHeader}>
            <div>
              <span className={styles.eyebrow}>ACTION QUEUE</span>
              <h2 id="priority-title">Priority queue</h2>
            </div>
            <span className={styles.queueCount}>4</span>
          </header>
          <div className={styles.priorityList}>
            {previewAttention.map((item, index) => (
              <button
                type="button"
                key={item.title}
                className={styles.priorityItem}
                onClick={() => onNavigate(item.section)}
              >
                <span className={`${styles.priorityRail} ${styles[`tone-${item.tone}`]}`} aria-hidden="true" />
                <span className={styles.priorityRank}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.priorityCopy}>
                  <strong>{item.title}</strong>
                  <small>{item.meta}</small>
                </span>
                <span className={styles.priorityMeta}>
                  <span className={`${styles.priorityLabel} ${styles[`toneText-${item.tone}`]}`}>
                    {priorityLabels[item.tone]}
                  </span>
                  <ArrowRight size={14} aria-hidden="true" />
                </span>
              </button>
            ))}
          </div>
          <footer className={styles.priorityFooter}>
            <button type="button" onClick={() => onNavigate("detail")}>
              Open full priority view
              <ArrowUpRight size={15} aria-hidden="true" />
            </button>
          </footer>
        </section>
      </div>

      <Card padding="none" className={styles.kpiRail}>
        <div className={styles.kpiModule}>
          <span className={styles.kpiIcon}><Target size={17} aria-hidden="true" /></span>
          <span className={styles.kpiLabel}>New leads</span>
          <strong>24</strong>
          <small className={styles.kpiPositive}>+6 this week</small>
        </div>
        <div className={styles.kpiModule}>
          <span className={styles.kpiIcon}><UsersRound size={17} aria-hidden="true" /></span>
          <span className={styles.kpiLabel}>Active clients</span>
          <strong>38</strong>
          <small>4 reviews this week</small>
        </div>
        <div className={styles.kpiModule}>
          <span className={styles.kpiIcon}><CircleDollarSign size={17} aria-hidden="true" /></span>
          <span className={styles.kpiLabel}>Qualified opportunities</span>
          <strong>69</strong>
          <small className={styles.kpiSignal}><span aria-hidden="true" /> 12 are offer-ready</small>
        </div>
        <div className={`${styles.kpiModule} ${styles.kpiProgressModule}`}>
          <span className={styles.kpiIcon}><CheckCircle2 size={17} aria-hidden="true" /></span>
          <span className={styles.kpiLabel}>Delivery progress</span>
          <strong>72%</strong>
          <span className={styles.kpiProgress}><span style={{ width: "72%" }} /></span>
        </div>
      </Card>

      <div className={styles.lowerGrid}>
        <Card padding="none" className={styles.activityPanel}>
          <div className={styles.panelHeaderCompact}>
            <div>
              <span className={styles.eyebrow}>LIVE ACTIVITY</span>
              <h2>What changed</h2>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => onNavigate("detail")}>
              View timeline
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

        <Card padding="none" className={styles.sourcePanel}>
          <div className={styles.panelHeaderCompact}>
            <div>
              <span className={styles.eyebrow}>PIPELINE SOURCE</span>
              <h2>Where it comes from</h2>
            </div>
            <CalendarClock size={18} className={styles.panelIcon} aria-hidden="true" />
          </div>
          <div className={styles.sourceBar} aria-hidden="true">
            {previewSources.map((source) => (
              <span
                key={source.label}
                className={styles[`source-${source.color}`]}
                style={{ width: `${source.value}%` }}
              />
            ))}
          </div>
          <div className={styles.sourceLegend}>
            {previewSources.map((source) => (
              <div key={source.label}>
                <span className={`${styles.sourceDot} ${styles[`source-${source.color}`]}`} />
                <span>{source.label}</span>
                <strong>{source.value}%</strong>
              </div>
            ))}
          </div>
          <div className={styles.sourceFooter}>
            <span>Referrals convert 1.7× faster than outbound.</span>
            <button type="button" onClick={() => onNavigate("collection")}>
              Inspect source data <ArrowUpRight size={14} aria-hidden="true" />
            </button>
          </div>
        </Card>
      </div>

      <p className={styles.dataNote}>
        All dashboard values are deterministic mock data. No Prisma query, analytics call or external request is made.
      </p>
    </div>
  );
}
