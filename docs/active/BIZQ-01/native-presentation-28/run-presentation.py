"""Bounded existing-session capture, exact simulator appearance/text-size restore."""
from pathlib import Path
import subprocess, json
packet = Path(__file__).resolve().parent
app = packet.parents[3]
device = '7F315654-3175-4F3C-BB24-B0263F59360C'
def ui(option, value=None):
    args = ['xcrun', 'simctl', 'ui', device, option]
    if value is not None: args.append(value)
    return subprocess.check_output(args, text=True).strip()
initial = {key: ui(key) for key in ['appearance','content_size']}
assert initial == {'appearance':'dark','content_size':'large'}, 'Unexpected initial state; inspect before proceeding'
record = {'device':device, 'initial':initial, 'runs':[], 'limits':'Existing completed GCP review, supported app font cap; no nativepartial/longrepairedoptions/Premium/VO/persistence claim'}
try:
    for theme in ['light','dark']:
        ui('appearance',theme); ui('content_size','accessibility-extra-extra-extra-large')
        observed = {key:ui(key) for key in initial}
        assert observed == {'appearance':theme,'content_size':'accessibility-extra-extra-extra-large'}
        output = Path('/private/tmp/bizq28-native') / theme; output.mkdir(parents=True,exist_ok=True)
        cmd = ['maestro','--device',device,'test','--no-reinstall-driver','--debug-output',str(output/'debug'),'--test-output-dir',str(output/'artifacts'),str(packet/('presentation-'+theme+'.yaml'))]
        with (packet/('ROOT-NATIVE-'+theme.upper()+'.log')).open('w') as log:
            result = subprocess.run(cmd, cwd=app, stdout=log, stderr=subprocess.STDOUT)
        record['runs'].append({'theme':theme,'observed':observed,'command':cmd,'exitCode':result.returncode})
        print(theme,result.returncode,flush=True)
        if result.returncode: break
finally:
    for key,value in initial.items(): ui(key,value)
    record['restored'] = {key:ui(key) for key in initial}
    record['restoreVerified'] = record['restored']==initial
    (packet/'ROOT-NATIVE-RUNS.json').write_text(json.dumps(record,indent=2)+'\n')
    print('RESTORE',record['restored'],flush=True)
