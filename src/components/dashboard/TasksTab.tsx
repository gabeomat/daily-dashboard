import { useState, useEffect } from "react";
import { useTasksForDate, useSeedDefaultTasks, useToggleTask, useAddTask, useDeleteTask, useTasksInRange, CATEGORIES, type Task } from "@/hooks/useTasks";
import { todayStr } from "@/lib/helpers";
import { cn } from "@/lib/utils";

export function TasksTab() {
  const [viewDate, setViewDate] = useState(todayStr());
  const { data: tasks = [], isLoading } = useTasksForDate(viewDate);
  const seedDefaults = useSeedDefaultTasks();
  const toggleTask = useToggleTask();
  const addTask = useAddTask();
  const deleteTask = useDeleteTask();
  const [newLabel, setNewLabel] = useState("");
  const [newCat, setNewCat] = useState("daily");
  const [newWeight, setNewWeight] = useState(1);

  // Heatmap range: last 35 days
  const hmEnd = todayStr();
  const hmStartDate = new Date(hmEnd + "T12:00:00");
  hmStartDate.setDate(hmStartDate.getDate() - 34);
  const hmStart = hmStartDate.toISOString().slice(0, 10);
  const { data: rangeTasks = [] } = useTasksInRange(hmStart, hmEnd);

  // Seed defaults when viewing a date with no tasks
  useEffect(() => {
    if (!isLoading && tasks.length === 0) {
      seedDefaults.mutate(viewDate);
    }
  }, [viewDate, isLoading, tasks.length]);

  const isToday = viewDate === todayStr();
  const dObj = new Date(viewDate + "T12:00:00");
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const shift = (delta: number) => {
    const d = new Date(viewDate + "T12:00:00");
    d.setDate(d.getDate() + delta);
    setViewDate(d.toISOString().slice(0, 10));
  };

  const done = tasks.filter((t) => t.is_completed).length;
  const total = tasks.length;
  const totalPossibleImpact = tasks.reduce((sum, t) => sum + (t.weight || 1), 0);
  const impactCompleted = tasks.filter((t) => t.is_completed).reduce((sum, t) => sum + (t.weight || 1), 0);
  const weightedPct = totalPossibleImpact > 0 ? Math.round((impactCompleted / totalPossibleImpact) * 100) : 0;

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    addTask.mutate({ label: newLabel.trim(), category: newCat, date: viewDate, weight: newWeight });
    setNewLabel("");
    setNewWeight(1);
  };

  // Compute heatmap data using weighted impact
  const heatmapData: Record<string, { impactDone: number; impactTotal: number; done: number; total: number }> = {};
  rangeTasks.forEach((t) => {
    if (!heatmapData[t.date]) heatmapData[t.date] = { impactDone: 0, impactTotal: 0, done: 0, total: 0 };
    const w = t.weight || 1;
    heatmapData[t.date].impactTotal += w;
    heatmapData[t.date].total++;
    if (t.is_completed) {
      heatmapData[t.date].impactDone += w;
      heatmapData[t.date].done++;
    }
  });

  // History (last 14 days)
  const history: Array<{ date: string; done: number; total: number; pct: number; impactScore: number; tasks: string[] }> = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(todayStr() + "T12:00:00");
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const h = heatmapData[key];
    if (!h && i > 0) continue;
    const dd = h?.done || 0;
    const tt = h?.total || 0;
    const iScore = h?.impactDone || 0;
    const iTotal = h?.impactTotal || 0;
    const completedLabels = rangeTasks.filter((t) => t.date === key && t.is_completed).map((t) => t.label);
    history.push({
      date: key,
      done: dd,
      total: tt,
      pct: iTotal > 0 ? Math.round((iScore / iTotal) * 100) : 0,
      impactScore: iScore,
      tasks: completedLabels,
    });
  }

  return (
    <div>
      {/* Date Nav */}
      <div className="flex gap-3 items-center mb-5 flex-wrap">
        <button onClick={() => shift(-1)} className="font-space font-extrabold uppercase tracking-[0.12em] text-sm px-4 py-2 bg-card border-[3px] border-foreground rounded-full memphis-shadow-sm hover:bg-sky-300 transition-all cursor-pointer memphis-shadow-hover">
          ← Previous Day
        </button>
        <div className="text-center min-w-[240px]">
          <div className="font-fredoka text-[34px] font-bold leading-none">{dayNames[dObj.getDay()]}, {monthNames[dObj.getMonth()]} {dObj.getDate()}</div>
          <div className="font-space text-[11px] text-lav-700 font-extrabold uppercase tracking-[0.14em]">{isToday ? "Today" : viewDate}</div>
        </div>
        <button onClick={() => shift(1)} className="font-space font-extrabold uppercase tracking-[0.12em] text-sm px-4 py-2 bg-card border-[3px] border-foreground rounded-full memphis-shadow-sm hover:bg-sky-300 transition-all cursor-pointer memphis-shadow-hover">
          Next Day →
        </button>
        <button onClick={() => setViewDate(todayStr())} className="ml-auto font-space font-extrabold uppercase tracking-[0.12em] text-sm px-4 py-2 bg-primary text-primary-foreground border-[3px] border-foreground rounded-full memphis-shadow-sm hover:bg-lav-500 transition-all cursor-pointer memphis-shadow-hover">
          Today
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        {[
          { value: done.toString(), label: "Tasks Done" },
          { value: total.toString(), label: "Total Tasks" },
          { value: weightedPct + "%", label: "Weighted %" },
          { value: impactCompleted.toString(), label: "Impact Score" },
        ].map((s) => (
          <div key={s.label} className="memphis-card relative overflow-hidden rounded-lg border-4 border-foreground p-4 text-center memphis-shadow" style={{ background: "linear-gradient(180deg, rgba(255,255,255,.96), rgba(241,233,251,.72))" }}>
            <div className="font-fredoka text-[38px] font-bold leading-none">{s.value}</div>
            <div className="font-space text-[10px] text-lav-700 uppercase tracking-[0.16em] mt-1.5 font-extrabold">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Task Categories */}
      <div className="flex flex-col gap-5">
        {Object.entries(CATEGORIES).map(([catId, catInfo]) => {
          const catTasks = tasks.filter((t) => t.category === catId);
          if (catTasks.length === 0) return null;
          const catDone = catTasks.filter((t) => t.is_completed).length;
          return (
            <div key={catId} className="memphis-card relative overflow-hidden rounded-lg border-4 border-foreground bg-card/95 p-5 memphis-shadow">
              <div className="memphis-stripe absolute top-0 left-0 w-full h-3.5" />
              <h3 className="font-fredoka text-[28px] font-bold tracking-tight mb-4 pt-3.5 flex items-center gap-2.5">
                <span className="text-lg">{catInfo.icon}</span> {catInfo.name}
                <span className="ml-auto text-xs text-muted-foreground font-bold">{catDone}/{catTasks.length}</span>
              </h3>
              <ul className="flex flex-col gap-2">
                {catTasks.map((t) => (
                  <li
                    key={t.id}
                    onClick={() => toggleTask.mutate({ id: t.id, is_completed: !t.is_completed })}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-3 rounded-2xl cursor-pointer border-[3px] border-transparent transition-colors",
                      t.is_completed ? "opacity-60" : "",
                      "odd:bg-banana-100/45 even:bg-sky-100/38 hover:bg-pink-300/16 hover:border-foreground"
                    )}
                  >
                    <input type="checkbox" checked={t.is_completed} readOnly className="w-5 h-5 accent-primary cursor-pointer flex-shrink-0" />
                    <span className={cn("text-sm font-semibold flex-1", t.is_completed && "line-through text-muted-foreground")}>{t.label}</span>
                    <span className="text-[10px] font-space font-bold text-muted-foreground/70 tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-foreground/5 flex-shrink-0">
                      ×{t.weight || 1}
                    </span>
                    {!t.is_default && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTask.mutate(t.id); }}
                        className="text-muted-foreground hover:text-foreground text-lg px-1"
                        title="Remove task"
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Add Custom Task */}
      <div className="mt-5 bg-card rounded-xl p-4 memphis-shadow flex gap-2 flex-wrap items-end">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add a custom task for today..."
          className="flex-1 min-w-[200px] px-3 py-2.5 border-[3px] border-foreground rounded-[14px] text-sm bg-card memphis-shadow-sm focus:outline-none focus:border-primary"
        />
        <select value={newCat} onChange={(e) => setNewCat(e.target.value)} className="px-3 py-2.5 border-[3px] border-foreground rounded-[14px] text-sm bg-card memphis-shadow-sm">
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>{v.name}</option>
          ))}
        </select>
        <select value={newWeight} onChange={(e) => setNewWeight(Number(e.target.value))} className="px-3 py-2.5 border-[3px] border-foreground rounded-[14px] text-sm bg-card memphis-shadow-sm w-[90px]">
          {[1, 2, 3, 4, 5].map((w) => (
            <option key={w} value={w}>×{w}</option>
          ))}
        </select>
        <button onClick={handleAdd} className="font-space font-extrabold uppercase tracking-[0.12em] text-sm px-4 py-2.5 bg-primary text-primary-foreground border-[3px] border-foreground rounded-full memphis-shadow-sm hover:bg-lav-500 transition-all cursor-pointer memphis-shadow-hover">
          + Add Task
        </button>
      </div>

      {/* Heatmap */}
      <div className="memphis-card relative overflow-hidden rounded-lg border-4 border-foreground bg-card/95 p-5 memphis-shadow mt-6">
        <div className="memphis-stripe absolute top-0 left-0 w-full h-3.5" />
        <h3 className="font-fredoka text-[28px] font-bold tracking-tight mb-4 pt-3.5">Impact Heatmap — Last 5 Weeks</h3>
        <div className="grid grid-cols-7 gap-1.5">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="font-extrabold text-[10px] text-center py-0.5">{d}</div>
          ))}
          {(() => {
            const cells: React.ReactNode[] = [];
            const start = new Date(hmStart + "T12:00:00");
            const padStart = start.getDay();
            for (let i = 0; i < padStart; i++) cells.push(<div key={`pad-${i}`} className="aspect-square" />);

            // Find max impact across range for relative scaling
            let maxImpact = 1;
            Object.values(heatmapData).forEach((h) => {
              if (h.impactDone > maxImpact) maxImpact = h.impactDone;
            });

            for (let i = 0; i < 35; i++) {
              const d = new Date(start);
              d.setDate(d.getDate() + i);
              const key = d.toISOString().slice(0, 10);
              const h = heatmapData[key];
              let level = 0;
              if (h && h.impactTotal > 0) {
                const ratio = h.impactDone / maxImpact;
                if (ratio > 0) level = 1;
                if (ratio >= 0.2) level = 2;
                if (ratio >= 0.4) level = 3;
                if (ratio >= 0.65) level = 4;
                if (ratio >= 0.85) level = 5;
              }
              const isT = key === todayStr();
              cells.push(
                <div
                  key={key}
                  className={cn(
                    `aspect-square rounded-[10px] flex items-center justify-center text-[10px] border-2 border-foreground/15 heatmap-l${level}`,
                    isT && "outline-[3px] outline outline-foreground outline-offset-2"
                  )}
                  title={`${key}: Impact ${h?.impactDone || 0}/${h?.impactTotal || 0}`}
                >
                  {d.getDate()}
                </div>
              );
            }
            return cells;
          })()}
        </div>
      </div>

      {/* History Table */}
      <div className="memphis-card relative overflow-hidden rounded-lg border-4 border-foreground bg-card/95 p-5 memphis-shadow mt-4">
        <div className="memphis-stripe absolute top-0 left-0 w-full h-3.5" />
        <h3 className="font-fredoka text-[28px] font-bold tracking-tight mb-4 pt-3.5">Recent History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Date", "Done", "Total", "Weighted %", "Impact", "Tasks Completed"].map((h) => (
                  <th key={h} className="text-left px-3 py-3 font-space font-extrabold text-[10px] uppercase tracking-[0.18em] text-lav-700 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.date} className="hover:bg-aqua-100/40">
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50 font-bold">
                    {h.date}{h.date === todayStr() ? " (today)" : ""}
                  </td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50">{h.done}</td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50">{h.total}</td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50">
                    <span className={cn(
                      "inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold border-2 border-foreground",
                      h.pct >= 75 ? "bg-aqua-300 text-aqua-900" : h.pct >= 40 ? "bg-banana-300 text-banana-900" : h.pct > 0 ? "bg-pink-300 text-primary-foreground" : ""
                    )}>
                      {h.pct}%
                    </span>
                  </td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50 font-bold">{h.impactScore}</td>
                  <td className="px-3 py-3 border-t-2 border-b-2 border-foreground bg-lav-50/50 text-xs text-muted-foreground">
                    {h.tasks.length > 0 ? h.tasks.join(", ") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
