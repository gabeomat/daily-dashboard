import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DailyEntry } from "@/hooks/useDailyEntries";
import { Task } from "@/hooks/useTasks";
import { Sparkles, AlertTriangle, Target, XCircle, Brain, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Insight = {
  main_insight: string;
  biggest_risk: string;
  best_next_move: string;
  deprioritize: string;
};

type Props = {
  date: string;
  daily: DailyEntry[];
  tasks: Task[];
  signalChanged: string;
  signalOff: string;
  signalFocus: string;
};

function buildRecentTrend(daily: DailyEntry[], date: string): string {
  const idx = daily.findIndex((d) => d.date === date);
  if (idx < 0) return "No trend data available.";
  const start = Math.max(0, idx - 4);
  const slice = daily.slice(start, idx + 1);
  if (slice.length < 2) return "Only one data point — no trend available.";
  return slice
    .map(
      (d) =>
        `${d.date}: MRR=$${d.mrr ?? 0}, Members=${d.members ?? "?"}, Retention=${d.retention ?? "?"}%`
    )
    .join("\n");
}

const SECTIONS: { key: keyof Insight; label: string; icon: React.ReactNode }[] = [
  { key: "main_insight", label: "Main Insight", icon: <Brain className="w-4 h-4" /> },
  { key: "biggest_risk", label: "Biggest Risk", icon: <AlertTriangle className="w-4 h-4" /> },
  { key: "best_next_move", label: "Best Next Move", icon: <Target className="w-4 h-4" /> },
  { key: "deprioritize", label: "Deprioritize", icon: <XCircle className="w-4 h-4" /> },
];

export function AiStrategistCard({ date, daily, tasks, signalChanged, signalOff, signalFocus }: Props) {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);

  const cur = daily.find((d) => d.date === date);

  const weightedScore = tasks.reduce((s, t) => s + (t.is_completed ? t.weight : 0), 0);
  const totalWeight = tasks.reduce((s, t) => s + t.weight, 0);
  const taskPct = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;

  // Load saved insight on mount / date change
  useEffect(() => {
    let cancelled = false;
    setLoadingSaved(true);
    setInsight(null);
    supabase
      .from("ai_insights")
      .select("response")
      .eq("date", date)
      .eq("module", "strategist")
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.response) {
          setInsight(data.response as unknown as Insight);
        }
        if (!cancelled) setLoadingSaved(false);
      });
    return () => { cancelled = true; };
  }, [date]);

  const handleGenerate = async () => {
    setLoading(true);
    setInsight(null);

    const payload = {
      reportingDate: date,
      mrr: cur?.mrr ?? null,
      members: cur?.members ?? null,
      retention: cur?.retention ?? null,
      taskScore: weightedScore,
      taskTotal: totalWeight,
      taskPct,
      tasksCompleted: tasks.filter((t) => t.is_completed).length,
      tasksCount: tasks.length,
      signalChanged,
      signalOff,
      signalFocus,
      biggestWin: cur?.biggest_win || "",
      biggestBottleneck: cur?.biggest_bottleneck || "",
      realPriority: cur?.real_priority || "",
      recentTrend: buildRecentTrend(daily, date),
    };

    try {
      const { data, error } = await supabase.functions.invoke("ai-strategist", {
        body: { payload },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const result = data as Insight;
      setInsight(result);

      // Upsert into ai_insights
      await supabase.from("ai_insights").upsert(
        { date, module: "strategist", response: result as any },
        { onConflict: "date,module" }
      );
    } catch (e: any) {
      console.error("AI Strategist error:", e);
      toast.error(e?.message || "Failed to generate insight");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="memphis-card relative overflow-hidden rounded-lg border-4 border-foreground p-5 memphis-shadow mb-6"
      style={{ background: "linear-gradient(180deg, rgba(255,255,255,.98) 0%, rgba(237,233,254,.35) 100%)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-fredoka text-lg font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Strategist Insight
        </h3>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-foreground bg-primary text-primary-foreground font-space text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
        >
           {loading ? (
             <>
               <Loader2 className="w-3.5 h-3.5 animate-spin" />
               Analyzing…
             </>
           ) : insight ? (
             <>
               <RefreshCw className="w-3.5 h-3.5" />
               Regenerate
             </>
           ) : (
             <>
               <Sparkles className="w-3.5 h-3.5" />
               Generate Insight
             </>
           )}
         </button>
       </div>

       {!insight && !loading && !loadingSaved && (
         <p className="text-sm text-muted-foreground italic">
           Click "Generate Insight" to get an AI-powered strategic analysis of your current data.
         </p>
       )}

       {loadingSaved && !loading && (
         <div className="flex items-center justify-center py-4">
           <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
         </div>
       )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {insight && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SECTIONS.map((s) => (
            <div key={s.key} className="bg-card/80 rounded-xl border-2 border-foreground/10 px-4 py-3">
              <div className="font-space text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground mb-1.5 flex items-center gap-1.5">
                {s.icon}
                {s.label}
              </div>
              <p className="text-sm leading-relaxed text-foreground">{insight[s.key]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
