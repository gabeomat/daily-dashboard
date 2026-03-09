CREATE TABLE public.business_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to business_context" ON public.business_context FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER update_business_context_updated_at BEFORE UPDATE ON public.business_context FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();