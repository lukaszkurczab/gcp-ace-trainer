import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {readNativeForegroundClockFixture, validateFixtureInvocation} from './nativeForegroundClockFixtureReadback.mjs';
import {runOwnedClockInterruption, validateMarker} from './nativeForegroundClockKillProbe.mjs';

export function fixtureLossBounds(measurement, recovered) {
  const {sendAtMs, markerAtMs, killAtMs, deathAtMs, marker, initial} = measurement;
  validateFixtureInvocation(recovered.mode, recovered.scenario, recovered.runId);
  if (recovered.mode !== 'recover' || initial.scenario === 'overrun' || recovered.runId !== measurement.runId || recovered.scenario !== initial.scenario
    || ![sendAtMs,markerAtMs,killAtMs,deathAtMs].every(Number.isFinite)
    || !(sendAtMs <= markerAtMs && markerAtMs < killAtMs && killAtMs <= deathAtMs)
    || recovered.elapsedMs !== recovered.durableElapsedMs || recovered.metrics.checkpointCount !== 0
    || recovered.checkpointRevision < marker.enterCheckpointRevision) throw Error('fixture_recovery_rejected');
  validateMarker(marker, initial);
  const cap = value => Math.max(initial.durableElapsedMs, Math.min(initial.countdownMs, value));
  const expectedLowerMs = cap(marker.baselineElapsedMs + killAtMs - markerAtMs);
  const expectedUpperMs = cap(marker.baselineElapsedMs + 1 + deathAtMs - sendAtMs);
  const uncertaintyMs = expectedUpperMs - expectedLowerMs;
  if (uncertaintyMs > 5_000) throw Error('measurement_inconclusive');
  // The marker's live elapsed sample can already be ahead of the enter
  // checkpoint. A pre-periodic kill may legitimately recover that checkpoint.
  if (recovered.durableElapsedMs < marker.preElapsedMs || recovered.durableElapsedMs > expectedUpperMs
    || recovered.running !== (recovered.durableElapsedMs < initial.countdownMs)) throw Error('fixture_recovery_rejected');
  const periodicCheckpointCount = recovered.checkpointRevision-marker.enterCheckpointRevision;
  if ((measurement.requestedKillDelayMs >= 1_000 || initial.scenario === 'cap') && periodicCheckpointCount < 1) throw Error('fixture_periodic_checkpoint_missing');
  if (initial.scenario === 'cap' && (recovered.durableElapsedMs !== initial.countdownMs || recovered.running !== false)) throw Error('fixture_cap_unverified');
  return {expectedLowerMs,expectedUpperMs,recoveredElapsedMs:recovered.durableElapsedMs,
    lossLowerMs:Math.max(0,expectedLowerMs-recovered.durableElapsedMs),
    lossUpperMs:Math.max(0,expectedUpperMs-recovered.durableElapsedMs),uncertaintyMs,
    periodicCheckpointCount};
}
export function fixtureInterruptionExpression(mode,scenario,runId,initial) {
  validateFixtureInvocation(mode,scenario,runId);
  if (mode === 'cleanup' || scenario === 'overrun') throw Error('fixture_phase_rejected');
  return `(()=>{
    let clock,before;
    try {
      clock=globalThis.__patternlyNativeClockFixture;before=clock?.read();
      if(!before||before.protocol!=='patternly.native-clock-fixture.v1'||before.stage!=='ready'||before.mode!==${JSON.stringify(mode)}
        ||before.scenario!==${JSON.stringify(scenario)}||before.runId!==${JSON.stringify(runId)}||before.encrypted!==true
        ||before.errorCategory!==null||before.cleanupVerified!==false||before.durableElapsedMs!==${initial.durableElapsedMs}
        ||before.elapsedMs!==before.durableElapsedMs||before.checkpointRevision!==${initial.checkpointRevision}
        ||before.metrics.checkpointCount!==0)throw Error('fixture_preflight_rejected');
    } catch {return {stage:'pre_effect_refused',category:'native_clock_preflight_rejected'};}
    const entered=clock.enter();const baselineElapsedMs=clock.elapsed();
    const marker={baselineElapsedMs,preElapsedMs:before.durableElapsedMs,preCheckpointRevision:before.checkpointRevision,
      enterCheckpointRevision:entered.checkpointRevision,enterCheckpointCount:clock.metrics().checkpointCount};
    console.info(${JSON.stringify(`patternly.persist11.kill.${runId}`)},JSON.stringify(marker));
    const start=performance.now(),wallStart=Date.now();let iterations=0;
    while(performance.now()-start<12000&&Date.now()-wallStart<20000&&iterations<100000000)iterations++;
    const stopped=clock.pause();return {stage:'stall_completed_before_kill',clockStopped:stopped.running===false};
  })()`;
}
export async function runFixtureKillProbe({pid,binarySha256,mode,scenario,runId,killDelayMs}) {
  validateFixtureInvocation(mode,scenario,runId);
  if (mode === 'cleanup' || scenario === 'overrun' || (scenario === 'cap' && killDelayMs < 1_000)) throw Error('fixture_phase_rejected');
  const initial=await readNativeForegroundClockFixture(mode,scenario,runId);
  return runOwnedClockInterruption({pid,binarySha256,runId,initial,killDelayMs,
    expression:fixtureInterruptionExpression(mode,scenario,runId,initial),validate:validateMarker});
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const [pid,binarySha256,mode,scenario,runId,offset,...extra]=process.argv.slice(2);
  if(extra.length||offset===undefined) {console.error(JSON.stringify({stage:'error',category:'arguments_rejected'}));process.exitCode=1;}
  else runFixtureKillProbe({pid:Number(pid),binarySha256,mode,scenario,runId,killDelayMs:Number(offset)})
    .then(value=>console.log(JSON.stringify(value))).catch(()=>{console.error(JSON.stringify({stage:'error',category:'fixture_kill_probe_failed'}));process.exitCode=1;});
}
