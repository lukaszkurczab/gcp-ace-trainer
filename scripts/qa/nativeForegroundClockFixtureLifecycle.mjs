import {validateFixtureReceipt,validateFixtureInvocation} from './nativeForegroundClockFixtureReadback.mjs';
export function validateFixtureLifecycle(value,mode,scenario,runId) {
  validateFixtureInvocation(mode,scenario,runId);
  if(mode==='cleanup'||scenario!=='countdown'||!Array.isArray(value)||value.length!==2)throw Error('fixture_lifecycle_rejected');
  for(const [index,receipt]of value.entries()) {
    if(!receipt||Object.keys(receipt).sort().join(',')!=='atMs,clock,state'||receipt.state!==['background','active'][index]
      ||!Number.isFinite(receipt.atMs)||receipt.atMs<0)throw Error('fixture_lifecycle_rejected');
    validateFixtureReceipt(receipt.clock,mode,scenario,runId,{cold:false});
  }
  const [background,active]=value;
  if(active.atMs<=background.atMs||background.clock.running!==false||background.clock.elapsedMs!==background.clock.durableElapsedMs
    ||active.clock.running!==true||active.clock.elapsedMs<background.clock.durableElapsedMs
    ||active.clock.metrics.checkpointCount<=background.clock.metrics.checkpointCount)throw Error('fixture_lifecycle_rejected');
  return value;
}
export function lifecycleExclusionBounds(receipts,foregroundSentAtMs,readAtMs,correlations) {
  const [background,active]=receipts;
  if(!Number.isFinite(foregroundSentAtMs)||!Number.isFinite(readAtMs)||readAtMs<foregroundSentAtMs)throw Error('fixture_lifecycle_timing_rejected');
  if(!Array.isArray(correlations)||correlations.length!==2)throw Error('fixture_clock_correlation_rejected');
  for(const sample of correlations) {
    if(!sample||Object.keys(sample).sort().join(',')!=='jsAtMs,receiveAtMs,sendAtMs'
      ||!Object.values(sample).every(Number.isFinite)||sample.receiveAtMs<sample.sendAtMs
      ||sample.receiveAtMs-sample.sendAtMs>5_000)throw Error('fixture_clock_correlation_rejected');
  }
  const [before,after]=correlations;
  // Hermes and Node performance.now() have different origins. Correlate the
  // observed monotonic domains with two bounded exchanges, never raw compare.
  const offsetLowerMs=Math.max(...correlations.map(s=>s.sendAtMs-s.jsAtMs-1));
  const offsetUpperMs=Math.min(...correlations.map(s=>s.receiveAtMs-s.jsAtMs+1));
  if(offsetLowerMs>offsetUpperMs||before.receiveAtMs>foregroundSentAtMs||after.sendAtMs<foregroundSentAtMs||after.receiveAtMs!==readAtMs
    ||before.jsAtMs>background.atMs||active.atMs>after.jsAtMs
    ||background.atMs+offsetUpperMs>foregroundSentAtMs||foregroundSentAtMs>active.atMs+offsetLowerMs
    ||active.atMs+offsetUpperMs>readAtMs)throw Error('fixture_lifecycle_causality_rejected');
  const foregroundWindowUpperMs=readAtMs-foregroundSentAtMs+1;
  const backgroundDurationLowerMs=foregroundSentAtMs-(background.atMs+offsetUpperMs);
  const observedResumeElapsedMs=active.clock.elapsedMs-background.clock.durableElapsedMs;
  const backgroundEventIntervalMs=active.atMs-background.atMs;
  if(backgroundDurationLowerMs<5_000||foregroundWindowUpperMs>=backgroundEventIntervalMs||observedResumeElapsedMs>foregroundWindowUpperMs)throw Error('fixture_background_exclusion_unverified');
  return {backgroundEventIntervalMs,backgroundDurationLowerMs,foregroundWindowUpperMs,observedResumeElapsedMs,clockCorrelationWidthMs:offsetUpperMs-offsetLowerMs,
    stoppedBackgroundElapsedMs:background.clock.durableElapsedMs,activeElapsedMs:active.clock.elapsedMs};
}
