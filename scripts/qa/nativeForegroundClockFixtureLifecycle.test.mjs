import test from 'node:test';
import assert from 'node:assert/strict';
import {validateFixtureLifecycle,lifecycleExclusionBounds} from './nativeForegroundClockFixtureLifecycle.mjs';
const runId='12345678-1234-4234-8234-123456789abc';
const clock={protocol:'patternly.native-clock-fixture.v1',stage:'ready',runId,mode:'recover',scenario:'countdown',errorCategory:null,cleanupVerified:false,
  countdownMs:60000,initialElapsedMs:0,durableElapsedMs:1234,checkpointRevision:4,running:false,elapsedMs:1234,encrypted:true,
  metrics:{checkpointCount:3,maxOutstandingMs:1000,maxWriteMs:0.2}};
const receipts=[{state:'background',atMs:1000,clock},{state:'active',atMs:6500,clock:{...clock,running:true,durableElapsedMs:1240,elapsedMs:1250,metrics:{...clock.metrics,checkpointCount:4}}}];
test('lifecycle proof requires a closed ordered stopped-background and native-resumed pair',()=>{
  assert.deepEqual(validateFixtureLifecycle(receipts,'recover','countdown',runId),receipts);
  for(const bad of [[],[...receipts,receipts[1]],[receipts[1],receipts[0]], [{...receipts[0],extra:'private'},receipts[1]],
    [{...receipts[0],clock:{...clock,running:true}},receipts[1]],[receipts[0],{...receipts[1],clock:{...receipts[1].clock,runId:'foreign'}}],
    [receipts[0],{...receipts[1],atMs:999}]])assert.throws(()=>validateFixtureLifecycle(bad,'recover','countdown',runId));
});
test('background exclusion includes host foreground/read uncertainty instead of treating JS callback time as native cutoff',()=>{
  const samples=[{sendAtMs:9000,receiveAtMs:9010,jsAtMs:0},{sendAtMs:15590,receiveAtMs:15600,jsAtMs:6595}];
  assert.deepEqual(lifecycleExclusionBounds(receipts,15400,15600,samples),{backgroundEventIntervalMs:5500,backgroundDurationLowerMs:5394,foregroundWindowUpperMs:201,observedResumeElapsedMs:16,clockCorrelationWidthMs:7,stoppedBackgroundElapsedMs:1234,activeElapsedMs:1250});
  assert.throws(()=>lifecycleExclusionBounds(receipts,14999,15600,samples));
  for(const foreground of [9500,15550])assert.throws(()=>lifecycleExclusionBounds(receipts,foreground,15600,samples));
  assert.throws(()=>lifecycleExclusionBounds(receipts,15400,15600,[samples[0],{...samples[1],jsAtMs:9000}]));
  assert.throws(()=>lifecycleExclusionBounds(receipts,15400,15600,[samples[0],{...samples[1],jsAtMs:6400}]));
  assert.throws(()=>lifecycleExclusionBounds(receipts,15400,15599,samples));
  assert.throws(()=>lifecycleExclusionBounds(receipts,15400,15600));
});
