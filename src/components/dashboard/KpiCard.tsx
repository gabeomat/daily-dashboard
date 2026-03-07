import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  tilt?: number;
}

export function KpiCard({ label, value, change, changeType = "neutral", tilt = 0 }: KpiCardProps) {
  return (
    <div
      className="memphis-card relative overflow-hidden rounded-lg border-4 border-foreground bg-card/95 p-5 memphis-shadow"
      style={{ transform: `rotate(${tilt}deg)` }}
    >
      <div className="font-space text-[10px] font-extrabold uppercase tracking-[0.22em] text-lav-700 mb-2.5">
        {label}
      </div>
      <div className="font-fredoka text-[42px] font-bold leading-none text-foreground">
        {value}
      </div>
      {change && (
        <div
          className={cn(
            "mt-2.5 text-xs font-bold",
            changeType === "positive" && "text-positive",
            changeType === "negative" && "text-negative",
            changeType === "neutral" && "text-muted-foreground"
          )}
        >
          {change}
        </div>
      )}
    </div>
  );
}
