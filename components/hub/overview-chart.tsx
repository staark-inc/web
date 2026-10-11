"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrafficPoint = {
  date: string;
  visitors: number;
  sessions: number;
  pageViews: number;
};

type SearchPoint = {
  date: string;
  clicks: number;
  impressions: number;
};

type ChartProps = {
  kind: "traffic";
  data: TrafficPoint[];
} | {
  kind: "search";
  data: SearchPoint[];
};

function dateLabel(raw: string) {
  const digits = raw.replace(/-/g, "");
  if (!/^\d{8}$/.test(digits)) return raw;
  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  return new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short" })
    .format(new Date(year, month - 1, day));
}

export default function OverviewChart(props: ChartProps) {
  const isTraffic = props.kind === "traffic";
  const points = useMemo(
    () => props.data.map((row) => ({ ...row, label: dateLabel(row.date) })),
    [props.data],
  );
  if (!points.length) {
    return (
      <div className="sw-chart-empty" role="status">
        {isTraffic ? "No website traffic yet." : "No search data yet."}
      </div>
    );
  }

  return (
    <div className="sw-chart" role="img" aria-label={
      isTraffic
        ? "Daily website page views and sessions over the last 30 days"
        : "Daily Google Search impressions and clicks over the last 30 days"
    }>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 12, right: 8, left: -16, bottom: 2 }}>
          <defs>
            <linearGradient id={isTraffic ? "sw-traffic-fill" : "sw-search-fill"} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#315cf5" stopOpacity={0.23} />
              <stop offset="95%" stopColor="#315cf5" stopOpacity={0.015} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e9eef6" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={28} />
          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={42} />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #dfe6f0",
              boxShadow: "0 12px 30px rgba(14, 26, 49, .1)",
              fontSize: 12,
            }}
            labelStyle={{ color: "#172238", fontWeight: 650 }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
          {isTraffic ? (
            <>
              <Area name="Page views" type="monotone" dataKey="pageViews" stroke="#315cf5" strokeWidth={2.5}
                fill="url(#sw-traffic-fill)" dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
              <Area name="Sessions" type="monotone" dataKey="sessions" stroke="#21a3a1" strokeWidth={2}
                fill="transparent" dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
            </>
          ) : (
            <>
              <Area name="Impressions" type="monotone" dataKey="impressions" stroke="#315cf5" strokeWidth={2.5}
                fill="url(#sw-search-fill)" dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
              <Area name="Clicks" type="monotone" dataKey="clicks" stroke="#21a3a1" strokeWidth={2}
                fill="transparent" dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
            </>
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
