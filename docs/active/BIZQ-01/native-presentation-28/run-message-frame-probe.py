"""Native frame read only; exact simulator restore. Full hierarchy remains private."""
from pathlib import Path
import subprocess,json
packet=Path(__file__).resolve().parent
app=packet.parents[3]
device='7F315654-3175-4F3C-BB24-B0263F59360C'
def ui(key,value=None):
    cmd=['xcrun','simctl','ui',device,key]+([] if value is None else [value])
    return subprocess.check_output(cmd,text=True).strip()
def flow(name):
    out=Path('/private/tmp/bizq28-frame')/name; out.mkdir(parents=True,exist_ok=True)
    cmd=['maestro','--device',device,'test','--no-reinstall-driver','--test-output-dir',str(out),str(packet/(name+'.yaml'))]
    with (packet/(name+'.log')).open('w') as f: return subprocess.run(cmd,cwd=app,stdout=f,stderr=subprocess.STDOUT).returncode
initial={k:ui(k) for k in ['appearance','content_size']}
assert initial=={'appearance':'dark','content_size':'large'}
r={'initial':initial,'device':device,'method':'Warm existingresult→samewrongreview→expandedDetails; no newanswers/session/track/account/config'}
def frames():
    raw=subprocess.check_output(['maestro','--device',device,'hierarchy'],text=True)
    Path('/private/tmp/bizq28-frame-hierarchy.json').write_text(raw)
    tree=json.loads(raw); hits=[]
    def walk(node,parent=None):
        attrs=node.get('attributes',{}); label=attrs.get('accessibilityText','')
        if label.startswith('This option selects at the billing account,') or label.startswith('organization-wide attachment scope.'):
            hits.append({'label':label,'bounds':attrs.get('bounds'),'parentBounds':(parent or {}).get('bounds')})
        for child in node.get('children',[]): walk(child,attrs)
    walk(tree); return hits
try:
    r['method']='Open same current GCP review D Details at original large, readnativeframes; grow same mountedmessage to max, readframes andscreenshot; return existingresult/exactrestore'
    r['baselineFlowExitCode']=flow('open-current-review-message')
    if r['baselineFlowExitCode']==0:
        r['baselineFrames']=frames()
        ui('content_size','accessibility-extra-extra-extra-large')
        r['observed']={k:ui(k) for k in initial}
        r['textFrames']=frames()
        r['frameReadSucceeded']=bool(r['textFrames'])
    r['returnExitCode']=flow('return-existing-result')
finally:
    for k,v in initial.items(): ui(k,v)
    r['restored']={k:ui(k) for k in initial}; r['restoreVerified']=r['restored']==initial
    (packet/'ROOT-MESSAGE-FRAME-PROBE.json').write_text(json.dumps(r,indent=2)+'\n')
    print(json.dumps({'flowExitCode':r.get('flowExitCode'),'frames':r.get('textFrames'),'restore':r['restored']}),flush=True)
