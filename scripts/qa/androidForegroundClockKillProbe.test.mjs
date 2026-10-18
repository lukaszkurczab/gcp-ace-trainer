import test from 'node:test';
import assert from 'node:assert/strict';
import { lossBounds, preservationChanges } from './androidForegroundClockKillProbe.mjs';
const identity = {runId:'synthetic',profileSha256:'a',sessionSha256:'b',configurationSha256:'c',startedAt:'start',timerKind:'elapsedForeground',running:true};
const marker = {...identity,stage:'stall_started',elapsedMs:100,durableElapsedMs:0};
const cold = {...identity,stage:'cold_before_sync',durableElapsedMs:0};
test('loss bounds include transport uncertainty and admit a failed JS-only baseline with no periodic checkpoint', () => {
  const result = lossBounds(marker,cold,{sendAt:0,markerAt:100,killAt:6600,deathAt:6700});
  assert.equal(result.lossLowerMs,6600);assert.equal(result.lossUpperMs,6801);assert.equal(result.verdict,'FAIL');
  assert.equal(lossBounds(marker,{...cold,durableElapsedMs:2000},{sendAt:0,markerAt:100,killAt:6600,deathAt:6700}).verdict,'PASS');
  assert.throws(()=>lossBounds(marker,{...cold,sessionSha256:'different'},{sendAt:0,markerAt:100,killAt:6600,deathAt:6700}),/scope_rejected/);
  assert.throws(()=>lossBounds(marker,{...cold,durableElapsedMs:100000},{sendAt:0,markerAt:100,killAt:6600,deathAt:6700}),/scope_rejected/);
});
test('countdown caps at duration and preserves pre-existing overrun', () => {
  const countdown = {...marker,timerKind:'countdownForeground',countdownMs:60000,elapsedMs:59500,durableElapsedMs:59500};
  const recovered = {...countdown,stage:'cold_before_sync',durableElapsedMs:60000,running:false};
  const times = {sendAt:0,markerAt:100,killAt:6600,deathAt:6700};
  assert.equal(lossBounds(countdown,recovered,times).lossUpperMs,0);
  assert.throws(()=>lossBounds(countdown,{...recovered,durableElapsedMs:60001},times),/scope_rejected/);
  const overrun = {...countdown,elapsedMs:61000,durableElapsedMs:61000,running:false};
  assert.equal(lossBounds(overrun,{...overrun,stage:'cold_before_sync'},times).lossUpperMs,0);
});
test('background intervals bound only active foreground time', () => {
  const times = {sendAt:0,markerAt:100,killAt:6600,deathAt:6700,
    background:{exitSendAt:400,backgroundConfirmedAt:500,foregroundSendAt:3500,foregroundConfirmedAt:3600}};
  const result = lossBounds(marker,{...cold,durableElapsedMs:3100},times);
  assert.equal(result.lossLowerMs,300);assert.equal(result.lossUpperMs,701);
  assert.throws(()=>lossBounds(marker,{...cold,durableElapsedMs:4000},times),/scope_rejected/);
});
test('preservation admits only timer and exact session content with elapsed excluded', () => {
  const before = [{key:'patternly:canonical:v1:active-foreground-timer',sha256:'a'}, {key:'session',sha256:'b',sessionContentSha256:'same'}, {key:'settings',sha256:'c'}];
  const after = [{key:before[0].key,sha256:'new'}, {key:'session',sha256:'new',sessionContentSha256:'same'}, {key:'settings',sha256:'changed'}];
  assert.deepEqual(preservationChanges(before,after).map(change=>change.category),['timer_checkpoint','session_elapsed_only','unexplained_change']);
  assert.equal(preservationChanges(before,after.slice(1))[0].category,'unexplained_change');
});
