import { ReactNode, useEffect, useState } from 'react';
import { useOperationalContext } from '@/hooks/useOperationalContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export function FeatureGate({ feature, children }: { feature:'staff'|'ai_reports'|'corporate'; children:ReactNode }) {
  const { activeOrg } = useOperationalContext();
  const [enabled,setEnabled] = useState(false),[loading,setLoading] = useState(true),[error,setError] = useState('');
  const [revision,setRevision] = useState(0);
  useEffect(()=>{
    let live=true;setLoading(true);setEnabled(false);setError('');
    if(!activeOrg){setLoading(false);return;}
    void supabase.from('organizations').select('metadata').eq('id',activeOrg.id).single().then(({data,error})=>{
      if(!live)return;
      if(error)setError('Não foi possível consultar a ativação desta funcionalidade.');
      else setEnabled((data.metadata as Record<string,any>)?.features?.[feature]===true);
      setLoading(false);
    });
    return()=>{live=false;};
  },[activeOrg?.id,feature,revision]);
  if(loading)return <div className="p-6" role="status">Consultando funcionalidades do condomínio…</div>;
  if(error)return <div className="p-6" role="alert"><p>{error}</p><Button onClick={()=>setRevision(r=>r+1)}>Tentar novamente</Button></div>;
  if(!enabled)return <div className="p-6 space-y-3"><h1 className="text-xl font-medium">Funcionalidade ainda não ativada</h1><p>{activeOrg?'A administração precisa configurar e liberar esta funcionalidade para o seu condomínio.':'Selecione um condomínio para continuar.'}</p><Button variant="outline" onClick={()=>window.history.back()}>Voltar</Button></div>;
  return <>{children}</>;
}
