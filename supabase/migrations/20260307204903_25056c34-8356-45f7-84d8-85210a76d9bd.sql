
-- Create daily_entries table
CREATE TABLE public.daily_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  mrr NUMERIC DEFAULT 0,
  retention NUMERIC DEFAULT 0,
  members INTEGER,
  traffic INTEGER DEFAULT 0,
  discovery INTEGER DEFAULT 0,
  profile_activity INTEGER DEFAULT 0,
  group_activity INTEGER DEFAULT 0,
  one_thing TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily_metrics (ad performance) table
CREATE TABLE public.daily_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  ad_spend NUMERIC DEFAULT 0,
  t18 INTEGER DEFAULT 0,
  t47 INTEGER DEFAULT 0,
  t333 INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'daily',
  date DATE NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth yet)
CREATE POLICY "Allow all access to daily_entries" ON public.daily_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to daily_metrics" ON public.daily_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers
CREATE TRIGGER update_daily_entries_updated_at
  BEFORE UPDATE ON public.daily_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_metrics_updated_at
  BEFORE UPDATE ON public.daily_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_daily_entries_date ON public.daily_entries(date);
CREATE INDEX idx_daily_metrics_date ON public.daily_metrics(date);
CREATE INDEX idx_tasks_date ON public.tasks(date);
CREATE INDEX idx_tasks_category ON public.tasks(category);
