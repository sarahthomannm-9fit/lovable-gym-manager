-- Preserve existing accounting/check-in behavior while binding schema references.
DO $migration$
DECLARE fn text;definition text;
BEGIN
 FOREACH fn IN ARRAY ARRAY['fn_pagamento_confirmar','fn_checkin_registrar'] LOOP
  SELECT pg_get_functiondef(p.oid) INTO definition FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname=fn AND p.pronargs=0;
  definition:=replace(definition,'SECURITY DEFINER','SECURITY DEFINER SET search_path TO ''''');
  definition:=replace(definition,'INSERT INTO system_events','INSERT INTO public.system_events');
  definition:=replace(definition,'INSERT INTO notificacoes','INSERT INTO public.notificacoes');
  definition:=replace(definition,'UPDATE assinaturas','UPDATE public.assinaturas');
  definition:=replace(definition,'INSERT INTO frequencia_alunos','INSERT INTO public.frequencia_alunos');
  EXECUTE definition;
 END LOOP;
END; $migration$;
