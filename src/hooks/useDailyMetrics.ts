import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DailyMetric = Tables<"daily_metrics">;
export type DailyMetricInput = Pick<DailyMetric, "date"> &
  Partial<Omit<DailyMetric, "id" | "date" | "created_at" | "updated_at">>;

export const buildDailyMetricPayload = (
  existing: DailyMetric | null,
  metric: DailyMetricInput,
): DailyMetricInput => ({
  date: metric.date,
  ad_spend: metric.ad_spend !== undefined ? metric.ad_spend : existing?.ad_spend ?? 0,
  t18: metric.t18 !== undefined ? metric.t18 : existing?.t18 ?? 0,
  t47: metric.t47 !== undefined ? metric.t47 : existing?.t47 ?? 0,
  t333: metric.t333 !== undefined ? metric.t333 : existing?.t333 ?? 0,
});

export function useDailyMetrics() {
  return useQuery({
    queryKey: ["daily_metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_metrics")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DailyMetric[];
    },
  });
}

export function useUpsertDailyMetric() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (metric: DailyMetricInput) => {
      const { data: existing, error: existingError } = await supabase
        .from("daily_metrics")
        .select("*")
        .eq("date", metric.date)
        .maybeSingle();

      if (existingError) throw existingError;

      const payload = buildDailyMetricPayload(existing as DailyMetric | null, metric);
      const { data, error } = await supabase
        .from("daily_metrics")
        .upsert(payload, { onConflict: "date" })
        .select()
        .single();

      if (error) throw error;
      return data as DailyMetric;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily_metrics"] }),
  });
}
