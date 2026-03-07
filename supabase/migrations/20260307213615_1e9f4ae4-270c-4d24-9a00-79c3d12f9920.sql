ALTER TABLE public.daily_entries
  ADD COLUMN biggest_win text NOT NULL DEFAULT '',
  ADD COLUMN biggest_bottleneck text NOT NULL DEFAULT '',
  ADD COLUMN real_priority text NOT NULL DEFAULT '';