import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DailyEntry = {
  id: string;
  date: string;
  mrr: number | null;
  retention: number | null;
  members: number | null;
  traffic: number | null;
  discovery: number | null;
  profile_activity: number | null;
  group_activity: number | null;
  one_thing: string | null;
  biggest_win: string;
  biggest_bottleneck: string;
  real_priority: string;
};

export function useDailyEntries() {
  return useQuery({
    queryKey: ["daily_entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_entries")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;
      return data as DailyEntry[];
    },
  });
}

export function useUpsertDailyEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<DailyEntry, "id">) => {
      const { data, error } = await supabase
        .from("daily_entries")
        .upsert(entry, { onConflict: "date" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily_entries"] }),
  });
}
