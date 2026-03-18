import { useEffect, useState } from "react";
import { useDailyEntries, useUpsertDailyEntry, type DailyEntry } from "@/hooks/useDailyEntries";
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

const formFromEntry = (entry?: DailyEntry | null) => ({
  mrr: entry?.mrr != null ? entry.mrr.toString() : "",
  retention: entry?.retention != null ? entry.retention.toString() : "",
  members: entry?.members != null ? entry.members.toString() : "",
  traffic: entry?.traffic != null ? entry.traffic.toString() : "",
  discovery: entry?.discovery != null ? entry.discovery.toString() : "",
  profile_activity: entry?.profile_activity != null ? entry.profile_activity.toString() : "",
  group_activity: entry?.group_activity != null ? entry.group_activity.toString() : "",
  one_thing: entry?.one_thing || "",
  biggest_win: entry?.biggest_win || "",
  biggest_bottleneck: entry?.biggest_bottleneck || "",
  real_priority: entry?.real_priority || "",
});

const buildCarryForwardForm = (entry?: DailyEntry) => {
  const carried = formFromEntry(entry);
  return {
    ...carried,
    one_thing: "",
    biggest_win: "",
    biggest_bottleneck: "",
    real_priority: "",
  };
};

export function SkoolTab() {
  const { data: daily = [] } = useDailyEntries();
  const upsert = useUpsertDailyEntry();
  const [date, setDate] = useState(yesterdayStr());
  const [form, setForm] = useState(emptyForm);
  const [savedForm, setSavedForm] = useState(emptyForm);
  const [lastLoadedDate, setLastLoadedDate] = useState<string | null>(null);

  const existing = daily.find((d) => d.date === date);
  const latest = daily[daily.length - 1];
  const previousEntry = [...daily].reverse().find((d) => d.date < date);
  const carryForwardForm = buildCarryForwardForm(previousEntry);
  const syncKey = existing
    ? `${date}|existing|${JSON.stringify(formFromEntry(existing))}`
    : previousEntry
      ? `${date}|carry|${JSON.stringify(carryForwardForm)}`
      : `${date}|empty`;

  useEffect(() => {
    if (syncKey === lastLoadedDate) return;

    setLastLoadedDate(syncKey);

    if (existing) {
      const loaded = formFromEntry(existing);
      setForm(loaded);
      setSavedForm(loaded);
      return;
    }

    if (previousEntry) {
      setForm(carryForwardForm);
      setSavedForm(emptyForm);
      return;
    }

    setForm(emptyForm);
    setSavedForm(emptyForm);
  }, [syncKey, lastLoadedDate, existing, previousEntry, carryForwardForm]);

  const isModified = (key: keyof typeof emptyForm) => form[key] !== savedForm[key];
  const hasAnyChanges = (Object.keys(emptyForm) as Array<keyof typeof emptyForm>).some(isModified);

  const handleSave = () => {
    if (!date) { toast.error("Please select a date"); return; }

    const val = (formVal: string, existingVal: number | null | undefined, prevVal: number | null | undefined, parser: (v: string) => number, fallback: number | null = 0) => {
      if (formVal !== "") return parser(formVal);
      if (existing) return existingVal ?? prevVal ?? fallback;
      return prevVal ?? fallback;
    };
    const strVal = (formVal: string, existingVal: string | null | undefined) => {
      if (formVal !== "") return formVal;
      if (existing) return existingVal ?? "";
      return formVal;
    };

    upsert.mutate({
      date,
      mrr: val(form.mrr, existing?.mrr, previousEntry?.mrr, parseFloat, null) as number | null,
      retention: val(form.retention, existing?.retention, previousEntry?.retention, parseFloat, null) as number | null,
      members: val(form.members, existing?.members, previousEntry?.members, (value) => parseInt(value, 10), null) as number | null,
      traffic: val(form.traffic, existing?.traffic, previousEntry?.traffic, (value) => parseInt(value, 10), null) as number | null,
      discovery: val(form.discovery, existing?.discovery, previousEntry?.discovery, (value) => parseInt(value, 10), null) as number | null,
      profile_activity: val(form.profile_activity, existing?.profile_activity, previousEntry?.profile_activity, (value) => parseInt(value, 10), null) as number | null,
      group_activity: val(form.group_activity, existing?.group_activity, previousEntry?.group_activity, (value) => parseInt(value, 10), null) as number | null,
      one_thing: strVal(form.one_thing, existing?.one_thing),
      biggest_win: strVal(form.biggest_win, existing?.biggest_win),
      biggest_bottleneck: strVal(form.biggest_bottleneck, existing?.biggest_bottleneck),
      real_priority: strVal(form.real_priority, existing?.real_priority),
    }, {
      onSuccess: (savedEntry) => {
        const loaded = formFromEntry(savedEntry);
        toast.success("Saved! Metrics logged for " + savedEntry.date);
        setForm(loaded);
        setSavedForm(loaded);
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
  ] as const;

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
            <div key={f.key} className="flex flex-col gap-1 relative">
              <label className="font-space text-[10px] font-extrabold uppercase tracking-[0.16em] text-lav-700 flex items-center gap-1.5">
                {f.label}
                {isModified(f.key) && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 border border-foreground/30" title="Unsaved change" />}
              </label>
              <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className={`px-3 py-2.5 border-[3px] rounded-[14px] text-sm bg-card memphis-shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground ${isModified(f.key) ? "border-amber-400" : "border-foreground"}`} />
            </div>
          ))}
          <div className="flex flex-col gap-1 col-span-full">
            <label className="font-space text-[10px] font-extrabold uppercase tracking-[0.16em] text-lav-700 flex items-center gap-1.5">
              One Thing (today's focus)
              {isModified("one_thing") && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 border border-foreground/30" title="Unsaved change" />}
            </label>
            <input type="text" placeholder="What's your #1 priority today?" value={form.one_thing} onChange={(e) => setForm({ ...form, one_thing: e.target.value })} className={`px-3 py-2.5 border-[3px] rounded-[14px] text-sm bg-card memphis-shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground ${isModified("one_thing") ? "border-amber-400" : "border-foreground"}`} />
          </div>
        </div>

        {/* CEO Notes */}
        <div className="mt-5 border-t-2 border-foreground/10 pt-5">
          <h4 className="font-fredoka text-lg font-bold tracking-tight mb-3 flex items-center gap-2">
            <span>📋</span> CEO Notes
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {([
              { key: "biggest_win", label: "🏆 Biggest Win", placeholder: "What went well today?" },
              { key: "biggest_bottleneck", label: "🧱 Biggest Bottleneck", placeholder: "What's blocking progress?" },
              { key: "real_priority", label: "🎯 Real Priority", placeholder: "What actually matters most right now?" },
            ] as const).map((note) => (
              <div key={note.key} className="flex flex-col gap-1">
                <label className="font-space text-[10px] font-extrabold uppercase tracking-[0.16em] text-lav-700 flex items-center gap-1.5">
                  {note.label}
                  {isModified(note.key) && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 border border-foreground/30" title="Unsaved change" />}
                </label>
                <textarea placeholder={note.placeholder} value={form[note.key]} onChange={(e) => setForm({ ...form, [note.key]: e.target.value })} className={`px-3 py-2.5 border-[3px] rounded-[14px] text-sm bg-card memphis-shadow-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground min-h-[80px] resize-y ${isModified(note.key) ? "border-amber-400" : "border-foreground"}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-4 items-center flex-wrap">
          <button onClick={handleSave} disabled={upsert.isPending} className="font-space font-extrabold uppercase tracking-[0.12em] text-sm px-4 py-2.5 bg-primary text-primary-foreground border-[3px] border-foreground rounded-full memphis-shadow-sm hover:bg-lav-500 transition-all cursor-pointer memphis-shadow-hover">
            {upsert.isPending ? "Saving..." : existing ? "Update Metrics" : "Save Skool Metrics"}
          </button>
          {hasAnyChanges && (
            <span className="flex items-center gap-1.5 text-xs font-space font-bold text-amber-600">
              <span className="w-2 h-2 rounded-full bg-amber-400 border border-foreground/30 animate-pulse" />
              Unsaved changes
            </span>
          )}
        </div>
        {existing && !hasAnyChanges && <p className="text-xs text-muted-foreground mt-2 italic font-semibold">Data loaded for this date — edit any field and save.</p>}
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
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50">{d.retention != null ? `${d.retention}%` : "—"}</td>
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
