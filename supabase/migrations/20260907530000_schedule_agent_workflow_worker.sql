-- Ativação do worker de workflows
-- Execute no SQL Editor do projeto Supabase após publicar a Edge Function
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('gym-manager-agent-workflow-worker')
where exists (
  select 1 from cron.job where jobname = 'gym-manager-agent-workflow-worker'
);

select cron.schedule(
  'gym-manager-agent-workflow-worker',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_url', true) || '/functions/v1/agent-workflow-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key', true)
    ),
    body := jsonb_build_object('limit', 50)
  );
  $$
);
