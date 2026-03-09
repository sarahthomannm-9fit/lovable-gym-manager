
-- Fase 2: Catálogo Mestre (SKUs)

-- 1. Criar enums para SKU
CREATE TYPE public.sku_tipo AS ENUM (
  'plano', 'consultoria', 'programa', 'produto_digital', 'produto_fisico', 'academy'
);

CREATE TYPE public.sku_recorrencia AS ENUM (
  'mensal', 'trimestral', 'semestral', 'anual', 'unico'
);

-- 2. Criar tabela skus
CREATE TABLE public.skus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  tipo public.sku_tipo NOT NULL DEFAULT 'plano',
  preco numeric NOT NULL DEFAULT 0,
  recorrencia public.sku_recorrencia NOT NULL DEFAULT 'mensal',
  capacidade integer,
  entregas jsonb DEFAULT '[]'::jsonb,
  beneficios jsonb DEFAULT '[]'::jsonb,
  modulos_liberados text[] DEFAULT '{}'::text[],
  ativo boolean NOT NULL DEFAULT true,
  plano_id uuid REFERENCES public.planos(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Indices
CREATE INDEX idx_skus_tipo ON public.skus(tipo);
CREATE INDEX idx_skus_ativo ON public.skus(ativo);

-- 4. RLS
ALTER TABLE public.skus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to skus"
  ON public.skus FOR ALL USING (true) WITH CHECK (true);

-- 5. Trigger updated_at
CREATE TRIGGER set_skus_updated_at
  BEFORE UPDATE ON public.skus
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fase 3: Entitlements

-- 1. Criar enum para status do entitlement
CREATE TYPE public.entitlement_status AS ENUM ('ativo', 'suspenso', 'expirado');

-- 2. Criar tabela entitlements
CREATE TABLE public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES public.alunos(id) ON DELETE CASCADE,
  sku_id uuid NOT NULL REFERENCES public.skus(id) ON DELETE CASCADE,
  status public.entitlement_status NOT NULL DEFAULT 'ativo',
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_fim date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Criar tabela sku_permissions
CREATE TABLE public.sku_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id uuid NOT NULL REFERENCES public.skus(id) ON DELETE CASCADE,
  modulo text NOT NULL,
  nivel_acesso text NOT NULL DEFAULT 'total',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Indices
CREATE INDEX idx_entitlements_aluno ON public.entitlements(aluno_id);
CREATE INDEX idx_entitlements_sku ON public.entitlements(sku_id);
CREATE INDEX idx_entitlements_status ON public.entitlements(status);
CREATE INDEX idx_sku_permissions_sku ON public.sku_permissions(sku_id);

-- 5. RLS
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sku_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to entitlements"
  ON public.entitlements FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to sku_permissions"
  ON public.sku_permissions FOR ALL USING (true) WITH CHECK (true);

-- 6. Triggers updated_at
CREATE TRIGGER set_entitlements_updated_at
  BEFORE UPDATE ON public.entitlements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fase 4: Sistema de Eventos

-- 1. Criar tabela system_events
CREATE TABLE public.system_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  event_type text NOT NULL,
  actor_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Indices
CREATE INDEX idx_system_events_entity ON public.system_events(entity_type, entity_id);
CREATE INDEX idx_system_events_type ON public.system_events(event_type);
CREATE INDEX idx_system_events_created ON public.system_events(created_at DESC);

-- 3. RLS
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to system_events"
  ON public.system_events FOR ALL USING (true) WITH CHECK (true);

-- 4. Trigger: emitir evento ao criar pagamento
CREATE OR REPLACE FUNCTION public.emit_payment_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.system_events (entity_type, entity_id, event_type, metadata)
    VALUES ('pagamento', NEW.id, 'payment.created', jsonb_build_object('aluno_id', NEW.aluno_id, 'valor', NEW.valor, 'status', NEW.status));
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      INSERT INTO public.system_events (entity_type, entity_id, event_type, metadata)
      VALUES ('pagamento', NEW.id, 
        CASE WHEN NEW.status = 'pago' THEN 'payment.paid' ELSE 'payment.updated' END,
        jsonb_build_object('aluno_id', NEW.aluno_id, 'valor', NEW.valor, 'old_status', OLD.status, 'new_status', NEW.status));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_events
  AFTER INSERT OR UPDATE ON public.pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.emit_payment_event();

-- 5. Trigger: emitir evento ao criar checkin
CREATE OR REPLACE FUNCTION public.emit_checkin_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.system_events (entity_type, entity_id, event_type, metadata)
  VALUES ('checkin', NEW.id, 'checkin.in', jsonb_build_object('aluno_id', NEW.aluno_id));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_checkin_events
  AFTER INSERT ON public.checkins
  FOR EACH ROW
  EXECUTE FUNCTION public.emit_checkin_event();

-- 6. Trigger: emitir evento ao criar/atualizar treino
CREATE OR REPLACE FUNCTION public.emit_training_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.system_events (entity_type, entity_id, event_type, metadata)
  VALUES ('treino', NEW.id, 
    CASE WHEN TG_OP = 'INSERT' THEN 'training.created' ELSE 'training.updated' END,
    jsonb_build_object('aluno_id', NEW.aluno_id, 'data_inicio', NEW.data_inicio, 'data_fim', NEW.data_fim));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_training_events
  AFTER INSERT OR UPDATE ON public.treinos
  FOR EACH ROW
  EXECUTE FUNCTION public.emit_training_event();

-- 7. Trigger: emitir evento ao criar avaliação
CREATE OR REPLACE FUNCTION public.emit_assessment_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.system_events (entity_type, entity_id, event_type, metadata)
  VALUES ('avaliacao', NEW.id, 'assessment.completed', jsonb_build_object('aluno_id', NEW.aluno_id, 'peso', NEW.peso, 'imc', NEW.imc));
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assessment_events
  AFTER INSERT ON public.avaliacoes_fisicas
  FOR EACH ROW
  EXECUTE FUNCTION public.emit_assessment_event();

-- 8. Trigger: emitir evento ao mudar lifecycle_status do aluno
CREATE OR REPLACE FUNCTION public.emit_lifecycle_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.lifecycle_status IS DISTINCT FROM NEW.lifecycle_status THEN
    INSERT INTO public.pessoa_eventos (pessoa_id, tipo_evento, descricao, dados)
    VALUES (NEW.id, 'lifecycle.changed', 
      'Status alterado de ' || OLD.lifecycle_status || ' para ' || NEW.lifecycle_status,
      jsonb_build_object('old_status', OLD.lifecycle_status::text, 'new_status', NEW.lifecycle_status::text));
    
    INSERT INTO public.system_events (entity_type, entity_id, event_type, metadata)
    VALUES ('aluno', NEW.id, 'lifecycle.changed', 
      jsonb_build_object('nome', NEW.nome, 'old_status', OLD.lifecycle_status::text, 'new_status', NEW.lifecycle_status::text));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lifecycle_events
  AFTER UPDATE ON public.alunos
  FOR EACH ROW
  EXECUTE FUNCTION public.emit_lifecycle_event();
