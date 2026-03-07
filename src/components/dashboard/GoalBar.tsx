import { fmt } from "@/lib/helpers";

interface GoalBarProps {
  current: number;
  target: number;
}

export function GoalBar({ current, target }: GoalBarProps) {
  const pct = Math.min((current / target) * 100, 100);

  return (
    <div className="memphis-card relative overflow-hidden rounded-lg border-4 border-foreground bg-card/95 p-6 memphis-shadow mb-6"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,.95), rgba(255,255,255,.9)), repeating-linear-gradient(-45deg, hsl(var(--banana-100)) 0 14px, hsl(var(--lav-100)) 14px 28px)"
      }}
    >
      <div className="flex justify-between items-baseline mb-3.5 gap-3 flex-wrap">
        <h3 className="font-fredoka text-[28px] font-bold tracking-tight">MRR Goal: Double in 3 Months</h3>
        <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] bg-aqua-300 px-2.5 py-1.5 border-[3px] border-foreground rounded-full">
          {pct.toFixed(1)}% of goal
        </span>
      </div>
      <div className="h-[18px] bg-card rounded-full overflow-hidden border-[3px] border-foreground">
        <div
          className="h-full goal-fill-pattern rounded-full transition-all duration-600"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between mt-2.5 text-[11px] text-lav-700 uppercase tracking-[0.14em] font-extrabold">
        <span>$0</span>
        <span>Current: {fmt(current)}</span>
        <span>Target: {fmt(target)}</span>
      </div>
    </div>
  );
}
