import { useDailyEntries } from "@/hooks/useDailyEntries";
import { useDailyMetrics } from "@/hooks/useDailyMetrics";
import { useTasksForDate } from "@/hooks/useTasks";
import { GoalBar } from "./GoalBar";
import { KpiCard } from "./KpiCard";
import { ChartCard } from "./ChartCard";
import { SignalSummary } from "./SignalSummary";
import { fmt, fmtD, shortDate, enrichAd, buildWeekly, yesterdayStr, formatReportingDate } from "@/lib/helpers";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";

const TARGET_MRR = 5218;
const COLORS = {
  accent: "#eb1495",
  blue: "#00bfff",
  green: "#00ccb1",
  amber: "#fedc01",
  purple: "#9250e2",
  teal: "#66ffeb",
};

export function OverviewTab() {
  const { data: daily = [] } = useDailyEntries();
  const { data: metrics = [] } = useDailyMetrics();
  const latest = daily[daily.length - 1];
  const latestDate = latest?.date || yesterdayStr();
  const { data: tasksForDate = [] } = useTasksForDate(latestDate);
  const latestEntry = daily.find((d) => d.date === latestDate);

  const latest = daily[daily.length - 1];
  const mrr = latest?.mrr || 0;

  // Totals from ads
  const totals = metrics.reduce(
    (acc, d) => {
      const e = enrichAd(d);
      acc.spend += e.spend;
      acc.revenue += e.revenue;
      acc.conversions += e.conversions;
      acc.t18 += e.t18;
      acc.t47 += e.t47;
      acc.t333 += e.t333;
      return acc;
    },
    { spend: 0, revenue: 0, conversions: 0, t18: 0, t47: 0, t333: 0 }
  );

  const mrrChange = daily.length >= 2 ? (((mrr - (daily[0].mrr || 0)) / (daily[0].mrr || 1)) * 100).toFixed(1) : null;
  const weekly = buildWeekly(metrics);

  const tierData = [
    { name: `$18/mo (${totals.t18})`, value: totals.t18, color: COLORS.amber },
    { name: `$47/mo (${totals.t47})`, value: totals.t47, color: COLORS.accent },
    { name: `$333/yr (${totals.t333})`, value: totals.t333, color: COLORS.green },
  ];

  return (
    <div>
      <GoalBar current={mrr} target={TARGET_MRR} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KpiCard label="Current MRR" value={fmt(mrr)} change={mrrChange ? `${Number(mrrChange) >= 0 ? "+" : ""}${mrrChange}% since ${daily[0]?.date}` : undefined} changeType={mrrChange && Number(mrrChange) >= 0 ? "positive" : "negative"} tilt={-0.5} />
        <KpiCard label="Members" value={latest?.members?.toString() || "—"} change="active members" tilt={0.5} />
        <KpiCard label="Retention" value={`${latest?.retention || 0}%`} change="current rate" tilt={-0.5} />
        <KpiCard label="Ad ROAS (All Time)" value={`${totals.spend > 0 ? (totals.revenue / totals.spend).toFixed(2) : "0"}x`} change={`${fmt(totals.spend)} spent total`} tilt={0.5} />
        <KpiCard label="Total Conversions" value={totals.conversions.toString()} change={`${totals.t47} premium, ${totals.t333} annual`} tilt={-0.5} />
        <KpiCard label="Avg. CAC" value={totals.conversions > 0 ? fmtD(totals.spend / totals.conversions) : "—"} change="cost per new member" tilt={0.5} />
      </div>

      {/* Strategic Snapshot */}
      <div className="memphis-card relative overflow-hidden rounded-lg border-4 border-foreground p-5 memphis-shadow mb-6" style={{ background: "linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(219,234,254,.35) 100%)" }}>
        <h3 className="font-fredoka text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-foreground" />
          Strategic Snapshot — <span className="text-primary">{formatReportingDate(latestDate)}</span>
        </h3>

        {/* CEO Notes Summary */}
        {latestEntry && (latestEntry.biggest_win || latestEntry.biggest_bottleneck || latestEntry.real_priority) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {latestEntry.biggest_win && (
              <div className="bg-card/80 rounded-xl border-2 border-foreground/10 px-4 py-3">
                <div className="font-space text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <span>🏆</span> Biggest Win
                </div>
                <p className="text-sm leading-relaxed text-foreground">{latestEntry.biggest_win}</p>
              </div>
            )}
            {latestEntry.biggest_bottleneck && (
              <div className="bg-card/80 rounded-xl border-2 border-foreground/10 px-4 py-3">
                <div className="font-space text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <span>🧱</span> Bottleneck
                </div>
                <p className="text-sm leading-relaxed text-foreground">{latestEntry.biggest_bottleneck}</p>
              </div>
            )}
            {latestEntry.real_priority && (
              <div className="bg-card/80 rounded-xl border-2 border-foreground/10 px-4 py-3">
                <div className="font-space text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <span>🎯</span> Real Priority
                </div>
                <p className="text-sm leading-relaxed text-foreground">{latestEntry.real_priority}</p>
              </div>
            )}
          </div>
        )}

        {/* Signal Summary (inline) */}
        <SignalSummary date={latestDate} daily={daily} tasks={tasksForDate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="MRR Trend">
          <ResponsiveContainer>
            <LineChart data={daily.map((d) => ({ date: shortDate(d.date), mrr: d.mrr }))}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => "$" + v} />
              <Tooltip formatter={(v: number) => ["$" + v.toLocaleString(), "MRR"]} />
              <Line type="monotone" dataKey="mrr" stroke={COLORS.accent} strokeWidth={2.5} dot={daily.length <= 30} fill={COLORS.accent + "20"} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Conversion Tier Mix (All Time)">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={tierData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="40%" outerRadius="70%" label>
                {tierData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6">
        <ChartCard title="Weekly Ad Spend vs Revenue" fullWidth>
          <ResponsiveContainer>
            <BarChart data={weekly}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => "$" + v} />
              <Tooltip formatter={(v: number) => "$" + v.toLocaleString()} />
              <Legend />
              <Bar dataKey="spend" name="Spend" fill={COLORS.blue + "BB"} radius={[4, 4, 0, 0]} />
              <Bar dataKey="revenue" name="Revenue" fill={COLORS.green + "BB"} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
