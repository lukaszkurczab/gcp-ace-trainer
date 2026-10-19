#!/usr/bin/env python3
"""One real +/-1s Android wall-clock step during an ordinary deadline session.
Requires the private, same-signer diagnostic APK. Restores the prior clock mode
in finally, records only safe receipts, never modifies S/T/deadline or answers.
A killed host/ADB loss can prevent restoration: verify auto_time after interruption.
"""
import argparse
import datetime
import json
from pathlib import Path
import re
import subprocess
import time


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--adb', required=True)
    parser.add_argument('--run-id', required=True)
    parser.add_argument('--expected-apk-sha256', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--offset-ms', type=int, choices=[-1000, 1000], required=True)
    parser.add_argument('--resume-restored', action='store_true', help='Complete only the refused post-restoration read; never set the clock again')
    args = parser.parse_args()
    if not re.fullmatch(r'[a-f0-9-]{36}', args.run_id) or not re.fullmatch(r'[a-f0-9]{64}', args.expected_apk_sha256):
        raise RuntimeError('arguments_invalid')
    output = Path(args.output).resolve()
    if args.resume_restored:
        if not output.is_dir():
            raise RuntimeError('arguments_invalid')
    else:
        output.mkdir(mode=0o700, parents=True, exist_ok=False)
    receipt = {'requestedOffsetMs': args.offset_ms, 'scope': 'Actual wall step and immutable absolute deadline; separate full preservation review required'}

    def adb(*command):
        return subprocess.run([args.adb, *command], capture_output=True, text=True, check=True, timeout=15).stdout.strip()

    devices = re.findall(r'^(\S+)\s+device\s*$', adb('devices'), re.M)
    if len(devices) != 1:
        raise RuntimeError('single_device_required')

    def shell(*command):
        return adb('-s', devices[0], 'shell', *command)

    def sample():
        start = time.monotonic_ns()
        # One fixed remote command, not nested sh -c (ADB strips that quoting).
        rows = shell('date +%s%3N && cat /proc/uptime').splitlines()
        end = time.monotonic_ns()
        return {'wallMs': int(rows[0]), 'uptimeMs': round(float(rows[1].split()[0]) * 1000),
                'hostMidNs': (start + end) // 2, 'transportMs': (end - start) / 1e6}

    def projection(marker):
        if marker.get('runId') != args.run_id:
            raise RuntimeError('deadline_scope_rejected')
        account = marker.get('accountProbe', {})
        session = account.get('session')
        if marker.get('stage') != 'snapshot' or not session or session.get('timerKind') != 'absoluteDeadline' or account.get('timer') or account.get('pendingJournal'):
            raise RuntimeError('deadline_scope_rejected')
        rows = [row for row in account.get('deadlineSessions', []) if row['idSha256'] == session['idSha256']]
        if len(rows) != 1 or rows[0]['status'] != 'active' or rows[0]['modeId'] not in ['certification-exam-simulation', 'design-interview-simulation']:
            raise RuntimeError('deadline_scope_rejected')
        row = rows[0]
        if any(row[key] != session[key] for key in ['idSha256', 'status', 'startedAt', 'configurationSha256', 'timerKind', 'timerDeadlineAt']) or row['timerDurationMs'] != session['countdownMs']:
            raise RuntimeError('deadline_projection_mismatch')
        return session, row

    def inventory(label):
        command = ['node', str(Path(__file__).with_name('androidForegroundClockKillProbe.mjs')),
                   '--adb', args.adb, '--run-id', args.run_id, '--expected-apk-sha256', args.expected_apk_sha256,
                   '--mode', 'inventory', '--output', str(output / label)]
        # A VIEW can itself trigger identity refresh. One intent per label;
        # readiness waits inside that request, never by launching it again.
        result = subprocess.run(command, capture_output=True, text=True, timeout=90)
        if result.returncode != 0:
            raise RuntimeError('inventory_read_unavailable')
        case = json.loads(result.stdout.strip().splitlines()[-1])
        marker = json.loads((Path(case['output']) / 'marker.json').read_text())
        session, row = projection(marker)
        receipt[label + 'CaseId'] = case['caseId']
        return marker, session, row

    def clock_verdict(value):
        delivered = value['deliveredOffsetMs']
        return 'PASS' if (delivered * args.offset_ms > 0 and abs(delivered - args.offset_ms) < 250
            and abs(value['restoredOffsetMs']) < 250 and value['autoTimeAfter'] == value['autoTimeBefore'] == '1'
            and value['autoZoneAfter'] == value['autoZoneBefore']) else 'FAIL'

    if args.resume_restored:
        original = json.loads((output / 'clock.json').read_text())
        if original.get('requestedOffsetMs') != args.offset_ms or original.get('deadlineUnchangedDuringStep') is not True or clock_verdict(original) != 'PASS':
            raise RuntimeError('restoration_unverified')
        saved = []
        for label in ['before', 'during']:
            case_id = original[label + 'CaseId']
            if not re.fullmatch(r'[a-f0-9-]{36}', case_id):
                raise RuntimeError('arguments_invalid')
            folder = output / label / case_id
            for name in ['artifact-before.json', 'artifact-after.json']:
                if json.loads((folder / name).read_text())['apkSha256'] != args.expected_apk_sha256:
                    raise RuntimeError('artifact_identity_rejected')
            saved.append(projection(json.loads((folder / 'marker.json').read_text())))
        if saved[0] != saved[1] or shell('settings', 'get', 'global', 'auto_time') != '1' or shell('settings', 'get', 'global', 'auto_time_zone') != original['autoZoneBefore']:
            raise RuntimeError('restoration_unverified')
        current_marker, current_session, current_row = inventory('after-recovered')
        if (current_session, current_row) != saved[0]:
            raise RuntimeError('deadline_changed')
        receipt.update(verdict='PASS', clockMutationRepeated=False, originalReceipt='clock.json', deadlineUnchangedAfterRestoration=True)
        before_marker = json.loads((output / 'before' / original['beforeCaseId'] / 'marker.json').read_text())
        left = {row['key']: row['sha256'] for row in before_marker['inventory']}
        right = {row['key']: row['sha256'] for row in current_marker['inventory']}
        receipt['otherInventoryChanges'] = [key for key in sorted(left.keys() | right.keys()) if left.get(key) != right.get(key)]
        with (output / 'adjudication.json').open('x') as file:
            json.dump(receipt, file, indent=2)
        (output / 'adjudication.json').chmod(0o600)
        print(json.dumps({'stage': 'restored_read_completed', 'verdict': 'PASS', 'output': str(output), 'clockMutationRepeated': False}))
        return

    before, session, deadline_row = inventory('before')
    deadline_ms = datetime.datetime.fromisoformat(session['timerDeadlineAt'].replace('Z', '+00:00')).timestamp() * 1000
    initial = sample()
    if deadline_ms - initial['wallMs'] < 60_000:
        raise RuntimeError('deadline_too_close')
    auto = shell('settings', 'get', 'global', 'auto_time')
    zone = shell('settings', 'get', 'global', 'auto_time_zone')
    # This recipe has only been probed with network time enabled. Never assume
    # ownership of an existing manual clock configuration.
    if auto != '1' or zone not in ['0', '1']:
        raise RuntimeError('clock_mode_unverified')
    origin = None
    receipt.update(autoTimeBefore=auto, autoZoneBefore=zone)
    try:
        shell('settings', 'put', 'global', 'auto_time', '0')
        origin = sample()
        receipt['beforeClock'] = origin
        target = origin['wallMs'] + round((time.monotonic_ns() - origin['hostMidNs']) / 1e6) + args.offset_ms
        shell('cmd', 'alarm', 'set-time', str(target))
        changed = sample()
        receipt['changedClock'] = changed
        receipt['deliveredOffsetMs'] = changed['wallMs'] - origin['wallMs'] - (changed['uptimeMs'] - origin['uptimeMs'])
        during, during_session, during_row = inventory('during')
        if session != during_session or deadline_row != during_row:
            raise RuntimeError('deadline_changed')
        receipt['deadlineUnchangedDuringStep'] = True
    finally:
        try:
            if origin:
                shell('cmd', 'alarm', 'set-time', str(origin['wallMs'] + round((time.monotonic_ns() - origin['hostMidNs']) / 1e6)))
        finally:
            shell('settings', 'put', 'global', 'auto_time', auto)
            receipt['restoredClock'] = sample()
            receipt['autoTimeAfter'] = shell('settings', 'get', 'global', 'auto_time')
            receipt['autoZoneAfter'] = shell('settings', 'get', 'global', 'auto_time_zone')
            if origin:
                restored = receipt['restoredClock']
                receipt['restoredOffsetMs'] = restored['wallMs'] - origin['wallMs'] - (restored['uptimeMs'] - origin['uptimeMs'])
            (output / 'clock.json').write_text(json.dumps(receipt, indent=2))
            (output / 'clock.json').chmod(0o600)
    time.sleep(2)  # Let a <=1s Premium wall fence catch up before post-check.
    after, after_session, after_row = inventory('after')
    if session != after_session or deadline_row != after_row:
        raise RuntimeError('deadline_changed')
    keys = lambda marker: {row['key']: row['sha256'] for row in marker['inventory']}
    left, right = keys(before), keys(after)
    receipt['otherInventoryChanges'] = [key for key in sorted(left.keys() | right.keys()) if left.get(key) != right.get(key)]
    receipt['verdict'] = clock_verdict(receipt)
    receipt['deadlineUnchangedAfterRestoration'] = True
    (output / 'clock.json').write_text(json.dumps(receipt, indent=2))
    print(json.dumps({'stage': 'wall_step_completed', 'verdict': receipt['verdict'], 'output': str(output)}))


if __name__ == '__main__':
    try:
        main()
    except Exception as failure:
        known = {'arguments_invalid', 'single_device_required', 'deadline_scope_rejected', 'deadline_projection_mismatch',
                 'deadline_too_close', 'clock_mode_unverified', 'deadline_changed', 'inventory_read_unavailable', 'restoration_unverified', 'artifact_identity_rejected'}
        category = str(failure) if isinstance(failure, RuntimeError) and str(failure) in known else 'device_or_observer_operation_failed'
        print(json.dumps({'stage': 'wall_step_failed', 'category': category, 'nextAction': 'inspect_private_receipts_and_verify_auto_time'}))
        raise SystemExit(1)
