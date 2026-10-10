"use client";

import { useMemo, useState } from "react";
import {
  Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";

type GaPoint = { date: string; pageViews: number; sessions: number; visitors: number };
type SearchPoint = { date: string; clicks: number; impressions: number };

function normalizeDate(value: string) {
  const digits = value.replace(/-/g, "");
  return /^\d{8}$/.test(digits) ? digits : null;
}
function prettyDate(value: string) {
  const digits = normalizeDate(value);
  if (!digits) return value;
  const date = new Date(Date.UTC(Number(digits.slice(0, 4)), Number(digits.slice(4, 6)) - 1, Number(digits.slice(6, 8))));
  return new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short", timeZone: "UTC" }).format(date);
}
type SeriesKey = "pageViews" | "sessions" | "clicks" | "impressions";
const series: { key: SeriesKey; title: string; color: string; axis: "website" | "search" }[] = [
  { key: "pageViews", title: "Page views (GA4)", color: "#315cf5", axis: "website" },
  { key: "sessions", title: "Sessions (GA4)", color: "#21a3a1", axis: "website" },
  { key: "clicks", title: "Clicks (Search)", color: "#ec8b41", axis: "search" },
  { key: "impressions", title: "Impressions (Search)", color: "#8b6bd6", axis: "search" },
];

/** One timeline, but two labelled axes: GA4 volume and Search volume are not the same metric. */
export default function UnifiedAnalyticsChart({
  ga4, search, ga4Connected, searchConnected,
}: {
  ga4: GaPoint[]; search: SearchPoint[];
  ga4Connected: boolean; searchConnected: boolean;
}) {
  const [enabled, setEnabled] = useState<SeriesKey[]>(["pageViews", "sessions", "clicks", "impressions"]);
  const rows = useMemo(() => {
    const joined = new Map<string, Record<string, number | string>>();
    for (const point of ga4Connected ? ga4 : []) {
      const date = normalizeDate(point.date);
      if (!date) continue;
      joined.set(date, { ...(joined.get(date) ?? {}), date, pageViews: point.pageViews, sessions: point.sessions });
    }
    for (const point of searchConnected ? search : []) {
      const date = normalizeDate(point.date);
      if (!date) continue;
      joined.set(date, { ...(joined.get(date) ?? {}), date, clicks: point.clicks, impressions: point.impressions });
    }
    return [...joined.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .map((row) => ({ ...row, label: prettyDate(String(row.date)) }));
  }, [ga4, search, ga4Connected, searchConnected]);

  const available = series.filter((item) =>
    item.axis === "website" ? ga4Connected && ga4.length > 0 : searchConnected && search.length > 0
  );
  const toggle = (key: SeriesKey) =>
    setEnabled((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);

  return (
    <section className="sw-analytics-panel" aria-label="Website and search analytics">
      <div className="sw-analytics-heading">
        <div>
          <span className="sw-eyebrow">PERFORMANCE</span>
          <h2>Website &amp; Search</h2>
          <p>GA4 and Google Search Console on the same daily timeline · Last 30 days</p>
        </div>
        <span className="sw-analytics-period">30 days</span>
      </div>
      {(!ga4Connected || !searchConnected) && (
        <p className="sw-chart-notice" role="status">
          {!ga4Connected && !searchConnected
            ? "GA4 and Search Console are unavailable."
            : !ga4Connected ? "GA4 is unavailable; showing Search Console."
              : "Search Console is unavailable; showing GA4."}
        </p>
      )}
      <div className="sw-series-filters" role="group" aria-label="Visible chart metrics">
        {available.map((item) => (
          <button type="button" key={item.key} onClick={() => toggle(item.key)}
            aria-pressed={enabled.includes(item.key)}
            className={`sw-series-toggle ${enabled.includes(item.key) ? "is-active" : ""}`}>
            <span className="sw-series-dot" style={{ backgroundColor: item.color }} />
            {item.title}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <div className="sw-chart-empty" role="status">No analytics data available for this period.</div>
      ) : (
        <>
          <div className="sw-unified-chart" role="img" aria-label="Daily GA4 website traffic and Google Search performance; two separate numerical axes">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows} margin={{ top: 12, right: 6, left: 0, bottom: 4 }}>
                <CartesianGrid stroke="#e6ecf5" strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis yAxisId="website" orientation="left" allowDecimals={false}
                  tick={{ fill: "#5b6a81", fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
                <YAxis yAxisId="search" orientation="right" allowDecimals={false}
                  tick={{ fill: "#795da6", fontSize: 11 }} axisLine={false} tickLine={false} width={42} />
                <Tooltip contentStyle={{ border: "1px solid #dfe6f0", borderRadius: 12, fontSize: 12 }} />
                <Legend verticalAlign="bottom" iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                {series.filter((item) => enabled.includes(item.key) && available.some((v) => v.key === item.key)).map((item) => (
                  <Area key={item.key} yAxisId={item.axis} type="monotone"
                    dataKey={item.key} name={item.title}
                    stroke={item.color} strokeWidth={2.3} fill="none"
                    connectNulls={false} dot={false} activeDot={{ r: 4 }}
                    isAnimationActive={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="sw-chart-footnote">Left axis: GA4 page views / sessions · Right axis: Search Console clicks / impressions. Missing dates are not treated as zero.</p>
        </>
      )}
    </section>
  );
}
