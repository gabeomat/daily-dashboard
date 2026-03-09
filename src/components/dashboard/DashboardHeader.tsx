import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardHeaderProps {
  daysTracked: number;
  lastDate: string;
}

export function DashboardHeader({ daysTracked, lastDate }: DashboardHeaderProps) {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="flex justify-between items-end flex-wrap gap-3.5 p-5 bg-card/90 border-4 border-foreground rounded-lg memphis-shadow backdrop-blur-sm mb-6">
      <div>
        <h1 className="font-fredoka text-[clamp(2.4rem,5vw,4.8rem)] font-bold tracking-tight leading-[0.92]" style={{ textShadow: "3px 3px 0 hsl(var(--banana-500))" }}>
          AI <span className="text-primary inline-block -rotate-3">Coachbox</span> — Command Center
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-banana-300 border-[3px] border-foreground rounded-full text-[11px] uppercase tracking-[0.16em] font-extrabold memphis-shadow-sm">
          Last data: {lastDate || "—"} | {daysTracked} days tracked
        </div>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 px-3 py-2 border-[3px] border-foreground rounded-full bg-card text-foreground text-[11px] uppercase tracking-[0.16em] font-extrabold hover:bg-pink-300 transition-colors memphis-shadow-sm"
          title="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
