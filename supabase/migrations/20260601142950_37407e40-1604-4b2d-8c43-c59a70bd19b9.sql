
-- 1) fitmanager_connections
CREATE TABLE public.fitmanager_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id uuid NOT NULL,
  api_key_hash text NOT NULL UNIQUE,
  api_key_prefix text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fmc_professor ON public.fitmanager_connections(professor_id);
CREATE INDEX idx_fmc_hash ON public.fitmanager_connections(api_key_hash);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fitmanager_connections TO authenticated;
GRANT ALL ON public.fitmanager_connections TO service_role;

ALTER TABLE public.fitmanager_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professor manages own connections"
  ON public.fitmanager_connections FOR ALL TO authenticated
  USING (professor_id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (professor_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE TRIGGER trg_fmc_updated_at
  BEFORE UPDATE ON public.fitmanager_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) fitmanager_events
CREATE TABLE public.fitmanager_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES public.fitmanager_connections(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  fitpro_student_id text,
  fitpro_professor_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fme_connection ON public.fitmanager_events(connection_id, created_at DESC);

GRANT SELECT, INSERT ON public.fitmanager_events TO authenticated;
GRANT ALL ON public.fitmanager_events TO service_role;

ALTER TABLE public.fitmanager_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professor reads own events"
  ON public.fitmanager_events FOR SELECT TO authenticated
  USING (
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.fitmanager_connections c
      WHERE c.id = fitmanager_events.connection_id
        AND c.professor_id = auth.uid()
    )
  );

CREATE POLICY "Admin inserts events"
  ON public.fitmanager_events FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
