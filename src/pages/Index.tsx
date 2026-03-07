import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { SkoolTab } from "@/components/dashboard/SkoolTab";
import { AdsTab } from "@/components/dashboard/AdsTab";
import { TasksTab } from "@/components/dashboard/TasksTab";
import { useDailyEntries } from "@/hooks/useDailyEntries";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "skool", label: "Skool Metrics" },
  { id: "ads", label: "Ad Performance" },
  { id: "tasks", label: "Tasks" },
];

const Index = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: daily = [] } = useDailyEntries();

  const latest = daily[daily.length - 1];

  return (
    <div className="memphis-bg min-h-screen relative overflow-x-hidden">
      <div className="relative z-10 max-w-[1420px] mx-auto px-6 py-8">
        <DashboardHeader
          daysTracked={daily.length}
          lastDate={latest?.date || "—"}
        />

        {/* Tab Bar */}
        <div className="flex gap-3 mb-7 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "font-space font-extrabold uppercase tracking-[0.14em] text-xs px-4 py-3 border-[3px] border-foreground rounded-full cursor-pointer transition-all memphis-shadow-sm",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground memphis-shadow-sm"
                  : "bg-card text-foreground hover:bg-sky-300 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_hsl(var(--foreground))]"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "skool" && <SkoolTab />}
        {activeTab === "ads" && <AdsTab />}
        {activeTab === "tasks" && <TasksTab />}
      </div>
    </div>
  );
};

export default Index;
