#!/usr/bin/env python3
"""Real stop -> natural absolute deadline -> cold -> repeat-cold acceptance.
No clock, session, answer or duration writes. Requires the private diagnostic APK.
Run stop, wait until the real deadline, then recover and repeat. No timed wakeup,
network/account mutation, reset, signing or install is performed by this tool.
"""
import argparse
import datetime
import json
import os
from pathlib import Path
import re
import subprocess
import time


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ['adb', 'run-id', 'expected-apk-sha256', 'output']:
        parser.add_argument('--' + name, required=True)
    parser.add_argument('--action', choices=['stop', 'recover', 'repeat'], required=True)
    parser.add_argument('--expected-occurrences', type=int, required=True, help='Count verified from the ordinary session UI/profile; no answers are entered by this recipe')
    parser.add_argument('--prior-adjudication', help='For repeat only: retained read-only proof after a later ordinary identity reproof')
    args = parser.parse_args()
    if not re.fullmatch(r'[a-f0-9-]{36}', args.run_id) or not re.fullmatch(r'[a-f0-9]{64}', args.expected_apk_sha256) or not 1 <= args.expected_occurrences <= 200:
        raise RuntimeError('arguments_invalid')
    os.umask(0o077)
    output = Path(args.output).resolve()
    output.mkdir(mode=0o700, parents=True, exist_ok=args.action != 'stop')
    app = 'com.lkurczab.patternly'
    relative = 'files/android-clock-probe-' + args.run_id

    def save(name, value):
        with (output / name).open('x') as file:
            json.dump(value, file, indent=2)

    def adb(*command, allow_failure=False):
        result = subprocess.run([args.adb, *command], capture_output=True, text=True, timeout=15)
        if not allow_failure and result.returncode:
            raise RuntimeError('adb_operation_failed')
        return result

    devices = re.findall(r'^(\S+)\s+device\s*$', adb('devices').stdout, re.M)
    if len(devices) != 1:
        raise RuntimeError('single_device_required')

    def shell(*command, allow_failure=False):
        return adb('-s', devices[0], 'shell', *command, allow_failure=allow_failure).stdout.strip()

    def process():
        pid = shell('pidof', app, allow_failure=True)
        if not re.fullmatch(r'\d+', pid):
            raise RuntimeError('process_identity_rejected')
        if shell('run-as', app, 'cat', '/proc/' + pid + '/cmdline').replace('\0', '') != app:
            raise RuntimeError('process_identity_rejected')
        raw = shell('run-as', app, 'cat', '/proc/' + pid + '/stat')
        birth = raw[raw.rfind(')') + 2:].split()[19]
        if not birth.isdecimal():
            raise RuntimeError('process_identity_rejected')
        return {'pid': pid, 'birth': birth}

    def artifact():
        path = shell('pm', 'path', app)
        if not re.fullmatch(r'package:/data/app/[A-Za-z0-9_=/+.~-]+/base\.apk', path):
            raise RuntimeError('artifact_identity_rejected')
        digest = shell('sha256sum', path[8:]).split()[0]
        if digest != args.expected_apk_sha256:
            raise RuntimeError('artifact_identity_rejected')
        return digest

    def stop():
        identity = process()
        shell('cmd', 'activity', 'stop-app', app)
        for _ in range(30):
            if not shell('pidof', app, allow_failure=True):
                return identity
            time.sleep(0.1)
        raise RuntimeError('process_death_unconfirmed')

    def inventory(label):
        result = subprocess.run(['node', str(Path(__file__).with_name('androidForegroundClockKillProbe.mjs')),
            '--adb', args.adb, '--run-id', args.run_id, '--expected-apk-sha256', args.expected_apk_sha256,
            '--mode', 'inventory', '--output', str(output / label)], capture_output=True, text=True, timeout=90)
        if result.returncode != 0:
            raise RuntimeError('inventory_read_unavailable')
        case = json.loads(result.stdout.strip().splitlines()[-1])
        marker = json.loads((Path(case['output']) / 'marker.json').read_text())
        if marker.get('stage') != 'snapshot' or marker.get('runId') != args.run_id:
            raise RuntimeError('inventory_scope_rejected')
        return marker, case['caseId']

    def account_scope(account):
        profile, binding = account['profile'], account['binding']
        if profile['kind'] != 'account' or binding['kind'] != 'verified' or profile['accountSha256'] != binding['accountSha256']:
            raise RuntimeError('account_scope_rejected')
        return {'profileSha256': profile['idSha256'], 'accountSha256': profile['accountSha256'], 'uidSha256': binding['uidSha256']}

    artifact_before = artifact()
    if args.action == 'stop':
        marker, case_id = inventory('before-stop')
        a = marker['accountProbe']
        account_scope(a)
        session = a.get('session')
        if not session or session.get('timerKind') != 'absoluteDeadline' or a.get('timer') or a.get('pendingJournal'):
            raise RuntimeError('deadline_scope_rejected')
        rows = [row for row in a['deadlineSessions'] if row['idSha256'] == session['idSha256']]
        if len(rows) != 1 or rows[0]['status'] != 'active' or rows[0]['modeId'] not in ['certification-exam-simulation', 'design-interview-simulation'] or rows[0]['result'] is not None:
            raise RuntimeError('deadline_scope_rejected')
        row = rows[0]
        if any(row[k] != session[k] for k in ['idSha256', 'status', 'startedAt', 'configurationSha256', 'timerKind', 'timerDeadlineAt']) or row['timerDurationMs'] != session['countdownMs']:
            raise RuntimeError('deadline_scope_rejected')
        deadline = int(datetime.datetime.fromisoformat(row['timerDeadlineAt'].replace('Z', '+00:00')).timestamp() * 1000)
        wall = int(shell('date', '+%s%3N'))
        if wall >= deadline - 60_000:
            raise RuntimeError('deadline_too_close')
        identity = stop()
        save('interruption.json', {'runId': args.run_id, 'originalProcess': identity, 'deathConfirmed': True, 'deviceWallMsAtStop': wall,
             'deadlineMs': deadline, 'baseline': row, 'inventoryCaseId': case_id, 'apkSha256': artifact_before, 'expectedOccurrences': args.expected_occurrences})
        print(json.dumps({'stage': 'stopped_before_natural_deadline', 'deadline': row['timerDeadlineAt'], 'output': str(output)}))
        return

    interruption = json.loads((output / 'interruption.json').read_text())
    baseline = interruption['baseline']
    if interruption['runId'] != args.run_id or interruption['apkSha256'] != artifact_before or not interruption['deathConfirmed'] or interruption['expectedOccurrences'] != args.expected_occurrences:
        raise RuntimeError('deadline_scope_rejected')
    case_id = interruption['inventoryCaseId']
    if not re.fullmatch(r'[a-f0-9-]{36}', case_id):
        raise RuntimeError('deadline_scope_rejected')
    before = json.loads((output / 'before-stop' / case_id / 'marker.json').read_text())
    original_scope = account_scope(before['accountProbe'])
    if int(shell('date', '+%s%3N')) < interruption['deadlineMs'] + 1000:
        raise RuntimeError('natural_deadline_not_reached')
    if args.action == 'repeat':
        previous = json.loads((Path(args.prior_adjudication) if args.prior_adjudication else output / 'recovery.json').read_text())
        if previous['verdict'] != 'PASS' or previous['runId'] != args.run_id or previous['apkSha256'] != artifact_before or previous['verifiedIdentity'] != original_scope:
            raise RuntimeError('prior_recovery_unverified')
        if args.prior_adjudication and (previous.get('identityQualification') != {
            'firstColdBinding': 'invalidated', 'reproofBinding': 'verified', 'continuousVerifiedBinding': False, 'manualBindingWrite': False}
            or not previous.get('originalFailureRetained') or not previous.get('activeSessionTimerJournalAbsent') or not previous.get('activeDraftAbsent')):
            raise RuntimeError('prior_recovery_unverified')
        original = stop()
    else:
        if shell('pidof', app, allow_failure=True):
            raise RuntimeError('stopped_process_expected')
        original = interruption['originalProcess']
    shell('run-as', app, 'rm', '-f', relative + '/cold.json')
    shell('am', 'start', '-n', app + '/.MainActivity')
    cold = None
    for _ in range(180):
        raw = shell('run-as', app, 'cat', relative + '/cold.json', allow_failure=True)
        try:
            candidate = json.loads(raw)
            if candidate.get('runId') == args.run_id:
                cold = candidate
                break
        except ValueError:
            pass
        time.sleep(0.25)
    if cold is None:
        raise RuntimeError('cold_observation_missing')
    fresh = process()
    if fresh == original:
        raise RuntimeError('fresh_process_unverified')
    save(args.action + '-cold.json', cold)
    if args.action == 'recover':
        expected = {'stage': 'absolute_deadline_before_lifecycle', 'snapshotPhase': 'profile_ready_before_lifecycle',
            'sessionSha256': baseline['idSha256'], 'configurationSha256': baseline['configurationSha256'], 'startedAt': baseline['startedAt'],
            'profileSha256': original_scope['profileSha256'],
            'timerDeadlineAt': baseline['timerDeadlineAt'], 'timerDurationMs': baseline['timerDurationMs'], 'timerKind': 'absoluteDeadline'}
        if any(cold.get(key) != value for key, value in expected.items()) or cold.get('observedWallMs', 0) < interruption['deadlineMs']:
            raise RuntimeError('cold_deadline_mismatch')
    # The early receipt is deliberately before bootstrap. Let the ordinary
    # bootstrap settle without VIEW intents that reopen identity barriers.
    idle_start = time.monotonic()
    time.sleep(30)
    post_cold_idle_ms = round((time.monotonic() - idle_start) * 1000)
    marker, case_id = inventory(args.action + '-terminal')
    a = marker['accountProbe']
    if account_scope(a) != original_scope:
        raise RuntimeError('account_scope_rejected')
    rows = [row for row in a['deadlineSessions'] if row['idSha256'] == baseline['idSha256']]
    if len(rows) != 1 or a.get('session') or a.get('timer') or a.get('pendingJournal'):
        raise RuntimeError('terminal_scope_rejected')
    active_keys = {'patternly:canonical:v1:' + key for key in ['active-training-session', 'active-training-session-draft', 'active-foreground-timer', 'journal:active']}
    if any(entry['key'] in active_keys for entry in marker['inventory']):
        raise RuntimeError('terminal_scope_rejected')
    row = rows[0]
    if row['status'] != 'completed' or not row.get('result') or any(row[k] != baseline[k] for k in ['idSha256', 'modeId', 'startedAt', 'configurationSha256', 'timerKind', 'timerDeadlineAt', 'timerDurationMs']):
        raise RuntimeError('terminal_scope_rejected')
    if row['result']['totalOccurrences'] != args.expected_occurrences or row['result']['answeredCount'] != 0 or row['result']['unansweredCount'] != args.expected_occurrences:
        raise RuntimeError('result_counts_rejected')
    facts = {key: value for key, value in row.items() if key not in ['revision', 'digest']}
    if args.action == 'repeat' and facts != previous['terminalFacts']:
        raise RuntimeError('duplicate_or_changed_result')
    artifact_after = artifact()
    proof = {'verdict': 'PASS', 'scope': 'Natural absolute deadline, exact result and repeated cold idempotency; separate inventory preservation review',
        'runId': args.run_id, 'originalProcess': original, 'freshProcess': fresh, 'apkSha256': artifact_after, 'terminalCaseId': case_id,
        'verifiedIdentity': original_scope,
        'terminalFacts': facts, 'canonicalRevision': row['revision'], 'canonicalEnvelopeDigest': row['digest'], 'activeSessionTimerJournalAbsent': True,
        'activeDraftAbsent': True}
    proof['postColdObservationDelayMs'] = post_cold_idle_ms
    if args.action == 'repeat' and previous.get('identityQualification'):
        proof['identityQualification'] = previous['identityQualification']
    save('recovery.json' if args.action == 'recover' else 'repeat.json', proof)
    print(json.dumps({'stage': args.action + '_completed', 'verdict': 'PASS', 'output': str(output)}))


if __name__ == '__main__':
    try:
        main()
    except Exception as failure:
        known = {'arguments_invalid', 'adb_operation_failed', 'single_device_required', 'process_identity_rejected', 'artifact_identity_rejected',
            'process_death_unconfirmed', 'inventory_scope_rejected', 'inventory_read_unavailable', 'deadline_scope_rejected', 'deadline_too_close',
            'natural_deadline_not_reached', 'prior_recovery_unverified', 'stopped_process_expected', 'cold_observation_missing', 'fresh_process_unverified',
            'cold_deadline_mismatch', 'terminal_scope_rejected', 'duplicate_or_changed_result', 'result_counts_rejected', 'account_scope_rejected'}
        category = str(failure) if isinstance(failure, RuntimeError) and str(failure) in known else 'probe_operation_failed'
        print(json.dumps({'stage': 'deadline_recovery_failed', 'category': category}))
        raise SystemExit(1)
