import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}

export function ChartCard({ title, children, fullWidth }: ChartCardProps) {
  return (
    <div className={cn(
      "memphis-card relative overflow-hidden rounded-lg border-4 border-foreground bg-card/95 p-5 memphis-shadow",
      fullWidth && "col-span-full"
    )}>
      <div className="memphis-stripe absolute top-0 left-0 w-full h-3.5" />
      <h3 className="font-fredoka text-[28px] font-bold tracking-tight mb-4 pt-3.5">{title}</h3>
      <div className="h-[280px]">{children}</div>
    </div>
  );
}
