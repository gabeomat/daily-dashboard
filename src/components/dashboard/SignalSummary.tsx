import { DailyEntry } from "@/hooks/useDailyEntries";
import { Task } from "@/hooks/useTasks";
import { formatReportingDate } from "@/lib/helpers";

type Props = {
  date: string;
  daily: DailyEntry[];
  tasks: Task[];
};

function getPrev(daily: DailyEntry[], date: string): DailyEntry | undefined {
  const idx = daily.findIndex((d) => d.date === date);
  return idx > 0 ? daily[idx - 1] : undefined;
}

function pctChange(cur: number, prev: number): number {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return Math.round(((cur - prev) / prev) * 100);
}

export function buildWhatChanged(cur: DailyEntry | undefined, prev: DailyEntry | undefined): string {
  if (!cur) return "No data logged for this date yet.";
  if (!prev) return "First entry — no prior day to compare.";

  const changes: string[] = [];
  const mrrDelta = (cur.mrr ?? 0) - (prev.mrr ?? 0);
  if (mrrDelta !== 0) {
    const dir = mrrDelta > 0 ? "up" : "down";
    changes.push(`MRR ${dir} $${Math.abs(mrrDelta).toLocaleString()}`);
  }
  const retDelta = (cur.retention ?? 0) - (prev.retention ?? 0);
  if (retDelta !== 0) {
    changes.push(`Retention ${retDelta > 0 ? "+" : ""}${retDelta}%`);
  }
  const memDelta = (cur.members ?? 0) - (prev.members ?? 0);
  if (memDelta !== 0) {
    changes.push(`Members ${memDelta > 0 ? "+" : ""}${memDelta}`);
  }
  const traffDelta = (cur.traffic ?? 0) - (prev.traffic ?? 0);
  if (Math.abs(traffDelta) >= 5) {
    changes.push(`Traffic ${traffDelta > 0 ? "+" : ""}${traffDelta}`);
  }
  const discDelta = (cur.discovery ?? 0) - (prev.discovery ?? 0);
  if (Math.abs(pctChange(cur.discovery ?? 0, prev.discovery ?? 0)) >= 10) {
    changes.push(`Discovery ${discDelta > 0 ? "+" : ""}${discDelta}`);
  }

  return changes.length > 0 ? changes.join(". ") + "." : "No significant day-over-day changes.";
}

export function buildWhatLooksOff(
  cur: DailyEntry | undefined,
  prev: DailyEntry | undefined,
  tasks: Task[],
  recentEntries: DailyEntry[]
): string {
  if (!cur) return "—";
  const flags: string[] = [];

  // High activity but flat/declining MRR
  const weightedScore = tasks.reduce((s, t) => s + (t.is_completed ? t.weight : 0), 0);
  const totalWeight = tasks.reduce((s, t) => s + t.weight, 0);
  const completionRate = totalWeight > 0 ? weightedScore / totalWeight : 0;

  if (prev && completionRate > 0.6) {
    const mrrDelta = (cur.mrr ?? 0) - (prev.mrr ?? 0);
    if (mrrDelta <= 0) {
      flags.push("High task output but MRR didn't move — check if effort is aimed at revenue");
    }
  }

  // Retention dropping
  if (prev && (cur.retention ?? 0) < (prev.retention ?? 0) && (cur.retention ?? 0) < 90) {
    flags.push("Retention slipping below 90% — member churn may be accelerating");
  }

  // Repeated bottleneck (same bottleneck appearing in recent entries)
  if (cur.biggest_bottleneck) {
    const recent = recentEntries.slice(-5);
    const repeated = recent.filter(
      (d) => d.date !== cur.date && d.biggest_bottleneck && d.biggest_bottleneck.toLowerCase() === cur.biggest_bottleneck.toLowerCase()
    );
    if (repeated.length >= 1) {
      flags.push(`"${cur.biggest_bottleneck}" has come up as a bottleneck before — still unresolved`);
    }
  }

  // Low group activity with declining traffic
  if (prev && (cur.group_activity ?? 0) < 20 && (cur.traffic ?? 0) < (prev.traffic ?? 0)) {
    flags.push("Group activity low while traffic is dropping — community may be cooling");
  }

  return flags.length > 0 ? flags.join(". ") + "." : "Nothing flagged — metrics look consistent.";
}

export function buildFocus(
  cur: DailyEntry | undefined,
  prev: DailyEntry | undefined,
  tasks: Task[]
): string {
  if (!cur) return "Log today's metrics to unlock signals.";
  const recs: string[] = [];

  // If MRR flat, push growth
  if (prev && (cur.mrr ?? 0) <= (prev.mrr ?? 0)) {
    recs.push("Prioritize growth moves — MRR needs momentum");
  }

  // If retention dipping
  if ((cur.retention ?? 0) < 92) {
    recs.push("Shore up retention — engage existing members before acquiring new ones");
  }

  // If discovery is up but traffic flat
  if (prev && (cur.discovery ?? 0) > (prev.discovery ?? 0) && (cur.traffic ?? 0) <= (prev.traffic ?? 0)) {
    recs.push("Discovery is rising but traffic isn't converting — review your profile or landing page");
  }

  // Use real_priority if set
  if (cur.real_priority) {
    recs.push(`Your stated priority: "${cur.real_priority}"`);
  }

  // Incomplete high-weight tasks
  const incomplete = tasks.filter((t) => !t.is_completed && t.weight >= 3);
  if (incomplete.length > 0) {
    recs.push(`${incomplete.length} high-impact task${incomplete.length > 1 ? "s" : ""} still open — finish before context-switching`);
  }

  return recs.length > 0 ? recs.join(". ") + "." : "Stay the course — no red flags today.";
}

export function SignalSummary({ date, daily, tasks }: Props) {
  const cur = daily.find((d) => d.date === date);
  const prev = getPrev(daily, date);
  const recentEntries = daily.filter((d) => d.date <= date).slice(-6);

  const signals = [
    { label: "What Changed", icon: "📊", value: buildWhatChanged(cur, prev) },
    { label: "What Looks Off", icon: "⚠️", value: buildWhatLooksOff(cur, prev, tasks, recentEntries) },
    { label: "What to Focus on Next", icon: "🎯", value: buildFocus(cur, prev, tasks) },
  ];

  return (
    <div>
      <div className="font-space text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground mb-2">Signal Summary</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {signals.map((s) => (
          <div key={s.label} className="bg-card/80 rounded-xl border-2 border-foreground/10 px-4 py-3">
            <div className="font-space text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <span>{s.icon}</span> {s.label}
            </div>
            <p className="text-sm leading-relaxed text-foreground">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
