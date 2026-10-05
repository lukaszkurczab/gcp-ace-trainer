"""Bounded existing review geometry probe; exact simulator restore."""
import subprocess,json
from pathlib import Path
p=Path(__file__).resolve().parent;d='7F315654-3175-4F3C-BB24-B0263F59360C'
def ui(k,v=None):return subprocess.check_output(['xcrun','simctl','ui',d,k]+([v] if v else []),text=True).strip()
a={k:ui(k) for k in ['appearance','content_size']};assert a=={'appearance':'dark','content_size':'large'}
r={'initial':a,'purpose':'Final repair ordinary Large same completed review; no answers/track/account/reminder/service changes'}
try:
 with (p/'REPAIR-ORDINARY-NATIVE.log').open('w') as f:
  r['exitCode']=subprocess.run(['maestro','--device',d,'test','--no-reinstall-driver','--test-output-dir','/private/tmp/bizq28-repair-ordinary',str(p/'repair-ordinary-large.yaml')],stdout=f,stderr=subprocess.STDOUT).returncode
finally:
 for k,v in a.items():ui(k,v)
 r['restored']={k:ui(k) for k in a};r['restoreVerified']=r['restored']==a
 (p/'REPAIR-ORDINARY-NATIVE.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r))
