import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DailyMetric = {
  id: string;
  date: string;
  ad_spend: number | null;
  t18: number | null;
  t47: number | null;
  t333: number | null;
};

export function useDailyMetrics() {
  return useQuery({
    queryKey: ["daily_metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_metrics")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;
      return data as DailyMetric[];
    },
  });
}

export function useUpsertDailyMetric() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<DailyMetric, "id">) => {
      const { data, error } = await supabase
        .from("daily_metrics")
        .upsert(entry, { onConflict: "date" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily_metrics"] }),
  });
}
