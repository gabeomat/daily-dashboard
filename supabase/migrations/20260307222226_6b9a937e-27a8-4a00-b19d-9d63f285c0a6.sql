
CREATE TABLE public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  module text NOT NULL DEFAULT 'strategist',
  response jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (date, module)
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to ai_insights" ON public.ai_insights
  FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_ai_insights_updated_at
  BEFORE UPDATE ON public.ai_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
