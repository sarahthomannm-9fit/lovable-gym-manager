/** Retain only a digest and random operation id; never persist the form's private text. */
export async function operationId(operation:string,scope:string,payload:unknown){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(payload)));
  const fingerprint=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  const key=`nine:operation:${operation}:${scope}`;
  try{
    const saved=JSON.parse(sessionStorage.getItem(key)||'null');
    if(saved?.fingerprint===fingerprint&&saved?.id)return {id:saved.id as string,key};
  }catch{/* A corrupt draft cannot authorize an operation. */}
  const id=crypto.randomUUID();
  sessionStorage.setItem(key,JSON.stringify({id,fingerprint}));
  return {id,key};
}
export function completeOperation(key:string){sessionStorage.removeItem(key);}
