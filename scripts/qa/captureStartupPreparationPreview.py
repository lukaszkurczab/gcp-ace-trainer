#!/usr/bin/env python3
"""Capture the closed startup preview matrix; never launches normal owners or domain actions.
Run only after native-probe-checkpoint PASS. Locale overrides affect app-domain NSUserDefaults;
callbacks alone are RAM-only. Cleanup is attempted in finally, including failed capture.
"""
import argparse, hashlib, json, plistlib, signal, subprocess, time
from pathlib import Path

SCENES = ['profile-loading','profile-unavailable','content-opening-storage','content-recovering-learning-state','content-verifying-content','content-resuming-session','content-blocking','active-unavailable','active-confirm','active-pending','active-error','account-restoring','profile-transition-materialized','profile-transition-retry','recovery-base','recovery-retry-limit','recovery-removing','recovery-error','recovery-success','ready-resume-denied','ready-resume-unavailable']
# Locale order comes from the canonical resolver through the approved frozen design, checked below.
NODE = '/opt/homebrew/opt/node@22/bin/node'

def validate_resume_record(record, candidate, output):
    fingerprint=record.get('candidateFingerprint')
    if fingerprint!=candidate['fingerprint']:
        rule=candidate.get('reuse_policy',{}).get(fingerprint)
        if not rule or record['scene'] in rule.get('excluded_scenes',[]): raise RuntimeError('capture_resume_candidate_requires_recapture')
        if any(record.get(key)!=rule[key] for key in ['locale','theme','text'] if key in rule): raise RuntimeError('capture_resume_unapproved_variant')
    for key in ['image','receipt','hierarchy']+(['footer','footer_hierarchy'] if 'footer' in record else [])+(['afterReceipt'] if 'afterReceipt' in record else [])+(['paintGuard'] if 'paintGuard' in record else []):
        path=output/record[key];path.resolve().relative_to(output.resolve())
        expected=record.get('sha256' if key=='image' else key+'_sha256')
        if not expected or not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest()!=expected:raise RuntimeError('capture_resume_artifact_drift:'+key)
    receipt=json.loads((output/record['receipt']).read_text())
    if receipt['receipt']['parameters']!={key:record[key] for key in ['scene','locale','theme']} or not receipt['receipt']['ready'] or receipt['forbiddenInitialized']:raise RuntimeError('capture_resume_receipt_binding_failed')
    json.loads((output/record['hierarchy']).read_text())

def expected_texts(scene, locale, root):
    common=json.loads((root/f'src/locales/{locale}/common.json').read_text())
    account=json.loads((root/f'src/locales/{locale}/account.json').read_text())
    plan=json.loads((root/f'src/locales/{locale}/learningPlan.json').read_text())
    if scene=='profile-unavailable': keys=['Profile storage unavailable','Local profile storage could not be prepared.','Try again']
    elif scene=='content-blocking': keys=['Application unavailable','Application bootstrap failed.','Try again']
    elif scene.startswith('active-'):
        keys=['Active session needs attention','The unavailable session could not be abandoned.' if scene=='active-error' else 'An active session uses content that is no longer available. Abandon it to keep its saved facts and start a new session.','Abandon unavailable session','Cancel' if scene in ['active-confirm','active-pending'] else 'Try again']
    elif scene.startswith('ready-resume-'):
        return [common['Session in progress'],common['Practice']+' · '+plan['Premium access required' if scene=='ready-resume-denied' else 'Premium access unavailable'],common['Resume session']]
    elif scene=='recovery-success': keys=['Unavailable data removed','The local data that couldn’t be opened has been removed. Account data saved in the cloud was not changed.','Continue']
    elif scene.startswith('recovery-'):
        keys=['Patternly','Data on this device can’t be opened','The key protecting local data is missing. Try again. If the key cannot be recovered, you can remove the unavailable data from this device.']
        # Brand is not a translation key.
        result=['Patternly'];keys=keys[1:]
        if scene in ['recovery-base','recovery-retry-limit']: keys+=['Removing unavailable data permanently deletes unsent sessions and Guest progress stored only on this device.','Remove unavailable data']
        if scene in ['recovery-base','recovery-removing']: keys+=['Try again']
        if scene=='recovery-retry-limit': keys+=['You’ve reached the retry limit. You can remove unavailable local data to continue.']
        if scene=='recovery-removing': keys+=['Removing unavailable data','Unsent sessions and guest progress are being removed. Account data saved in the cloud will remain.','Remove unavailable data','Keep Patternly open while this finishes.']
        if scene=='recovery-error': keys+=['Unavailable data removal could not be completed','Some local data may already have been removed. You can retry removal or return to the recovery options.','Hold to retry removal','Return']
        return result+[common[key] for key in keys]
    elif scene=='profile-transition-retry': return [common['Preparing Patternly'],account['profileTransitionRetry']]
    else: keys=['Preparing Patternly']
    return [common[key] for key in keys]

def content_fits_native_viewport(hierarchy, required, window, insets):
    import re
    labels={}
    def visit(node):
        if isinstance(node,dict):
            attributes=node.get('attributes',{});label=attributes.get('accessibilityText')
            if label:
                bounds=list(map(int,re.findall(r'-?\d+',attributes.get('bounds',''))))
                if len(bounds)==4:labels.setdefault(label,[]).append(bounds)
            for value in node.values():visit(value)
        elif isinstance(node,list):
            for value in node:visit(value)
    visit(hierarchy)
    bottom=window['height']-insets['bottom']
    return all(any(0<=left<right<=window['width'] and 0<=top<end<=bottom for left,top,right,end in labels.get(label,[])) for label in required)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--device',required=True);parser.add_argument('--output',required=True);parser.add_argument('--variant');parser.add_argument('--resume',action='store_true');parser.add_argument('--candidate',default='candidate-4-source.json');args=parser.parse_args()
    root=Path.cwd();out=Path(args.output).resolve();out.relative_to(root/'.agent/private');out.mkdir(parents=True,exist_ok=True)
    def run(command, timeout=90):
        start=time.perf_counter();result=subprocess.run(command,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True,timeout=timeout)
        operation='loading_paint_guard' if any(str(value).endswith('checkStartupLoadingPaint.mjs') for value in command) else 'hierarchy' if 'hierarchy' in command else 'screenshot' if 'screenshot' in command else 'footer_flow' if command[0]=='maestro' and 'test' in command else 'other'
        if operation!='other':
            with (run_out/'operation-timing.jsonl').open('a') as log: log.write(json.dumps({'operation':operation,'seconds':time.perf_counter()-start,'exit':result.returncode})+'\n')
        if result.returncode: raise RuntimeError('capture_stage_failed:'+operation)
        return result.stdout
    run_id=time.strftime('%Y%m%dT%H%M%S',time.gmtime());run_out=out/'capture-runs'/run_id;run_out.mkdir(parents=True,exist_ok=False)
    def save(name,value):
        target=(run_out if name.startswith('capture-controller-') else out)/name
        temporary=target.with_name(target.name+'.tmp');temporary.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n');temporary.replace(target)
        if name.startswith('capture-controller-'): (out/'capture-controller-latest.json').write_text(json.dumps({'run_id':run_id,'artifact':str(target.relative_to(out))})+'\n')
    def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
    def probe(action='read',*values): return json.loads(run([NODE,'scripts/qa/startupPreparationPreview.mjs',action,*values]))
    proof=json.loads((out/'native-probe-checkpoint.json').read_text());assert proof['verdict'].startswith('PASS')
    design=json.loads((out/'design-proposal.json').read_text());assert [x['scene'] for x in design['closed_preview_scenes']]==SCENES
    # Read the single canonical list rather than maintain a second product locale registry.
    import re
    locales=re.search(r'TARGET_LOCALES = \[(.*?)\]',(root/'src/preferences/localeResolver.ts').read_text()).group(1)
    locales=re.findall(r'"([a-z]{2})"',locales);assert len(locales)==7
    data=Path(run(['xcrun','simctl','get_app_container',args.device,'com.lkurczab.patternly','data']).strip())
    prefs=data/'Library/Preferences/com.lkurczab.patternly.plist'
    def keys():
        d=plistlib.loads(prefs.read_bytes());return {key:{'present':key in d,'value':d.get(key)} for key in ['AppleLanguages','AppleLocale']}
    def protected(): return {str(p.relative_to(data/'Documents')):sha(p) for p in (data/'Documents').rglob('*') if p.is_file()}
    before=keys();assert not any(x['present'] for x in before.values()),'presentation_baseline_must_be_absent'
    original=json.loads((out/'pre-native-baseline.json').read_text());assert protected()==original['files18']
    read=probe();assert read['i18n']=='en' and not read['forbiddenInitialized']
    save('capture-controller-before.json',{'keys':before,'protected':protected(),'appearance':run(['xcrun','simctl','ui',args.device,'appearance']).strip(),'content_size':run(['xcrun','simctl','ui',args.device,'content_size']).strip(),'i18n':read['i18n']})
    source_manifest=json.loads((out/args.candidate).read_text())
    assert all(sha(root/path)==digest for path,digest in source_manifest['sources'].items()),'capture_candidate_source_drift'
    records=json.loads((out/'matrix-preview-progress.json').read_text()) if args.resume else []
    completed={(x['scene'],x['locale'],x['theme'],x['text']) for x in records}
    for record in records: validate_resume_record(record,source_manifest,out)
    failure=None
    signal.signal(signal.SIGTERM,lambda *_:(_ for _ in ()).throw(KeyboardInterrupt()))
    try:
        for locale in locales:
            for theme in ['light','dark']:
                for text,size in [('standard','large'),('large','accessibility-extra-extra-extra-large')]:
                    variant=f'{locale}-{theme}-{text}'
                    if args.variant and variant!=args.variant:continue
                    run(['xcrun','simctl','ui',args.device,'appearance',theme]);run(['xcrun','simctl','ui',args.device,'content_size',size]);time.sleep(.4)
                    folder=out/'matrix-preview'/variant;folder.mkdir(parents=True,exist_ok=True)
                    for scene in SCENES:
                        if (out/'capture-stop-requested').exists():raise KeyboardInterrupt('requested_safe_frame_boundary')
                        if (scene,locale,theme,text) in completed:continue
                        probe('scene',scene,locale,theme);time.sleep(.65)
                        receipt=probe();expected={'scene':scene,'locale':locale,'theme':theme}
                        assert receipt['receipt']['ready'] and receipt['receipt']['parameters']==expected and receipt['i18n']==locale and receipt['nativeLanguages']==[locale] and receipt['nativeLocale']==locale and receipt['osAppearance']==theme and not receipt['forbiddenInitialized'],'capture_parameter_binding_failed'
                        scale=receipt['window']['fontScale'];assert (scale==1 if text=='standard' else scale>3),'capture_native_font_mismatch'
                        assert receipt['receipt']['actions']['remove']==0 and receipt['receipt']['actions']['continue']==0,'capture_unexpected_action'
                        base=folder/scene;(base.with_suffix('.json')).write_text(json.dumps(receipt,indent=2)+'\n')
                        hierarchy=run(['maestro','--device',args.device,'hierarchy','--no-reinstall-driver']);json.loads(hierarchy);(folder/(scene+'-hierarchy.json')).write_text(hierarchy)
                        # Snapshot after the native hierarchy read/idle, not during the initial host paint.
                        run(['xcrun','simctl','io',args.device,'screenshot',str(base.with_suffix('.png'))])
                        loading_scene=scene in ['profile-loading','content-opening-storage','content-recovering-learning-state','content-verifying-content','content-resuming-session','account-restoring','profile-transition-materialized','profile-transition-retry']
                        paint=None
                        if loading_scene:
                            paint=run([NODE,'--import','tsx','scripts/qa/checkStartupLoadingPaint.mjs',str(base.with_suffix('.png')),str(base.with_suffix('.json')),str(folder/(scene+'-hierarchy.json'))]);(folder/(scene+'-paint.json')).write_text(paint)
                        record={'candidateFingerprint':source_manifest['fingerprint'],'scene':scene,'locale':locale,'theme':theme,'text':text,'fontScale':scale,'image':str(base.with_suffix('.png').relative_to(out)),'sha256':sha(base.with_suffix('.png')),'receipt':str(base.with_suffix('.json').relative_to(out)),'hierarchy':str((folder/(scene+'-hierarchy.json')).relative_to(out))}
                        if paint is not None: record['paintGuard']=str((folder/(scene+'-paint.json')).relative_to(out));record['paintGuard_sha256']=sha(out/record['paintGuard'])
                        # Additional-footer decision only; native frames do not prove paint, occlusion or VO.
                        fits=receipt.get('safeArea') is not None and content_fits_native_viewport(json.loads(hierarchy),expected_texts(scene,locale,root),receipt['window'],receipt['safeArea'])
                        record['scrollDecision']='N/A additional footer: native-frame screen only; paint/safe-area/VO reviewed separately' if fits else 'required: expected text/action frame absent or outside viewport'
                        if not fits:
                            flow=folder/(scene+'-footer.yaml');flow.write_text('appId: com.lkurczab.patternly\n---\n'+''.join('- swipe:\n    start: "50%, 75%"\n    end: "50%, 25%"\n    duration: 300\n' for _ in range(4))+'- waitForAnimationToEnd:\n    timeout: 10000\n- takeScreenshot: '+scene+'-footer\n')
                            logs=folder/(scene+'-footer-logs');log=run(['maestro','--device',args.device,'test','--no-reinstall-driver',str(flow),'--test-output-dir',str(logs)],120);(folder/(scene+'-footer.log')).write_text(log)
                            images=list(logs.rglob(scene+'-footer.png'));assert len(images)==1,'capture_footer_missing'
                            record['footer']=str(images[0].relative_to(out));record['footer_sha256']=sha(images[0])
                            footer_hierarchy=run(['maestro','--device',args.device,'hierarchy','--no-reinstall-driver']);json.loads(footer_hierarchy);(folder/(scene+'-footer-hierarchy.json')).write_text(footer_hierarchy)
                        after=probe();assert after['receipt']['parameters']==expected and all(count==0 for action,count in after['receipt']['actions'].items() if action!='removing-presented'),'capture_unexpected_action_or_scene_change'
                        record['afterReceipt']=str((folder/(scene+'-after.json')).relative_to(out));(out/record['afterReceipt']).write_text(json.dumps(after,indent=2)+'\n');record['afterReceipt_sha256']=sha(out/record['afterReceipt'])
                        for key in ['receipt','hierarchy']:
                            record[key+'_sha256']=sha(out/record[key])
                        if 'footer' in record:
                            record['footer_hierarchy']=str((folder/(scene+'-footer-hierarchy.json')).relative_to(out));record['footer_hierarchy_sha256']=sha(out/record['footer_hierarchy'])
                        records.append(record);save('matrix-preview-progress.json',records)
                        print(f'captured {len(records)} {variant} {scene}',flush=True)
    except BaseException as error:
        failure=type(error).__name__+':'+str(error);save('capture-controller-failure.json',{'stage':failure});raise
    finally:
        cleanup={}
        try:
            cleanup['restore']=probe('restore');run(['xcrun','simctl','ui',args.device,'appearance','dark']);run(['xcrun','simctl','ui',args.device,'content_size','large'])
            for _ in range(200):
                if keys()==before:break
                time.sleep(.1)
            cleanup['keys']=keys();cleanup['keys_exact']=keys()==before;cleanup['protected_exact']=protected()==original['files18'];cleanup['images']=len(records);cleanup['failure']=failure
            save('capture-controller-cleanup.json',cleanup)
            assert cleanup['keys_exact'] and cleanup['protected_exact'],'capture_cleanup_mismatch'
        except BaseException as error:
            save('capture-controller-cleanup-failure.json',{'stage':type(error).__name__+':'+str(error)});raise
if __name__=='__main__':main()
