import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DailyEntry = Tables<"daily_entries">;
export type DailyEntryInput = Pick<DailyEntry, "date"> &
  Partial<Omit<DailyEntry, "id" | "date" | "created_at" | "updated_at">>;

export const buildDailyEntryPayload = (
  existing: DailyEntry | null,
  entry: DailyEntryInput,
): DailyEntryInput => ({
  date: entry.date,
  mrr: entry.mrr !== undefined ? entry.mrr : existing?.mrr ?? null,
  retention: entry.retention !== undefined ? entry.retention : existing?.retention ?? null,
  members: entry.members !== undefined ? entry.members : existing?.members ?? null,
  traffic: entry.traffic !== undefined ? entry.traffic : existing?.traffic ?? null,
  discovery: entry.discovery !== undefined ? entry.discovery : existing?.discovery ?? null,
  profile_activity:
    entry.profile_activity !== undefined ? entry.profile_activity : existing?.profile_activity ?? null,
  group_activity:
    entry.group_activity !== undefined ? entry.group_activity : existing?.group_activity ?? null,
  one_thing: entry.one_thing !== undefined ? entry.one_thing : existing?.one_thing ?? "",
  biggest_win: entry.biggest_win !== undefined ? entry.biggest_win : existing?.biggest_win ?? "",
  biggest_bottleneck:
    entry.biggest_bottleneck !== undefined
      ? entry.biggest_bottleneck
      : existing?.biggest_bottleneck ?? "",
  real_priority:
    entry.real_priority !== undefined ? entry.real_priority : existing?.real_priority ?? "",
});

export function useDailyEntries() {
  return useQuery({
    queryKey: ["daily_entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_entries")
        .select("*")
        .order("date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as DailyEntry[];
    },
  });
}

export function useUpsertDailyEntry() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (entry: DailyEntryInput) => {
      const { data: existing, error: existingError } = await supabase
        .from("daily_entries")
        .select("*")
        .eq("date", entry.date)
        .maybeSingle();

      if (existingError) throw existingError;

      const payload = buildDailyEntryPayload(existing as DailyEntry | null, entry);
      const { data, error } = await supabase
        .from("daily_entries")
        .upsert(payload, { onConflict: "date" })
        .select()
        .single();

      if (error) throw error;
      return data as DailyEntry;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["daily_entries"] }),
  });
}
