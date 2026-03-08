import { useState, useEffect } from "react";
import { useDailyEntries, useUpsertDailyEntry } from "@/hooks/useDailyEntries";
import { KpiCard } from "./KpiCard";
import { ChartCard } from "./ChartCard";
import { fmt, shortDate, yesterdayStr, formatReportingDate } from "@/lib/helpers";
import { toast } from "sonner";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = { accent: "#eb1495", blue: "#00bfff", green: "#00ccb1", amber: "#fedc01", purple: "#9250e2", teal: "#66ffeb" };

const emptyForm = { mrr: "", retention: "", members: "", traffic: "", discovery: "", profile_activity: "", group_activity: "", one_thing: "", biggest_win: "", biggest_bottleneck: "", real_priority: "" };

export function SkoolTab() {
  const { data: daily = [] } = useDailyEntries();
  const upsert = useUpsertDailyEntry();
  const [date, setDate] = useState(yesterdayStr());
  const [form, setForm] = useState(emptyForm);
  const [isEditing, setIsEditing] = useState(false);

  const existing = daily.find((d) => d.date === date);
  const latest = daily[daily.length - 1];

  // When switching dates, reset edit mode and clear form
  useEffect(() => {
    setIsEditing(false);
    setForm(emptyForm);
  }, [date]);

  const handleEdit = () => {
    if (!existing) return;
    setIsEditing(true);
    setForm({
      mrr: existing.mrr?.toString() || "",
      retention: existing.retention?.toString() || "",
      members: existing.members?.toString() || "",
      traffic: existing.traffic?.toString() || "",
      discovery: existing.discovery?.toString() || "",
      profile_activity: existing.profile_activity?.toString() || "",
      group_activity: existing.group_activity?.toString() || "",
      one_thing: existing.one_thing || "",
      biggest_win: existing.biggest_win || "",
      biggest_bottleneck: existing.biggest_bottleneck || "",
      real_priority: existing.real_priority || "",
    });
  };

  const handleSave = () => {
    if (!date) { toast.error("Please select a date"); return; }

    // When editing, merge: use form value if provided, else keep existing
    const base = isEditing && existing ? existing : null;
    const val = (formVal: string, existingVal: number | null | undefined, parser: (v: string) => number, fallback: number | null = 0) => {
      if (formVal !== "") return parser(formVal);
      if (base) return existingVal ?? fallback;
      return fallback;
    };
    const strVal = (formVal: string, existingVal: string | null | undefined) => {
      // For editing, always use current form value (it was pre-populated)
      if (isEditing) return formVal;
      return formVal;
    };

    upsert.mutate({
      date,
      mrr: val(form.mrr, base?.mrr, parseFloat, 0) as number,
      retention: val(form.retention, base?.retention, parseFloat, 0) as number,
      members: val(form.members, base?.members, parseInt, null) as number | null,
      traffic: val(form.traffic, base?.traffic, parseInt, 0) as number,
      discovery: val(form.discovery, base?.discovery, parseInt, 0) as number,
      profile_activity: val(form.profile_activity, base?.profile_activity, parseInt, 0) as number,
      group_activity: val(form.group_activity, base?.group_activity, parseInt, 0) as number,
      one_thing: strVal(form.one_thing, base?.one_thing),
      biggest_win: strVal(form.biggest_win, base?.biggest_win),
      biggest_bottleneck: strVal(form.biggest_bottleneck, base?.biggest_bottleneck),
      real_priority: strVal(form.real_priority, base?.real_priority),
    }, {
      onSuccess: () => {
        toast.success(isEditing ? "Updated! Metrics saved for " + date : "Saved! Metrics logged for " + date);
        setForm(emptyForm);
        setIsEditing(false);
      },
    });
  };


  const avg = (key: keyof typeof daily[0]) => {
    const vals = daily.map((d) => Number(d[key]) || 0);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  };

  const exportCSV = () => {
    let csv = "date,mrr,retention,members,traffic,discovery,profile_activity,group_activity,one_thing\n";
    daily.forEach((d) => { csv += `${d.date},${d.mrr},${d.retention},${d.members || ""},${d.traffic},${d.discovery},${d.profile_activity},${d.group_activity},"${d.one_thing || ""}"\n`; });
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "skool_metrics_export.csv";
    a.click();
  };

  const fields = [
    { key: "mrr", label: "MRR ($)", type: "number", placeholder: existing?.mrr?.toString() || "2609" },
    { key: "retention", label: "Retention (%)", type: "number", placeholder: existing?.retention?.toString() || "93" },
    { key: "members", label: "Members", type: "number", placeholder: existing?.members?.toString() || "159" },
    { key: "traffic", label: "Traffic", type: "number", placeholder: existing?.traffic?.toString() || "42" },
    { key: "discovery", label: "Discovery", type: "number", placeholder: existing?.discovery?.toString() || "512" },
    { key: "profile_activity", label: "Profile Activity", type: "number", placeholder: existing?.profile_activity?.toString() || "22" },
    { key: "group_activity", label: "Group Activity", type: "number", placeholder: existing?.group_activity?.toString() || "84" },
  ];

  return (
    <div>
      {/* Entry Form */}
      <div className="memphis-card relative overflow-hidden rounded-lg border-4 border-foreground p-5 memphis-shadow mb-6" style={{ background: "linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(255,248,204,.5) 100%)" }}>
        <h3 className="font-fredoka text-[28px] font-bold tracking-tight mb-4 pt-3.5 flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-primary border-2 border-foreground animate-pulse-dot" />
          Log Skool Metrics — <span className="text-primary">Reporting for {formatReportingDate(date)}</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-space text-[10px] font-extrabold uppercase tracking-[0.16em] text-lav-700">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2.5 border-[3px] border-foreground rounded-[14px] text-sm bg-card memphis-shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>
          {fields.map((f) => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className="font-space text-[10px] font-extrabold uppercase tracking-[0.16em] text-lav-700">{f.label}</label>
              <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="px-3 py-2.5 border-[3px] border-foreground rounded-[14px] text-sm bg-card memphis-shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" />
            </div>
          ))}
          <div className="flex flex-col gap-1 col-span-full">
            <label className="font-space text-[10px] font-extrabold uppercase tracking-[0.16em] text-lav-700">One Thing (today's focus)</label>
            <input type="text" placeholder="What's your #1 priority today?" value={form.one_thing} onChange={(e) => setForm({ ...form, one_thing: e.target.value })} className="px-3 py-2.5 border-[3px] border-foreground rounded-[14px] text-sm bg-card memphis-shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground" />
          </div>
        </div>
        <div className="flex gap-3 mt-4 items-center flex-wrap">
          {existing && !isEditing && (
            <button onClick={handleEdit} className="font-space font-extrabold uppercase tracking-[0.12em] text-sm px-4 py-2.5 bg-accent text-accent-foreground border-[3px] border-foreground rounded-full memphis-shadow-sm hover:opacity-90 transition-all cursor-pointer memphis-shadow-hover">
              Edit Existing Data
            </button>
          )}
          <button onClick={handleSave} disabled={upsert.isPending} className="font-space font-extrabold uppercase tracking-[0.12em] text-sm px-4 py-2.5 bg-primary text-primary-foreground border-[3px] border-foreground rounded-full memphis-shadow-sm hover:bg-lav-500 transition-all cursor-pointer memphis-shadow-hover">
            {upsert.isPending ? "Saving..." : isEditing ? "Save Changes" : "Save Skool Metrics"}
          </button>
          {isEditing && (
            <button onClick={() => { setIsEditing(false); setForm(emptyForm); }} className="font-space font-extrabold uppercase tracking-[0.12em] text-sm px-4 py-2.5 bg-card border-[3px] border-foreground rounded-full memphis-shadow-sm hover:bg-muted transition-all cursor-pointer">
              Cancel
            </button>
          )}
        </div>
        {existing && !isEditing && <p className="text-xs text-muted-foreground mt-2 italic font-semibold">Data exists for this date — click "Edit Existing Data" to update individual fields.</p>}
        {isEditing && <p className="text-xs text-primary mt-2 italic font-semibold">Editing mode — change only the fields you need, then save.</p>}
      </div>


      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <KpiCard label="Latest MRR" value={fmt(latest?.mrr || 0)} tilt={-0.5} />
        <KpiCard label="Retention" value={`${latest?.retention || 0}%`} tilt={0.5} />
        <KpiCard label="Members" value={latest?.members?.toString() || "—"} tilt={-0.5} />
        <KpiCard label="Avg Traffic" value={avg("traffic").toString()} tilt={0.5} />
        <KpiCard label="Avg Discovery" value={avg("discovery").toString()} tilt={-0.5} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="MRR Over Time">
          <ResponsiveContainer>
            <LineChart data={daily.map((d) => ({ date: shortDate(d.date), mrr: d.mrr }))}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => "$" + v} />
              <Tooltip formatter={(v: number) => ["$" + v, "MRR"]} />
              <Line type="monotone" dataKey="mrr" stroke={COLORS.accent} strokeWidth={2.5} dot={daily.length <= 30} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Retention %">
          <ResponsiveContainer>
            <LineChart data={daily.map((d) => ({ date: shortDate(d.date), ret: d.retention }))}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[80, 100]} tickFormatter={(v) => v + "%"} />
              <Tooltip formatter={(v: number) => [v + "%", "Retention"]} />
              <Line type="monotone" dataKey="ret" stroke={COLORS.green} strokeWidth={2.5} dot={daily.length <= 30} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Traffic & Discovery">
          <ResponsiveContainer>
            <LineChart data={daily.map((d) => ({ date: shortDate(d.date), traffic: d.traffic, discovery: d.discovery }))}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="traffic" stroke={COLORS.blue} strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="discovery" stroke={COLORS.amber} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Community Activity">
          <ResponsiveContainer>
            <BarChart data={daily.map((d) => ({ date: shortDate(d.date), profile: d.profile_activity, group: d.group_activity }))}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="profile" name="Profile" fill={COLORS.purple + "BB"} radius={[4, 4, 0, 0]} />
              <Bar dataKey="group" name="Group" fill={COLORS.teal + "BB"} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Export + Table */}
      <div className="flex justify-end mb-4">
        <button onClick={exportCSV} className="font-space font-extrabold uppercase tracking-[0.12em] text-sm px-3.5 py-2 bg-card border-[3px] border-foreground rounded-full memphis-shadow-sm hover:bg-sky-300 transition-all cursor-pointer memphis-shadow-hover">
          Export Skool CSV
        </button>
      </div>
      <div className="memphis-card relative overflow-hidden rounded-lg border-4 border-foreground bg-card/95 p-5 memphis-shadow">
        <div className="memphis-stripe absolute top-0 left-0 w-full h-3.5" />
        <h3 className="font-fredoka text-[28px] font-bold tracking-tight mb-4 pt-3.5">Daily Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Date", "MRR", "Retention", "Members", "Traffic", "Discovery", "Profile", "Group", "One Thing"].map((h) => (
                  <th key={h} className="text-left px-3 py-3 font-space font-extrabold text-[10px] uppercase tracking-[0.18em] text-lav-700 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...daily].reverse().map((d) => (
                <tr key={d.date} className="hover:bg-aqua-100/40">
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground first:border-l-2 first:rounded-l-xl last:border-r-2 last:rounded-r-xl bg-lav-50/50">{d.date}</td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50">{fmt(d.mrr || 0)}</td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50">{d.retention}%</td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50">{d.members || "—"}</td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50">{d.traffic}</td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50">{d.discovery}</td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50">{d.profile_activity}</td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50">{d.group_activity}</td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50 text-muted-foreground italic last:border-r-2 last:rounded-r-xl">{d.one_thing || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
