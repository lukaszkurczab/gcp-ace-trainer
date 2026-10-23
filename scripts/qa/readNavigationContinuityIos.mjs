import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseOrigin, request, selectTarget } from './readNativeStartupTrace.mjs';
const key = '__patternlyNavigationContinuityV1';
export function buildMonitorExpression(action) {
  if (action === 'inventory') return readFileSync(new URL('./navigationStorageRead.js', import.meta.url), 'utf8');
  if (!['start', 'stop'].includes(action)) throw Error('action_rejected');
  return `(()=>{
    if(!globalThis.HermesInternal||typeof __DEV__==='undefined'||!__DEV__)throw Error('runtime_rejected');
    const entries=Array.from(__r.getModules().entries());
    const envModule=entries.find(([,m])=>m.isInitialized&&m.verboseName.endsWith('src/infrastructure/runtime/environmentIdentity.ts'));
    if(!envModule)throw Error('runtime_rejected');
    const env=__r(envModule[0]).readEnvironmentIdentity();
    if(env.mode!=='smoke'||env.apiOrigin!=='http://127.0.0.1:8080')throw Error('runtime_rejected');
    const h=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if(!h||typeof h.onCommitFiberRoot!=='function')throw Error('hook_unavailable');
    const key=${JSON.stringify(key)};
    ${action === 'stop' ? `const out=globalThis[key];if(!out)throw Error('monitor_missing');out.off();delete globalThis[key];return JSON.stringify({schema:'patternly.navigation-commits.v1',evidence:'focused_react_commits_not_pixel_frames',commits:out.commits,truncated:out.truncated,observationFailed:out.failed,events:out.events});` : `
    if(globalThis[key])throw Error('already_running');
    const out={events:[],commits:0,truncated:false,failed:false};
    const started=performance.now();
    function collect(){
      out.commits++;const ids=new Set(),screens=new Set();
      function walk(f){for(let n=f;n;n=n.sibling){const p=n.memoizedProps;
        if(p?.navigation&&typeof p.navigation.isFocused==='function'&&!p.navigation.isFocused())continue;
        if((n.tag===22&&n.memoizedState!==null)||p?.activityState===0||p?.mode==='hidden'||p?.style?.display==='none')continue;
        const name=n.type?.displayName||n.type?.name;
        if(typeof name==='string'&&/^(HomeScreen|HomeTab|ProgressTab|SettingsTab|SelectTrackScreen|PracticeHubScreen|PracticeSetupScreen|TopicRoadmapScreen|ActivityScreen|GoalCadenceScreen|LearningPlanProposalScreen|LearningPlanEditorScreen|PremiumPurchaseScreen|AccountEntryScreen|LanguageSettingsScreen|AppearanceSettingsScreen|YourDataScreen|LegalInformationScreen|AccountSecurityScreen|NotificationSettingsScreen|PrivacyRequestsScreen|LegalRequestsScreen)$/.test(name))screens.add(name);
        if(typeof p?.testID==='string'&&(/^[a-z-]+-loading-skeleton$/.test(p.testID)||/^(account-session-restore-loading|account-profile-transition-loading|account-recovery-accepted|account-reset-complete|profile-storage-preparing|profile-transition-required|application-preparation-loading|home-overview|patternly:practice:hub:root|patternly:practice:setup:root|patternly:practice:topic-chooser:root|patternly:home:select-track:root|patternly:progress:root|patternly:content:ready|patternly:content:unavailable)$/.test(p.testID)))ids.add(p.testID);
        walk(n.child);
      }}
      for(const id of h.renderers.keys())for(const root of h.getFiberRoots(id))walk(root.current);
      const state={ids:[...ids].sort(),screens:[...screens].sort()},serialized=JSON.stringify(state);
      if(serialized!==out.last){if(out.events.length>=2048){out.truncated=true;return;}out.events.push({atMs:performance.now()-started,...state});out.last=serialized;}
    }
    const original=h.onCommitFiberRoot;
    function wrapped(...args){const result=original.apply(this,args);try{collect();}catch{out.failed=true;}return result;}
    collect();h.onCommitFiberRoot=wrapped;
    out.off=()=>{if(h.onCommitFiberRoot===wrapped)h.onCommitFiberRoot=original;};globalThis[key]=out;
    return JSON.stringify({schema:'patternly.navigation-monitor-start.v1',started:true});`}
  })()`;
}
export async function monitorNavigation(originValue, action) {
  const expression=buildMonitorExpression(action);
  const origin=parseOrigin(originValue);
  const targets=await(await fetch(new URL('/json/list',origin),{signal:AbortSignal.timeout(5000)})).json();
  const require=createRequire(new URL('../../package.json',import.meta.url));
  const WS=require('ws');
  const socket=new WS(selectTarget(targets,origin),{origin:`http://127.0.0.1:${origin.port}`,handshakeTimeout:5000,maxPayload:2*1024*1024,followRedirects:false});
  try{
    await new Promise((resolve,reject)=>{socket.once('open',resolve);socket.once('error',()=>reject(Error('connect_failed')));});
    const result=await request(socket,1,'Runtime.evaluate',{expression,returnByValue:true,silent:true});
    if(result.error||result.result?.exceptionDetails)throw Error('observation_failed');
    return JSON.parse(result.result.result.value);
  }finally{socket.terminate();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const [origin,action,...extra]=process.argv.slice(2);
  Promise.resolve().then(()=>{if(extra.length)throw Error('arguments_rejected');return monitorNavigation(origin,action);}).then(x=>console.log(JSON.stringify(x))).catch(e=>{console.error(JSON.stringify({stage:'navigation_observation',category:['action_rejected','arguments_rejected','origin_rejected','target_rejected','connect_failed','observation_failed','read_timeout','transport_closed'].includes(e.message)?e.message:'read_failed'}));process.exitCode=1;});
}
