"""Bounded LLDB lower-bound failure probe; not a PASS/upper-bound measurement.

Import in an attached LLDB, then call run(lldb.debugger). Configuration is a
private JSON file named by PATTERNLY_NATIVE_CLOCK_PROBE_CONFIG. Calibrate the
idle PC against the actual device libc (__epoll_pwait) before arming. The app
must be foreground with an active count-up session. Never use a whole-process
SIGSTOP as a JavaScript suspension substitute. See canonical PERSIST-11 notes.

Config fields: adb (absolute executable), serial, pid (integer), birth (/proc
stat field 22), verifiedIdlePc (hex string), receiptDirectory (this run's app
files/android-clock-probe-UUID directory), output (new private directory).
Start the pinned device lldb-server gdbserver with --attach PID via run-as,
forward one owned port, and connect host LLDB using gdb-remote. Configure
`process handle SIGSEGV --stop false --notify false --pass true` for ART's
handled implicit null checks; real unhandled faults still terminate the app.
Import this file using `command script import`, then `script MODULE.run(lldb.debugger)`.
Bound the host client too (30s); on abort verify detach and the original main
thread is no longer stopped. Do not retry a kill after an ambiguous effect.

After a confirmed death, read/hash storage BEFORE starting the app (this tool
does so). Launch normally and preserve the cold-before-sync receipt privately.
The result remains AWAITING_COLD_SCOPE_REVIEW: only matching profile/session,
configuration/startedAt, elapsedForeground/running=true, foreground UI evidence
and equal backing-file hashes permit the hold lower bound to demonstrate FAIL.
This cannot establish an upper bound, countdown acceptance or full preservation.
Remove only owned probe files/port and restore the exact original signed APK
in place after receipt capture. No reset, reinstall or alternate durable clock.
"""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import threading
import time

import lldb


def run(debugger):
    process = debugger.GetSelectedTarget().GetProcess()
    config = None
    try:
        config = json.loads(Path(os.environ['PATTERNLY_NATIVE_CLOCK_PROBE_CONFIG']).read_text())
        _probe(debugger, process, config)
    finally:
        # LLDB attach is already an all-stop effect. Cover even config parsing,
        # thread discovery and identity failures, before arming any watchdog.
        if process.GetState() not in (lldb.eStateExited, lldb.eStateDetached, lldb.eStateInvalid):
            if process.GetState() == lldb.eStateRunning:
                process.Stop()
            until = time.monotonic() + 2
            while process.GetState() == lldb.eStateRunning and time.monotonic() < until:
                time.sleep(0.02)
            for thread in process:
                if thread.IsSuspended():
                    thread.Resume()
            process.Detach()
        if config:
            # Detach on this device can leave the original Linux group-stop.
            # Resume only the same process; never a reused PID.
            args = [config['adb'], '-s', config['serial'], 'shell', 'run-as', 'com.lkurczab.patternly']
            stat = subprocess.run(args + ['cat', f"/proc/{config['pid']}/stat"], capture_output=True, timeout=3)
            value = stat.stdout.decode()
            if stat.returncode == 0 and value[value.rfind(')') + 2:].split()[19] == config['birth']:
                subprocess.run(args + ['kill', '-CONT', str(config['pid'])], capture_output=True, timeout=3)


def _probe(debugger, process, config):
    output = Path(config['output'])
    output.mkdir(mode=0o700, parents=True, exist_ok=False)
    app = 'com.lkurczab.patternly'
    adb = [config['adb'], '-s', config['serial'], 'shell']

    def shell(*args, check=True):
        return subprocess.run(adb + list(args), capture_output=True, check=check, timeout=3).stdout

    def private(*args, check=True):
        return shell('run-as', app, *args, check=check)

    def identity(pid):
        name = private('cat', f'/proc/{pid}/cmdline').decode().strip('\0\n')
        stat = private('cat', f'/proc/{pid}/stat').decode()
        assert name == app, 'process_name_changed'
        return stat[stat.rfind(')') + 2:].split()[19]

    def state(pid, tid):
        value = private('cat', f'/proc/{pid}/task/{tid}/status').decode()
        return next(line.split(':', 1)[1].strip() for line in value.splitlines() if line.startswith('State:'))

    def foreground():
        value = shell('dumpsys', 'activity', 'activities').decode()
        return any(('mResumedActivity:' in line or 'topResumedActivity=' in line)
                   and app + '/.MainActivity' in line for line in value.splitlines())

    def hashes():
        files = private('find', 'files/mmkv', '-type', 'f').decode().splitlines()
        assert files and all(path.startswith('files/mmkv/') and '..' not in path for path in files), 'mmkv_paths_rejected'
        # Read bytes only, through the app UID. No MMKV handle or key is opened.
        return {path: hashlib.sha256(private('cat', path)).hexdigest() for path in sorted(files)}

    pid = process.GetProcessID()
    threads = [thread for thread in process if thread.GetName() == 'mqt_v_js']
    assert pid == config['pid'] and len(threads) == 1, 'attached_process_rejected'
    js = threads[0]
    js_tid = js.GetThreadID()  # SBThread becomes invalid while running.
    native_tids = [thread.GetThreadID() for thread in process if thread.GetName() == 'mqt_v_native']
    result = {'stage': 'attached', 'verdict': 'INCONCLUSIVE', 'pid': pid, 'jsTid': js_tid}
    birth = identity(pid)
    lock = threading.Lock()
    armed = False
    watchdog_fired = False

    def watchdog():
        nonlocal armed, watchdog_fired
        with lock:
            if armed:
                watchdog_fired = True
                armed = False
                # Abort marker only. The host bounds/detaches the debugger;
                # run-as SIGKILL is unavailable on the tested device.

    timer = threading.Timer(15, watchdog)
    try:
        assert birth == config['birth'] and native_tids, 'identity_or_native_thread_rejected'
        assert foreground(), 'not_foreground'
        pc = js.GetFrameAtIndex(0).GetPC()
        assert pc == int(config['verifiedIdlePc'], 16), 'js_not_verified_epoll_idle'
        assert js.Suspend(), 'selective_suspend_failed'
        debugger.SetAsync(True)
        error = process.Continue()
        assert error.Success(), 'continue_failed'
        time.sleep(0.5)

        def gates():
            assert process.GetState() == lldb.eStateRunning, 'process_not_running'
            assert state(pid, js_tid).startswith('t'), 'js_not_tracing_stopped'
            states = {str(tid): state(pid, tid) for tid in [pid] + native_tids}
            assert all(not value.startswith(('t', 'T', 'Z')) for value in states.values()), 'other_queue_stopped'
            assert foreground() and identity(pid) == birth, 'foreground_or_identity_changed'
            return states

        result['otherThreadStatesBefore'] = gates()
        before = hashes()
        result['beforeHashes'] = before
        private('rm', '-f', config['receiptDirectory'] + '/cold.json')
        with lock:
            armed = True
            timer.start()
        start = time.monotonic_ns()
        time.sleep(7)
        with lock:
            assert armed and not watchdog_fired, 'watchdog_fired'
            armed = False
        timer.cancel()
        result['otherThreadStatesAfter'] = gates()
        result['stage'] = 'post_hold_hashes'
        assert hashes() == before, 'storage_changed_during_hold'
        with lock:
            assert not watchdog_fired, 'watchdog_fired'
            result['stage'] = 'identity_before_kill'
            assert identity(pid) == birth, 'process_identity_changed_before_kill'
            kill_at = time.monotonic_ns()
            result['stage'] = 'system_stop_app_requested'
            result['killMechanism'] = 'cmd activity stop-app --user current'
            # Android 13's documented no-callback app stop. Unlike force-stop,
            # it preserves scheduled alarms/jobs. Scope is this app/current user.
            shell('cmd', 'activity', 'stop-app', '--user', 'current', app)
        deadline = time.monotonic() + 2
        while shell('pidof', app, check=False).strip():
            assert time.monotonic() < deadline, 'death_unconfirmed'
            time.sleep(0.025)
        result['afterDeathHashes'] = hashes()
        assert result['afterDeathHashes'] == before, 'storage_changed_before_death'
        result.update(stage='death_confirmed_storage_equal', holdLowerMs=(kill_at - start) // 1_000_000,
                      birth=birth, watchdogFired=watchdog_fired)
        assert result['holdLowerMs'] >= 6500, 'hold_too_short'
        # Cold receipt scope/running and UI evidence must be reviewed separately.
        result['verdict'] = 'AWAITING_COLD_SCOPE_REVIEW'
    except Exception as error:
        result['category'] = str(error) if isinstance(error, AssertionError) else type(error).__name__
        if isinstance(error, subprocess.CalledProcessError):
            result['failedOperation'] = error.cmd
            result['exitCode'] = error.returncode
        raise
    finally:
        with lock:
            armed = False
        timer.cancel()
        (output / 'interruption.json').write_text(json.dumps(result, indent=2))
        print(json.dumps({'stage': result['stage'], 'verdict': result['verdict'], 'holdLowerMs': result.get('holdLowerMs')}))
