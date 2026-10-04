# Stage only the owned canonical queue row; preserve the working file and foreign appendix.
from pathlib import Path
import subprocess, difflib, hashlib, json
packet = Path(__file__).resolve().parent
app = packet.parents[3]
file = 'docs/PATTERNLY-WORKING-PLAN.md'
def git(*args):
    return subprocess.check_output(['git', *args], cwd=app, text=True)
head = git('show', 'HEAD:' + file)
index = git('show', ':' + file)
working = (app / file).read_text()
def row(text):
    rows = [line for line in text.splitlines(True) if line.startswith('| 19a ')]
    assert len(rows) == 1
    return rows[0]
assert index.replace(row(index), row(head)) == head, 'Foreign queue rows already staged; stop.'
wanted = head.replace(row(head), row(working))
patch = ''.join(difflib.unified_diff(index.splitlines(True), wanted.splitlines(True), fromfile='a/' + file, tofile='b/' + file, n=0))
if patch:
    subprocess.run(['git', 'apply', '--cached', '--unidiff-zero', '-'], cwd=app, input=patch, text=True, check=True)
assert git('show', ':' + file) == wanted
assert (app / file).read_text() == working
print(json.dumps({'result': 'PASS', 'scope': 'Own canonical queue row19a only; foreign appendix not staged', 'indexedTextSha256': hashlib.sha256(wanted.encode()).hexdigest(), 'workingBytesUnchanged': True}))
