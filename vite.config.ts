import { execFileSync } from 'node:child_process';
import { defineConfig,loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

const buildIdentity=()=>{
  try{return {sha:execFileSync('git',['rev-parse','--short=12','HEAD'],{encoding:'utf8'}).trim(),dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim().length>0};}
  catch{return {sha:'unknown',dirty:true};}
};

export default defineConfig(({mode})=>{
  const env=loadEnv(mode,process.cwd(),'VITE_');
  const identity=buildIdentity();
  const revision=env.VITE_BUILD_SHA||identity.sha;
  const environment=env.VITE_APP_ENV||(mode==='development'?'development':'production');
  return {
    server:{host:'::',port:8080},
    define:{'import.meta.env.VITE_BUILD_SHA':JSON.stringify(revision),'import.meta.env.VITE_BUILD_DIRTY':JSON.stringify(String(identity.dirty))},
    plugins:[
      react(),
      mode==='development'&&componentTagger(),
      {name:'nine-build-identity',generateBundle(_options,bundle){
        this.emitFile({type:'asset',fileName:'build-info.json',source:JSON.stringify({revision,localChanges:identity.dirty,environment,builtAt:new Date().toISOString(),assets:Object.keys(bundle).filter(name=>/\.(js|css)$/.test(name)).sort()},null,2)});
      }},
    ].filter(Boolean),
    resolve:{alias:{'@':path.resolve(__dirname,'./src')}},
  };
});
