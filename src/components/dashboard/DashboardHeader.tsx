interface DashboardHeaderProps {
  daysTracked: number;
  lastDate: string;
}

export function DashboardHeader({ daysTracked, lastDate }: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-end flex-wrap gap-3.5 p-5 bg-card/90 border-4 border-foreground rounded-lg memphis-shadow backdrop-blur-sm mb-6">
      <div>
        <h1 className="font-fredoka text-[clamp(2.4rem,5vw,4.8rem)] font-bold tracking-tight leading-[0.92]" style={{ textShadow: "3px 3px 0 hsl(var(--banana-500))" }}>
          AI <span className="text-primary inline-block -rotate-3">Coachbox</span> — Command Center
        </h1>
      </div>
      <div className="inline-flex items-center gap-2 px-3 py-2 bg-banana-300 border-[3px] border-foreground rounded-full text-[11px] uppercase tracking-[0.16em] font-extrabold memphis-shadow-sm">
        Last data: {lastDate || "—"} | {daysTracked} days tracked
      </div>
    </div>
  );
}
