-- Papéis operacionais usados pelo onboarding do condomínio.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sindico';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'professor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'corporate';

