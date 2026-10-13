import {openSync,writeFileSync,closeSync,lstatSync,realpathSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import {setTimeout as delay} from 'node:timers/promises';
import {resolve,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertOwned,killOwnedAndConfirm} from './nativeForegroundClockKillProbe.mjs';
import {evaluateNativeForegroundClock} from './nativeForegroundClockReadback.mjs';
import {validateFixtureInvocation,validateFixtureReceipt} from './nativeForegroundClockFixtureReadback.mjs';
import {validateFixtureLifecycle,lifecycleExclusionBounds} from './nativeForegroundClockFixtureLifecycle.mjs';
import {selectTarget} from './readNativeStartupTrace.mjs';
const ROOT=fileURLToPath(new URL('../../',import.meta.url));
const ORIGIN='http://127.0.0.1:8082';
const DEVICE='7F315654-3175-4F3C-BB24-B0263F59360C';
async function waitForDebugger() {
  const deadline=performance.now()+5_000;
  while(performance.now()<deadline) {
    try {const response=await fetch(ORIGIN+'/json/list',{signal:AbortSignal.timeout(500),redirect:'error'});
      if(response.ok){const body=await response.text();if(body.length<=64*1024){selectTarget(JSON.parse(body),new URL(ORIGIN));return;}}}catch{}
    await delay(100);
  }
  throw Error('fixture_debugger_not_ready');
}
export async function runFixtureAppStateProbe({mode,scenario,runId,pid,binarySha256,privateRoot}) {
  validateFixtureInvocation(mode,scenario,runId);
  if(mode==='cleanup'||scenario!=='countdown'||!Number.isSafeInteger(pid)||pid<=1||!/^[a-f0-9]{64}$/u.test(binarySha256))throw Error('arguments_rejected');
  const inside=relative(resolve(ROOT,'artifacts/private'),privateRoot),metadata=lstatSync(privateRoot);
  if(!isAbsolute(privateRoot)||realpathSync(privateRoot)!==privateRoot||!inside||inside.startsWith('..')||isAbsolute(inside)
    ||!metadata.isDirectory()||metadata.uid!==process.getuid()||(metadata.mode&0o777)!==0o700)throw Error('private_path_rejected');
  assertOwned(pid,binarySha256);
  const outputFd=openSync(resolve(privateRoot,'receipt.json'),'wx',0o600);
  let logFd,entered=false,paused=false,diagnostic=null;
  try {
    logFd=openSync(resolve(privateRoot,'maestro.log'),'wx',0o600);
    const sendAtMs=performance.now();
    const before=await evaluateNativeForegroundClock(ORIGIN,'(()=>{const c=globalThis.__patternlyNativeClockFixture;return {clock:c?.read(),receipts:c?.lifecycle(),jsAtMs:performance.now()}})()');
    const receiveAtMs=performance.now();
    validateFixtureReceipt(before.clock,mode,scenario,runId);
    if(!Array.isArray(before.receipts)||before.receipts.length!==0||!Number.isFinite(before.jsAtMs))throw Error('fixture_lifecycle_already_used');
    assertOwned(pid,binarySha256);entered=true;
    const entry=await evaluateNativeForegroundClock(ORIGIN,`(()=>{const c=globalThis.__patternlyNativeClockFixture,r=c?.read();if(r?.runId!==${JSON.stringify(runId)}||r.mode!==${JSON.stringify(mode)}||r.scenario!=='countdown'||r.metrics.checkpointCount!==0||r.elapsedMs!==r.durableElapsedMs)return {stage:'refused'};return c.enter()})()`);
    if(entry?.stage==='refused'){entered=false;throw Error('fixture_entry_refused');}
    if(entry?.running!==true||entry.checkpointRevision!==before.clock.checkpointRevision+1)throw Error('fixture_entry_unverified');
    const home=spawnSync('maestro',['--device',DEVICE,'test','--debug-output',resolve(privateRoot,'background'),resolve(ROOT,'.maestro/persist11-background.yaml')],
      {cwd:ROOT,stdio:['ignore',logFd,logFd],timeout:30_000});
    if(home.status!==0)throw Error('fixture_background_command_failed');
    await delay(5_000);
    assertOwned(pid,binarySha256);
    const foregroundSentAtMs=performance.now();
    const launch=spawnSync('xcrun',['simctl','launch',DEVICE,'com.lkurczab.patternly','-RCT_jsLocation','localhost:8082'],{encoding:'utf8',timeout:5_000});
    if(launch.status!==0||launch.stdout.trim()!==`com.lkurczab.patternly: ${pid}`)throw Error('fixture_foreground_process_changed');
    await waitForDebugger();
    let afterSendAtMs,after,readAtMs;
    const eventDeadline=performance.now()+5_000;
    for(;;) {
      afterSendAtMs=performance.now();
      after=await evaluateNativeForegroundClock(ORIGIN,'(()=>{const c=globalThis.__patternlyNativeClockFixture;return {receipts:c?.lifecycle(),jsAtMs:performance.now()}})()');
      readAtMs=performance.now();
      diagnostic={observedLifecycleCount:Array.isArray(after.receipts)?after.receipts.length:null,
        states:Array.isArray(after.receipts)?after.receipts.slice(0,8).map(r=>['active','background'].includes(r?.state)?r.state:'unknown'):[]};
      if(readAtMs>=eventDeadline)throw Error('fixture_active_callback_unavailable');
      if(Array.isArray(after.receipts)&&after.receipts.length===2)break;
      // Inspector readiness can precede the queued JS active callback. Wait
      // read-only for that exact pending transition; never repeat enter/Home.
      if(!Array.isArray(after.receipts)||after.receipts.length!==1||after.receipts[0]?.state!=='background')throw Error('fixture_active_callback_unavailable');
      await delay(100);
    }
    const receipts=validateFixtureLifecycle(after.receipts,mode,scenario,runId);
    const correlations=[{sendAtMs,receiveAtMs,jsAtMs:before.jsAtMs},{sendAtMs:afterSendAtMs,receiveAtMs:readAtMs,jsAtMs:after.jsAtMs}];
    const bounds=lifecycleExclusionBounds(receipts,foregroundSentAtMs,readAtMs,correlations);
    assertOwned(pid,binarySha256);
    const stopped=await evaluateNativeForegroundClock(ORIGIN,`(()=>{const c=globalThis.__patternlyNativeClockFixture,r=c?.read();if(r?.runId!==${JSON.stringify(runId)}||r.mode!==${JSON.stringify(mode)}||r.scenario!=='countdown')throw Error('fixture_pause_scope_rejected');return c.pause()})()`);
    if(!stopped||Object.keys(stopped).sort().join(',')!=='checkpointRevision,running'||stopped.running!==false
      ||!Number.isSafeInteger(stopped.checkpointRevision)||stopped.checkpointRevision<=receipts[1].clock.checkpointRevision)throw Error('fixture_pause_unverified');paused=true;
    assertOwned(pid,binarySha256);
    const result={stage:'fixture_appstate_passed',runId,mode,scenario,pid,bounds,receipts,correlations,foregroundSentAtMs,readAtMs,stopped};
    writeFileSync(outputFd,JSON.stringify(result,null,2)+'\n');return result;
  } catch(error) {
    writeFileSync(outputFd,JSON.stringify({stage:'failed',category:'fixture_appstate_probe_failed',diagnostic})+'\n');
    throw error;
  } finally {
    if(logFd!==undefined)closeSync(logFd);closeSync(outputFd);
    // An uncertain fixture effect cannot be left running. Signal only the
    // verified original process once; failure stays failure, never a retry.
    if(entered&&!paused)await killOwnedAndConfirm(pid,binarySha256);
  }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const[mode,scenario,runId,pid,binarySha256,privateRoot,...extra]=process.argv.slice(2);
  if(!privateRoot||extra.length){console.error(JSON.stringify({stage:'failed',category:'arguments_rejected'}));process.exitCode=1;}
  else runFixtureAppStateProbe({mode,scenario,runId,pid:Number(pid),binarySha256,privateRoot})
    .then(r=>console.log(JSON.stringify({stage:r.stage,bounds:r.bounds}))).catch(()=>{console.error(JSON.stringify({stage:'failed',category:'fixture_appstate_probe_failed'}));process.exitCode=1;});
}
