#!/usr/bin/env node
// Read-only capability inventory. This does not measure timer loss or kill an app.
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const APP = 'com.lkurczab.patternly';

export function inspectAndroidClockProbe({ adb = 'adb' } = {}) {
  const run = (args) => {
    const result = spawnSync(adb, args, { encoding: 'utf8', timeout: 10_000, maxBuffer: 4 * 1024 * 1024 });
    return { ok: !result.error && result.status === 0, output: `${result.stdout ?? ''}\n${result.stderr ?? ''}` };
  };
  const inventory = run(['devices']);
  if (!inventory.ok) throw Error('adb_inventory_unavailable');
  const connected = inventory.output.split('\n').map(line => line.match(/^(\S+)\s+device\s*$/u)?.[1]).filter(Boolean);
  if (connected.length !== 1) throw Error('exactly_one_authorized_device_required');
  const shell = (...args) => run(['-s', connected[0], 'shell', ...args]);
  const pkg = shell('dumpsys', 'package', APP);
  const flags = pkg.output.match(/^\s*pkgFlags=\[([^\]]*)\]/mu)?.[1];
  const versionCode = pkg.output.match(/\bversionCode=(\d+)/u)?.[1];
  const versionName = pkg.output.match(/\bversionName=(\S+)/u)?.[1];
  if (!pkg.ok || flags === undefined || !versionCode || !versionName) throw Error('installed_package_identity_unavailable');
  const runAs = shell('run-as', APP, 'id');
  const sockets = shell('cat', '/proc/net/unix');
  const debuggable = shell('getprop', 'ro.debuggable');
  const android = shell('getprop', 'ro.build.version.release');
  const sdk = shell('getprop', 'ro.build.version.sdk');
  const pid = shell('pidof', APP);
  const appSocketObserved = sockets.ok && sockets.output.split('\n').some(line =>
    line.includes(APP) && /inspector|devtools|hermes/iu.test(line));
  return {
    schema: 'patternly.android-clock-preflight.v1', observedAt: new Date().toISOString(),
    package: APP, versionCode: Number(versionCode), versionName,
    android: android.ok ? android.output.trim() : null,
    sdk: sdk.ok ? sdk.output.trim() : null,
    processRunning: pid.ok && /^\d+(?:\s+\d+)*$/u.test(pid.output.trim()),
    packageDebuggable: flags.split(/\s+/u).includes('DEBUGGABLE'),
    runAsAvailable: runAs.ok && /\buid=\d+/u.test(runAs.output),
    runAsRefusedNondebuggable: /package not debuggable/u.test(runAs.output),
    systemDebuggable: debuggable.ok ? debuggable.output.trim() === '1' : null,
    socketInventoryAvailable: sockets.ok, appInspectorSocketObserved: appSocketObserved,
    // A socket or debug flag alone does not establish a reachable, suitable marker.
    measurementPerformed: false, timerVerdict: 'UNVERIFIED',
    nextStep: 'Verify a deterministic JS-stall marker and cold T readback on an authorized instrumented main APK before any kill.',
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 0 && !(args.length === 2 && args[0] === '--adb' && args[1])) throw Error('arguments_invalid');
    console.log(JSON.stringify(inspectAndroidClockProbe({ adb: args[1] }), null, 2));
  } catch (error) {
    const safe = new Set(['adb_inventory_unavailable', 'exactly_one_authorized_device_required', 'installed_package_identity_unavailable', 'arguments_invalid']);
    console.error(JSON.stringify({ schema: 'patternly.android-clock-preflight.v1', error: safe.has(error.message) ? error.message : 'preflight_failed', measurementPerformed: false }));
    process.exitCode = 1;
  }
}
