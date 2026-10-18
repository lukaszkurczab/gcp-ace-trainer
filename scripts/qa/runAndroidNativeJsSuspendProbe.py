#!/usr/bin/env python3
"""Run once: CONFIG.json OUTPUT-CLIENT.log. See androidNativeJsSuspendProbe.py.

Additional config: serverPath (owned executable in app files), port (unused host
and device port), lldb (host LLDB executable). Refuses an existing host forward.
Uses a 30s client bound and independent birth-guarded SIGCONT after every exit.
No relaunch/retry: inspect interruption.json before normal cold recovery.
After manual foreground UI/source review: --review-cold CONFIG COLD REFERENCE.
REFERENCE is the same session's earlier cold identity receipt, not a time anchor.
"""
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time


def review_cold(config_path, cold_path, reference_path):
    config = json.loads(Path(config_path).read_text())
    output = Path(config['output'])
    interruption = json.loads((output / 'interruption.json').read_text())
    cold = json.loads(Path(cold_path).read_text())
    reference = json.loads(Path(reference_path).read_text())
    scope = ['runId', 'profileSha256', 'sessionSha256', 'configurationSha256', 'startedAt', 'timerKind']
    assert all(cold[key] == reference[key] for key in scope), 'cold_scope_changed'
    assert cold['stage'] == 'cold_before_sync' and cold['running'] and cold['timerKind'] == 'elapsedForeground'
    assert interruption['stage'] == 'death_confirmed_storage_equal' and not interruption['watchdogFired']
    assert interruption['beforeHashes'] and interruption['beforeHashes'] == interruption['afterDeathHashes']
    assert interruption['pid'] == config['pid'] and interruption['birth'] == config['birth']
    # D is constant in the byte-identical backing files. The frozen JS owner
    # projects P >= D; cold reads R = D before creating a segment/writing T.
    # Thus expected P+H minus R >= H. This is not an upper-bound measurement.
    lower = interruption['holdLowerMs'] - 1
    assert lower > 5000, 'lower_bound_does_not_demonstrate_failure'
    result = {'verdict': 'FAIL', 'scope': 'count-up; selective JS suspension / API33 user-stop / cold recovery',
              'lossLowerMs': lower, 'flooringAllowanceMs': 1, 'recoveredElapsedMs': cold['durableElapsedMs'],
              'scopeMatches': scope, 'mmkvBackingFilesEqual': True,
              'limitations': ['foreground endpoint gates plus manually reviewed active UI; no continuous sampling',
                              'no upper bound, countdown, checkpoint matrix or full data preservation acceptance']}
    (output / 'result.json').write_text(json.dumps(result, indent=2))
    print(json.dumps(result))


def main():
    config_path = Path(sys.argv[1]).resolve()
    config = json.loads(config_path.read_text())  # Must succeed BEFORE attach.
    log_path = Path(sys.argv[2]).resolve()
    assert not log_path.exists() and not Path(config['output']).exists()
    assert isinstance(config['pid'], int) and config['pid'] > 1
    assert re.fullmatch(r'\d+', config['birth'])
    assert re.fullmatch(r'0x[0-9a-f]+', config['verifiedIdlePc'])
    assert re.fullmatch(r'files/android-clock-probe-[0-9a-f-]{36}', config['receiptDirectory'])
    assert config['serverPath'] == config['receiptDirectory'] + '/lldb-server'
    assert isinstance(config['port'], int) and 1024 < config['port'] < 65536
    adb = [config['adb'], '-s', config['serial']]
    private = adb + ['shell', 'run-as', 'com.lkurczab.patternly']

    def call(args, check=True):
        return subprocess.run(args, capture_output=True, check=check, timeout=5)

    def same_process():
        stat = call(private + ['cat', f"/proc/{config['pid']}/stat"], check=False)
        value = stat.stdout.decode()
        return stat.returncode == 0 and value[value.rfind(')') + 2:].split()[19] == config['birth']

    assert same_process(), 'original_process_changed'
    assert call(private + ['cat', f"/proc/{config['pid']}/cmdline"]).stdout.rstrip(b'\0\n') == b'com.lkurczab.patternly'
    port = 'tcp:' + str(config['port'])
    assert all(port not in line.split()[1:2] for line in call(adb + ['forward', '--list']).stdout.decode().splitlines())
    server = None
    with log_path.open('xb') as log:
        call(adb + ['forward', '--no-rebind', port, port])
        try:
            server = subprocess.Popen(private + [config['serverPath'], 'gdbserver', f"127.0.0.1:{config['port']}", '--attach', str(config['pid'])], stdout=log, stderr=log)
            time.sleep(0.5)
            assert server.poll() is None, 'server_exited'
            env = dict(os.environ, PATTERNLY_NATIVE_CLOCK_PROBE_CONFIG=str(config_path))
            module = Path(__file__).with_name('androidNativeJsSuspendProbe.py').resolve()
            client = [config['lldb'], '--no-lldbinit', '--batch',
                      '-o', 'platform select remote-android',
                      '-o', f"gdb-remote 127.0.0.1:{config['port']}",
                      '-o', 'process handle SIGSEGV --stop false --notify false --pass true',
                      '-o', f'command script import "{module}"',
                      '-o', 'script androidNativeJsSuspendProbe.run(lldb.debugger)']
            subprocess.run(client, stdout=log, stderr=log, env=env, timeout=30, check=True)
        finally:
            if server and server.poll() is None:
                server.terminate()
                try:
                    server.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    server.kill()
                    server.wait(timeout=3)
            # Works even when the LLDB module/config import failed after attach.
            try:
                if same_process():
                    call(private + ['kill', '-CONT', str(config['pid'])])
            finally:
                call(adb + ['forward', '--remove', port])


if __name__ == '__main__':
    if sys.argv[1:2] == ['--review-cold']:
        review_cold(*sys.argv[2:])
    else:
        main()
