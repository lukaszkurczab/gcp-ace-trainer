import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { parseOrigin, selectTarget, request } from './readNativeStartupTrace.mjs';

const actions = new Set(['status', 'back', 'practice', 'approach', 'resume', 'start', 'select', 'select-partial', 'explain', 'leave', 'keep-learning', 'pause-test', 'end-test', 'show-feedback', 'submit', 'advance', 'finish', 'abort-empty-test', 'abandon-test']);

/** Local smoke QA only. Uses actual focused React handlers, never claims native touch/paint timing. */
export async function probeApproachChallengeInteraction(originValue, action) {
  if (!actions.has(action)) throw Error('action_rejected');
  const origin = parseOrigin(originValue);
  const response = await fetch(new URL('/json/list', origin), { signal: AbortSignal.timeout(5000), redirect: 'error' });
  const WS = createRequire(new URL('../../node_modules/@react-native/dev-middleware/package.json', import.meta.url))('ws');
  const socket = new WS(selectTarget(await response.json(), origin), { origin: `http://127.0.0.1:${origin.port}`, handshakeTimeout: 5000, maxPayload: 65536, followRedirects: false });
  const key = 'patternly.acm-interaction-probe.v1';
  try {
    await new Promise((yes, no) => { socket.once('open', yes); socket.once('error', () => no(Error('connection_failed'))); });
    const expression = `(()=>{try{
      if(!__DEV__||!globalThis.HermesInternal)throw Error('runtime_rejected');
      const entries=Array.from(__r.getModules().entries());
      const load=s=>{const xs=entries.filter(([,m])=>m.isInitialized&&m.verboseName?.endsWith(s));if(xs.length!==1)throw Error('owner_unavailable');return __r(xs[0][0]);};
      const environment=load('src/infrastructure/runtime/environmentIdentity.ts').readEnvironmentIdentity();
      if(environment.mode!=='smoke'||environment.apiOrigin!=='http://127.0.0.1:8080'||environment.firebaseProjectId!=='patternly-app-sandbox'||!load('src/application/premiumTesting.ts').hasPremiumTestingAccess())throw Error('runtime_rejected');
      const storage=load('src/infrastructure/storage/mmkvClient.ts'),lease=storage.captureActiveProfileStorageLease();
      if(!lease||!storage.isActiveProfileStorageLeaseCurrent(lease))throw Error('profile_rejected');
      const admission=load('src/application/tracks/trackAdmissionContext.ts').productionTrackAdmissionContext;
      const sessions=load('src/storage/repositories/trainingSessionRepository.ts');
      const active=()=>sessions.readActiveTrainingSession(admission);
      const before=active(),action=${JSON.stringify(action)};
      const exitSelectors=['leave','keep-learning','pause-test','end-test'].includes(action)?load('src/testing/runtimeSelectors.ts').runtimeSelectors.session:null;
      const exitTestId=exitSelectors&&before?(action==='leave'?exitSelectors.leave(before.id):action==='pause-test'?exitSelectors.leaveAndResume(before.id):action==='end-test'?exitSelectors.abandon(before.id):exitSelectors.keepLearning(before.id)):null;
      if(action==='pause-test'||action==='end-test'){
        const owned=globalThis[Symbol.for('patternly.acm-probe-owned-sessions.v1')],originalLease=owned?.get(before?.id);
        if(!before||before.modeId!=='coding-interview-approach-challenge'||!originalLease||!storage.isActiveProfileStorageLeaseCurrent(originalLease))throw Error('session_rejected');
        const attempts=load('src/storage/repositories/trainingAttemptRepository.ts').readTrainingAttempts(admission).value;
        if(attempts.some(attempt=>attempt.sessionId===before.id)||load('src/storage/repositories/mutationJournalRepository.ts').hasPendingMutationJournal())throw Error('session_rejected');
      }
      let selectTestId='acm6-option-0';
      if(action==='select-partial'){
        if(!before||before.modeId!=='coding-interview-approach-challenge')throw Error('session_rejected');
        const helpers=load('src/application/coding-interview/approachChallengeSession.ts');
        const manifest=helpers.decodeApproachChallengeManifest(before.configurationSnapshot[helpers.APPROACH_CHALLENGE_MANIFEST_KEY],before);
        const occurrence=before.itemOrder[before.currentItemIndex],stage=helpers.approachChallengeStageForOccurrence(manifest,occurrence.occurrenceId);
        const track=load('src/application/contentPackageRuntimeOwner.ts').contentPackageRuntimeOwner.getPreparedDiscovery(before.trackId,before.modeId).track;
        if(!stage||stage.stage!=='approach'||track.contentVersion!==before.contentVersion||track.artifactSha256!==before.artifactSha256)throw Error('session_rejected');
        const problem=helpers.resolveManifestEntryProblem(stage.entry,(id,version)=>track.approachChallengeProblems?.find(p=>p.problemId===id&&p.problemVersion===version),before);
        const option=problem.approachQuestion.interaction.options.find(option=>option.grade==='partial');
        const index=before.optionOrderByOccurrence[occurrence.occurrenceId]?.indexOf(option?.optionId);
        if(!option||index===undefined||index<0)throw Error('partial_option_unavailable');
        selectTestId='acm6-option-'+index;
      }
      const snapshot=()=>{const h=__REACT_DEVTOOLS_GLOBAL_HOOK__,handlers=new Set(),options=[],ids=new Set(),scrollers=new Set();let count=0,approachSetup=false;
        function walk(f){for(let n=f;n;n=n.sibling){if(++count>12000)throw Error('bounds_rejected');const p=n.memoizedProps??{};
          if(p.navigation&&typeof p.navigation.isFocused==='function'&&!p.navigation.isFocused())continue;
          if((n.tag===22&&n.memoizedState!==null)||p.activityState===0||p.mode==='hidden'||p.style?.display==='none')continue;
          if(typeof p.testID==='string')ids.add(p.testID);
          if(p.title==='Approach Challenge'&&typeof p.description==='string')approachSetup=true;
          if(p.testID?.startsWith('acm6-option-')&&typeof p.state==='string')options.push({id:p.testID,state:p.state,labeled:Boolean(p.resultLabel),checked:p.accessibilityState?.checked===true});
          if(typeof n.stateNode?.scrollToEnd==='function')scrollers.add(n.stateNode);
          const testId=exitTestId??(action==='practice'?'main-tab-bar-practice':action==='approach'?'practice-approach-challenge':action==='resume'?'patternly:resume:continue:'+before?.id:action==='select'||action==='select-partial'?selectTestId:action==='explain'?'acm-explanation-toggle':null);
          const label=action==='start'?'Start session':action==='submit'?'Submit answer':action==='finish'?'Finish session':null;
          const matches=testId?p.testID===testId:label?p.children===label:action==='advance'&&(p.children==='Continue'||p.children==='Continue to complexity');
          if(matches&&typeof p.onPress==='function'&&!p.disabled&&!p.accessibilityState?.disabled)handlers.add(p.onPress);
          if(action==='back'&&p.ambientVariant==='activity'&&typeof p.backAction?.onPress==='function')handlers.add(p.backAction.onPress);
          walk(n.child);
        }}
        for(const id of h.renderers.keys())for(const root of h.getFiberRoots(id))walk(root.current);
        return {handlers,options,ids,approachSetup,scrollers};
      };
      const initial=snapshot();
      const info=s=>({mode:s?.modeId??null,index:s?.currentItemIndex??null,options:initial.options.length});
      if(action==='status')return JSON.stringify({stage:'read_only',...info(before),hasApproach:initial.ids.has('practice-approach-challenge'),approachSetup:initial.approachSetup,review:{partial:initial.options.filter(option=>option.state==='partial').length,labeledOptimal:initial.options.filter(option=>['correct','omitted_correct'].includes(option.state)&&option.labeled).length,checked:initial.options.filter(option=>option.checked).length,explanationToggle:initial.ids.has('acm-explanation-toggle'),explanationExpanded:initial.ids.has('acm-explanation')}});
      if(action==='show-feedback'){
        if(!before||before.modeId!=='coding-interview-approach-challenge'||!initial.ids.has('acm-explanation-toggle')||initial.scrollers.size!==1)throw Error('focused_handler_rejected');
        initial.scrollers.values().next().value.scrollToEnd({animated:false});return JSON.stringify({stage:'scroll_requested'});
      }
      if(action==='abort-empty-test'||action==='abandon-test'){
        const owned=globalThis[Symbol.for('patternly.acm-probe-owned-sessions.v1')],originalLease=owned?.get(before?.id);
        if(!before||before.modeId!=='coding-interview-approach-challenge'||!originalLease||!storage.isActiveProfileStorageLeaseCurrent(originalLease))throw Error('session_rejected');
        const attempts=load('src/storage/repositories/trainingAttemptRepository.ts').readTrainingAttempts(admission).value;
        if((action==='abort-empty-test'&&attempts.some(attempt=>attempt.sessionId===before.id))||load('src/storage/repositories/mutationJournalRepository.ts').hasPendingMutationJournal())throw Error('session_rejected');
        owned.delete(before.id);
        const out={pending:true,action};globalThis[Symbol.for(${JSON.stringify(key)})]=out;
        load('src/application/trainingLifecycle/applicationLifecycle.ts').getTrainingLifecycleUseCases().abandonActiveSession().then(()=>{out.pending=false;out.stage=action==='abort-empty-test'?'empty_test_session_abandoned':'owned_test_session_abandoned';},()=>{out.pending=false;out.stage='abandonment_failed_no_repeat';});
        return JSON.stringify({stage:'invoked',action});
      }
      if(action==='start'&&(before||!initial.approachSetup))throw Error('active_session_rejected');
      if(['resume','select','select-partial','explain','leave','keep-learning','pause-test','end-test','submit','advance','finish'].includes(action)&&(!before||before.modeId!=='coding-interview-approach-challenge'))throw Error('session_rejected');
      if(action==='explain'&&initial.ids.has('acm-explanation'))throw Error('already_invoked');
      if(initial.handlers.size!==1)throw Error('focused_handler_rejected');
      const symbol=Symbol.for(${JSON.stringify(key)});if(globalThis[symbol]?.pending)throw Error('probe_pending');
      const once=Symbol.for('patternly.acm-interaction-invocations.v1'),invoked=globalThis[once]??(globalThis[once]=new Set());
      const command=(before?.id??'setup')+':'+(before?.currentItemIndex??'setup')+':'+action;
      if(['start','submit','advance','finish','pause-test','end-test'].includes(action)&&invoked.has(command))throw Error('already_invoked');
      invoked.add(command);
      const out={pending:true,action,started:performance.now()},hook=__REACT_DEVTOOLS_GLOBAL_HOOK__,original=hook.onCommitFiberRoot;
      let timer;
      const stop=()=>{if(hook.onCommitFiberRoot===wrapped)hook.onCommitFiberRoot=original;clearTimeout(timer);};
      function wrapped(...args){const result=original.apply(this,args);try{
        if(!storage.isActiveProfileStorageLeaseCurrent(lease))throw Error('profile_rejected');
        const current=active(),view=snapshot();
        const reviewed=view.options.some(option=>['correct','incorrect','omitted_correct'].includes(option.state));
        const done=action==='back'?view.ids.has('practice-approach-challenge')||view.ids.has('home-overview'):action==='practice'?view.ids.has('practice-approach-challenge'):action==='approach'?view.options.length>0||!view.ids.has('practice-approach-challenge'):action==='start'||action==='resume'?view.options.length>0:action==='select'||action==='select-partial'?view.options.some(option=>option.id===selectTestId&&option.state==='selected'):action==='explain'?view.ids.has('acm-explanation'):action==='leave'?view.ids.has(exitSelectors.keepLearning(before.id)):action==='keep-learning'?!view.ids.has(exitSelectors.keepLearning(before.id))&&view.options.length>0:action==='pause-test'?current?.id===before.id&&view.options.length===0&&!view.ids.has(exitSelectors.leaveAndResume(before.id)):action==='end-test'?!current&&view.options.length===0:action==='submit'?reviewed:action==='finish'?!current:current?.id===before?.id&&current.currentItemIndex!==before.currentItemIndex&&view.options.length>0&&!reviewed;
        if(done){
          if(action==='start'&&current){const symbol=Symbol.for('patternly.acm-probe-owned-sessions.v1'),owned=globalThis[symbol]??(globalThis[symbol]=new Map());owned.set(current.id,lease);}
          out.pending=false;out.stage='react_commit';out.elapsedMs=performance.now()-out.started;out.index=current?.currentItemIndex??null;stop();}
      }catch{out.pending=false;out.stage='observation_failed';stop();}return result;}
      hook.onCommitFiberRoot=wrapped;globalThis[symbol]=out;
      timer=setTimeout(()=>{out.pending=false;out.stage='observation_timeout';stop();},8000);
      initial.handlers.values().next().value();return JSON.stringify({stage:'invoked',action});
    }catch(error){return JSON.stringify({stage:'rejected',category:['runtime_rejected','owner_unavailable','profile_rejected','bounds_rejected','active_session_rejected','session_rejected','partial_option_unavailable','focused_handler_rejected','probe_pending','already_invoked'].includes(error.message)?error.message:'probe_unavailable'});}})()`;
    const first = await request(socket, 1, 'Runtime.evaluate', { expression, returnByValue: true, silent: true });
    const value = JSON.parse(first.result?.result?.value ?? 'null');
    if (value?.stage !== 'invoked') return value;
    for (let attempt = 0; attempt < 80; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const reply = await request(socket, attempt + 2, 'Runtime.evaluate', { expression: `JSON.stringify((()=>{const x=globalThis[Symbol.for(${JSON.stringify(key)})];return x&&!x.pending?{stage:x.stage,action:x.action,elapsedMs:x.elapsedMs??null,index:x.index??null,nativeGesture:false,nativePaint:false}:null;})())`, returnByValue: true, silent: true });
      const result = JSON.parse(reply.result?.result?.value ?? 'null');
      if (result) return result;
    }
    throw Error('observation_timeout_no_repeat');
  } finally { socket.terminate(); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [origin, action, ...extra] = process.argv.slice(2);
  Promise.resolve().then(() => { if (extra.length) throw Error('arguments_rejected'); return probeApproachChallengeInteraction(origin, action); })
    .then(value => console.log(JSON.stringify(value)))
    .catch(() => { console.error('acm/probe-failed; inspect current state before repeating any action'); process.exitCode = 1; });
}
