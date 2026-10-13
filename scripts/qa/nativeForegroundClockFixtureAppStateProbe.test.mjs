import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {resolve,relative,isAbsolute} from 'node:path';
import {validateFixtureInvocation,validateFixtureReceipt} from './nativeForegroundClockFixtureReadback.mjs';
import {validateFixtureLifecycle,lifecycleExclusionBounds} from './nativeForegroundClockFixtureLifecycle.mjs';
const runId='12345678-1234-4234-8234-123456789abc';
const cold={protocol:'patternly.native-clock-fixture.v1',stage:'ready',runId,mode:'seed',scenario:'countdown',errorCategory:null,cleanupVerified:false,
  countdownMs:60000,initialElapsedMs:0,durableElapsedMs:0,checkpointRevision:1,running:false,elapsedMs:0,encrypted:true,
  metrics:{checkpointCount:0,maxOutstandingMs:0,maxWriteMs:0}};
const bg={...cold,durableElapsedMs:1234,elapsedMs:1234,checkpointRevision:4,metrics:{...cold.metrics,checkpointCount:3}};
const events=[{state:'background',atMs:1000,clock:bg},{state:'active',atMs:6500,clock:{...bg,running:true,durableElapsedMs:1240,elapsedMs:1250,checkpointRevision:5,metrics:{...bg.metrics,checkpointCount:4}}}];
const original=readFileSync(new URL('./nativeForegroundClockFixtureAppStateProbe.mjs',import.meta.url),'utf8');
function harness({badCold=false,badPause=false,homeFails=false,pendingActive=false,latePair=false}={}) {
  const effects=[],outputs=[];let evalCount=0;const times=latePair?[9000,9010,15400,15580,15590,20580]:pendingActive?[9000,9010,15400,15580,15590,15600,15690,15700]:[9000,9010,15400,15580,15590,15600];
  const context=vm.createContext({resolve,relative,isAbsolute,validateFixtureInvocation,validateFixtureReceipt,validateFixtureLifecycle,lifecycleExclusionBounds,
    realpathSync:p=>p,lstatSync:()=>({isDirectory:()=>true,uid:501,mode:0o700}),process:{getuid:()=>501,kill:(pid,signal)=>effects.push(['kill',pid,signal])},
    openSync:()=>1,closeSync:()=>{},writeFileSync:(_fd,value)=>outputs.push(JSON.parse(value)),performance:{now:()=>times.shift()},delay:async()=>{},
    assertOwned:(pid)=>effects.push(['owned',pid]),killOwnedAndConfirm:async(pid)=>{effects.push(['kill',pid,'SIGKILL']);effects.push(['death_confirmed',pid]);},spawnSync:(command)=>command==='maestro'?{status:homeFails?1:0}:{status:0,stdout:'com.lkurczab.patternly: 42'},
    evaluateNativeForegroundClock:async(_origin,expression)=>{
      evalCount++;effects.push(['evaluate',expression]);
      if(evalCount===1)return {clock:badCold?{...cold,elapsedMs:1}:cold,receipts:[],jsAtMs:0};
      if(evalCount===2)return {checkpointRevision:2,running:true};
      if(expression.includes('return c.pause()'))return badPause?{checkpointRevision:6,running:false,raw:'private'}:{checkpointRevision:6,running:false};
      if(evalCount===3&&pendingActive)return {receipts:events.slice(0,1),jsAtMs:6595};
      if(evalCount===3||pendingActive)return {receipts:pendingActive?[events[0],{...events[1],atMs:6600}]:events,jsAtMs:pendingActive?6695:6595};
      return badPause?{checkpointRevision:6,running:false,raw:'private'}:{checkpointRevision:6,running:false};
    }});
  const source=original.slice(0,original.indexOf('if(process.argv[1]')).replace(/^import .*;$/gmu,'').replace(/^const ROOT=.*;$/mu,"const ROOT='/workspace/patternly/';").replace(/^export /gmu,'');
  vm.runInContext(source+'\nwaitForDebugger=async()=>{};',context);
  return {effects,outputs,run:()=>vm.runInContext(`runFixtureAppStateProbe({mode:'seed',scenario:'countdown',runId:'${runId}',pid:42,binarySha256:'${'a'.repeat(64)}',privateRoot:'/workspace/patternly/artifacts/private/probe'})`,context)};
}
test('actual orchestration body fences pause, accepts only closed evidence and bounds uncertain effects',async()=>{
  const good=harness();assert.equal((await good.run()).stage,'fixture_appstate_passed');assert.equal(good.outputs.length,1);
  assert.equal(good.effects.some(e=>e[0]==='kill'),false);
  const pauseIndex=good.effects.findIndex(e=>e[0]==='evaluate'&&e[1].includes('return c.pause()'));
  assert.equal(good.effects[pauseIndex-1][0],'owned');
  const pending=harness({pendingActive:true});assert.equal((await pending.run()).stage,'fixture_appstate_passed');
  assert.equal(pending.effects.filter(e=>e[0]==='evaluate'&&e[1].includes('return c.enter()')).length,1);
  for(const options of [{badPause:true},{homeFails:true},{latePair:true}]) {
    const bad=harness(options);await assert.rejects(bad.run());assert.equal(bad.outputs.length,1);assert.equal(bad.outputs[0].stage,'failed');
    assert.deepEqual(bad.effects.filter(e=>e[0]==='kill'),[['kill',42,'SIGKILL']]);
    assert.deepEqual(bad.effects.filter(e=>e[0]==='death_confirmed'),[['death_confirmed',42]]);
  }
  const refused=harness({badCold:true});await assert.rejects(refused.run());
  assert.equal(refused.effects.filter(e=>e[0]==='evaluate').length,1);assert.equal(refused.effects.some(e=>e[0]==='kill'),false);
});
