import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Task = {
  id: string;
  label: string;
  category: string;
  date: string;
  is_completed: boolean;
  is_default: boolean;
  sort_order: number;
  weight: number;
};

export const DEFAULT_TASKS = [
  { cat: "daily", label: "Enter Skool metrics", weight: 1 },
  { cat: "daily", label: "Enter ad metrics", weight: 1 },
  { cat: "daily", label: "Engage in Skool (reply to members, start a convo)", weight: 2 },
  { cat: "content", label: "Post or share in a Skool community", weight: 2 },
  { cat: "content", label: "Work on YouTube video (script, record, edit, or publish)", weight: 3 },
  { cat: "content", label: "Send or draft email to your list", weight: 3 },
  { cat: "growth", label: "Review & optimize ad creatives or targeting", weight: 2 },
  { cat: "growth", label: "Reach out for collab, summit, or audience share", weight: 3 },
  { cat: "product", label: "Build or ship a new tool to the Plug & Play library", weight: 4 },
  { cat: "product", label: "Create or improve training content", weight: 3 },
];

export const CATEGORIES: Record<string, { name: string; icon: string }> = {
  daily: { name: "Daily Ops", icon: "⚙" },
  content: { name: "Content & Visibility", icon: "✍" },
  growth: { name: "Growth Moves", icon: "🚀" },
  product: { name: "Product & Value", icon: "🔨" },
};

export function useTasksForDate(date: string) {
  return useQuery({
    queryKey: ["tasks", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("date", date)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
  });
}

export function useSeedDefaultTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (date: string) => {
      // Check if defaults already exist for this date
      const { data: existing } = await supabase
        .from("tasks")
        .select("id")
        .eq("date", date)
        .eq("is_default", true)
        .limit(1);
      if (existing && existing.length > 0) return;

      const rows = DEFAULT_TASKS.map((t, i) => ({
        label: t.label,
        category: t.cat,
        date,
        is_default: true,
        is_completed: false,
        sort_order: i,
      }));
      const { error } = await supabase.from("tasks").insert(rows);
      if (error) throw error;
    },
    onSuccess: (_d, date) => qc.invalidateQueries({ queryKey: ["tasks", date] }),
  });
}

export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_completed }: { id: string; is_completed: boolean }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ is_completed })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useAddTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: { label: string; category: string; date: string }) => {
      const { error } = await supabase
        .from("tasks")
        .insert({ ...task, is_default: false, is_completed: false, sort_order: 99 });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["tasks", v.date] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

// For heatmap/history: fetch tasks for a date range
export function useTasksInRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["tasks_range", startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
  });
}
