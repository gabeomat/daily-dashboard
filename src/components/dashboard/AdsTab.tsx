import { useState } from "react";
import { useDailyMetrics, useUpsertDailyMetric } from "@/hooks/useDailyMetrics";
import { KpiCard } from "./KpiCard";
import { ChartCard } from "./ChartCard";
import { fmt, fmtD, shortDate, enrichAd, buildWeekly, yesterdayStr, formatReportingDate } from "@/lib/helpers";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = { accent: "#eb1495", blue: "#00bfff", green: "#00ccb1", amber: "#fedc01", purple: "#7624db" };

export function AdsTab() {
  const { data: metrics = [] } = useDailyMetrics();
  const upsert = useUpsertDailyMetric();
  const [date, setDate] = useState(yesterdayStr());
  const [form, setForm] = useState({ ad_spend: "", t18: "0", t47: "0", t333: "0" });
  const [period, setPeriod] = useState("all");

  const existing = metrics.find((d) => d.date === date);

  const handleSave = () => {
    if (!date) { toast.error("Please select a date"); return; }
    const spend = parseFloat(form.ad_spend);
    if (isNaN(spend)) { toast.error("Please enter ad spend"); return; }
    upsert.mutate({ date, ad_spend: spend, t18: parseInt(form.t18) || 0, t47: parseInt(form.t47) || 0, t333: parseInt(form.t333) || 0 }, {
      onSuccess: () => {
        toast.success("Saved! Ad metrics logged for " + date);
        setForm({ ad_spend: "", t18: "0", t47: "0", t333: "0" });
      },
    });
  };

  // Filter by period
  const filtered = period === "all" ? metrics : metrics.filter((d) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(period));
    return d.date >= cutoff.toISOString().slice(0, 10);
  });

  const totals = filtered.reduce((acc, d) => {
    const e = enrichAd(d);
    acc.spend += e.spend; acc.revenue += e.revenue; acc.conversions += e.conversions;
    return acc;
  }, { spend: 0, revenue: 0, conversions: 0 });

  const daysWithSales = filtered.filter((d) => enrichAd(d).conversions > 0).length;
  const weekly = buildWeekly(metrics);

  // Cumulative
  let cs = 0, cr = 0;
  const cumulative = metrics.map((d) => {
    const e = enrichAd(d);
    cs += e.spend; cr += e.revenue;
    return { date: shortDate(d.date), spend: Math.round(cs), revenue: cr };
  });

  const exportCSV = () => {
    let csv = "date,ad_spend,t18,t47,t333,revenue,total_conversions\n";
    metrics.forEach((d) => { const e = enrichAd(d); csv += `${d.date},${d.ad_spend},${d.t18},${d.t47},${d.t333},${e.revenue},${e.conversions}\n`; });
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "ad_metrics_export.csv";
    a.click();
  };

  return (
    <div>
      {/* Entry Form */}
      <div className="memphis-card relative overflow-hidden rounded-lg border-4 border-foreground p-5 memphis-shadow mb-6" style={{ background: "linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(255,248,204,.5) 100%)" }}>
        <h3 className="font-fredoka text-[28px] font-bold tracking-tight mb-4 pt-3.5 flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-primary border-2 border-foreground animate-pulse-dot" />
          Log Ad Metrics — <span className="text-primary">Reporting for {formatReportingDate(date)}</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-space text-[10px] font-extrabold uppercase tracking-[0.16em] text-lav-700">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2.5 border-[3px] border-foreground rounded-[14px] text-sm bg-card memphis-shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>
          {[
            { key: "ad_spend", label: "Ad Spend ($)", placeholder: "50.00" },
            { key: "t18", label: "$18 Sales", placeholder: "0" },
            { key: "t47", label: "$47 Sales", placeholder: "0" },
            { key: "t333", label: "$333 Sales", placeholder: "0" },
          ].map((f) => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="font-space text-[10px] font-extrabold uppercase tracking-[0.16em] text-lav-700">{f.label}</label>
              <input type="number" placeholder={f.placeholder} value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="px-3 py-2.5 border-[3px] border-foreground rounded-[14px] text-sm bg-card memphis-shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-4 items-center flex-wrap">
          <button onClick={handleSave} disabled={upsert.isPending} className="font-space font-extrabold uppercase tracking-[0.12em] text-sm px-4 py-2.5 bg-primary text-primary-foreground border-[3px] border-foreground rounded-full memphis-shadow-sm hover:bg-lav-500 transition-all cursor-pointer memphis-shadow-hover">
            {upsert.isPending ? "Saving..." : "Save Ad Metrics"}
          </button>
        </div>
        {existing && <p className="text-xs text-muted-foreground mt-2 italic font-semibold">Data exists for this date — saving will overwrite.</p>}
      </div>

      {/* Period Filter */}
      <div className="flex gap-2 items-center mb-5 flex-wrap">
        <label className="font-space text-xs text-lav-700 font-extrabold uppercase tracking-[0.14em]">Period:</label>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-3 py-2.5 border-[3px] border-foreground rounded-[14px] text-sm bg-card memphis-shadow-sm focus:outline-none focus:border-primary">
          <option value="all">All Time</option>
          <option value="30">Last 30 Days</option>
          <option value="14">Last 14 Days</option>
          <option value="7">Last 7 Days</option>
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <KpiCard label="Total Spend" value={fmtD(totals.spend)} tilt={-0.5} />
        <KpiCard label="Revenue (First Payment)" value={fmt(totals.revenue)} tilt={0.5} />
        <KpiCard label="ROAS" value={`${totals.spend > 0 ? (totals.revenue / totals.spend).toFixed(2) : "0"}x`} change={totals.revenue > totals.spend ? "Profitable" : "Below breakeven"} changeType={totals.revenue > totals.spend ? "positive" : "negative"} tilt={-0.5} />
        <KpiCard label="Conversions" value={totals.conversions.toString()} tilt={0.5} />
        <KpiCard label="CAC" value={totals.conversions > 0 ? fmtD(totals.spend / totals.conversions) : "—"} tilt={-0.5} />
        <KpiCard label="Days with Sales" value={`${daysWithSales}/${filtered.length}`} change={`${filtered.length > 0 ? ((daysWithSales / filtered.length) * 100).toFixed(0) : 0}% of days had sales`} tilt={0.5} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Daily Ad Spend">
          <ResponsiveContainer>
            <BarChart data={metrics.map((d) => ({ date: shortDate(d.date), spend: d.ad_spend }))}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => "$" + v} />
              <Tooltip formatter={(v: number) => ["$" + v.toFixed(2), "Spend"]} />
              <Bar dataKey="spend" fill={COLORS.blue + "99"} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Conversions by Tier">
          <ResponsiveContainer>
            <BarChart data={metrics.map((d) => ({ date: shortDate(d.date), t18: d.t18, t47: d.t47, t333: d.t333 }))}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="t18" name="$18" stackId="a" fill={COLORS.amber + "CC"} radius={[2, 2, 0, 0]} />
              <Bar dataKey="t47" name="$47" stackId="a" fill={COLORS.accent + "CC"} radius={[2, 2, 0, 0]} />
              <Bar dataKey="t333" name="$333" stackId="a" fill={COLORS.green + "CC"} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="grid grid-cols-1 gap-4 mb-6">
        <ChartCard title="Weekly ROAS Trend" fullWidth>
          <ResponsiveContainer>
            <LineChart data={weekly}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => v + "x"} />
              <Tooltip formatter={(v: number, name: string) => [name === "Breakeven" ? "1.0x" : v + "x", name]} />
              <Legend />
              <Line type="monotone" dataKey="roas" name="ROAS" stroke={COLORS.accent} strokeWidth={2.5} dot />
              <Line type="monotone" dataKey={() => 1} name="Breakeven" stroke="#dc262680" strokeDasharray="6 4" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Cumulative Spend vs Revenue" fullWidth>
          <ResponsiveContainer>
            <LineChart data={cumulative}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => "$" + v.toLocaleString()} />
              <Tooltip formatter={(v: number) => "$" + v.toLocaleString()} />
              <Legend />
              <Line type="monotone" dataKey="spend" name="Cumulative Spend" stroke={COLORS.purple} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="revenue" name="Cumulative Revenue" stroke={COLORS.green} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Export + Table */}
      <div className="flex justify-end mb-4">
        <button onClick={exportCSV} className="font-space font-extrabold uppercase tracking-[0.12em] text-sm px-3.5 py-2 bg-card border-[3px] border-foreground rounded-full memphis-shadow-sm hover:bg-sky-300 transition-all cursor-pointer memphis-shadow-hover">
          Export Ads CSV
        </button>
      </div>
      <div className="memphis-card relative overflow-hidden rounded-lg border-4 border-foreground bg-card/95 p-5 memphis-shadow">
        <div className="memphis-stripe absolute top-0 left-0 w-full h-3.5" />
        <h3 className="font-fredoka text-[28px] font-bold tracking-tight mb-4 pt-3.5">Weekly Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Week", "Spend", "Revenue", "ROAS", "Conversions", "$18", "$47", "$333", "CAC"].map((h) => (
                  <th key={h} className="text-left px-3 py-3 font-space font-extrabold text-[10px] uppercase tracking-[0.18em] text-lav-700 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...weekly].reverse().map((w) => (
                <tr key={w.week} className="hover:bg-aqua-100/40">
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50 font-bold">{w.week}</td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50">{fmtD(w.spend)}</td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50">{fmt(w.revenue)}</td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold border-2 border-foreground ${w.roas >= 1.5 ? "bg-aqua-300 text-aqua-900" : w.roas >= 1 ? "bg-banana-300 text-banana-900" : "bg-pink-300 text-primary-foreground"}`}>
                      {w.roas}x
                    </span>
                  </td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50">{w.conversions}</td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50">{w.t18 || "—"}</td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50">{w.t47 || "—"}</td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50">{w.t333 || "—"}</td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50">{w.conversions > 0 ? fmtD(w.cac) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
