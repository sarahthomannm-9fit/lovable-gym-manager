-- ============================================
-- 1. AGENTES IA - Tabelas de suporte
-- ============================================

-- Tickets de suporte (Suporte Agent)
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid REFERENCES public.alunos(id) ON DELETE SET NULL,
  message text NOT NULL,
  category text,
  status text NOT NULL DEFAULT 'open',
  agent_response text,
  resolved_at timestamptz,
  escalated_to_ceo boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access to support_tickets"
ON public.support_tickets FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Drafts de conteúdo (Content Agent)
CREATE TABLE IF NOT EXISTS public.content_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text,
  topic text,
  body text,
  status text NOT NULL DEFAULT 'pending_review',
  approved_at timestamptz,
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access to content_drafts"
ON public.content_drafts FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER update_content_drafts_updated_at
BEFORE UPDATE ON public.content_drafts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Conversas com agentes IA (chat history)
CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'agent', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own conversations"
ON public.agent_conversations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own conversations"
ON public.agent_conversations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own conversations"
ON public.agent_conversations FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_agent_conversations_user_agent
ON public.agent_conversations(user_id, agent_id, created_at DESC);

-- Relatórios diários gerados pelos agentes
CREATE TABLE IF NOT EXISTS public.agent_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  summary text NOT NULL,
  metrics jsonb DEFAULT '{}'::jsonb,
  highlights jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agent_id, report_date)
);

ALTER TABLE public.agent_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read agent_reports"
ON public.agent_reports FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated manage agent_reports"
ON public.agent_reports FOR ALL TO authenticated
USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_agent_reports_date ON public.agent_reports(report_date DESC, agent_id);

-- ============================================
-- 2. EXTENSÕES PARA CRON JOB
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;