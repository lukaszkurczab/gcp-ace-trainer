#!/usr/bin/env python3
"""Run the reviewed ordinary UI login with owned credentials kept out of argv."""
import argparse
import json
import os
from pathlib import Path
import subprocess

p = argparse.ArgumentParser()
p.add_argument('--flow', choices=['login-account.yaml', 'login-from-settings.yaml', 'login-from-form.yaml'], required=True)
p.add_argument('--output', required=True)
a = p.parse_args()
out = Path(a.output)
if not str(out).startswith('/private/tmp/bizq33-runtime/'):
    raise SystemExit('private_owned_output_required')
out.mkdir(mode=0o700, parents=True, exist_ok=False)
credentials = json.loads(Path('/private/tmp/bizq33-account.json').read_text())
env = os.environ.copy()
env.update(MAESTRO_BIZQ33_EMAIL=credentials['email'], MAESTRO_BIZQ33_PASSWORD=credentials['password'])
with (out / 'command.log').open('x') as log:
    os.chmod(out / 'command.log', 0o600)
    result = subprocess.run([
        'maestro', '--device', '7F315654-3175-4F3C-BB24-B0263F59360C', 'test',
        '--no-reinstall-driver', '--debug-output', str(out), '--test-output-dir', str(out),
        str(Path(__file__).parent / a.flow),
    ], env=env, stdout=log, stderr=subprocess.STDOUT)
print(json.dumps({'stage': 'ordinary_sign_in', 'exitCode': result.returncode, 'privateArtifacts': str(out)}))
raise SystemExit(result.returncode)
