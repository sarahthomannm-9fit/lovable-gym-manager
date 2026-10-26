/** The deployment identifies its own environment; a localhost URL is not a sandbox DB. */
export function EnvironmentBadge(){
  const environment=import.meta.env.VITE_APP_ENV || (import.meta.env.DEV?'development':'production');
  if(environment==='production')return null;
  const project=String(import.meta.env.VITE_SUPABASE_URL||'https://jobytedbdptuncvobarw.supabase.co').replace(/^https?:\/\//,'').split('.')[0];
  return <div className="border-b bg-amber-50 px-3 py-1 text-xs text-amber-950" role="status">Ambiente: {environment} · Banco: {project} · Versão: {import.meta.env.VITE_BUILD_SHA||'local'}{import.meta.env.VITE_BUILD_DIRTY==='true'?' + alterações locais':''}</div>;
}
