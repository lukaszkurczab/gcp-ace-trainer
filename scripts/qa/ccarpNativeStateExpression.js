(async()=>{
 const entries=Array.from(__r.getModules().entries());const load=path=>{const found=entries.filter(([,m])=>m.isInitialized&&m.verboseName.endsWith(path));if(found.length!==1)throw Error('module_unavailable:'+path);return __r(found[0][0]);};
 const identity=load('src/infrastructure/runtime/environmentIdentity.ts').readEnvironmentIdentity();if(identity.mode!=='smoke'||identity.apiOrigin!=='http://127.0.0.1:8080')throw Error('not_local_smoke');
 const hash=load('src/infrastructure/identity/sha256.ts').sha256Utf8;
 const actors=[];const hook=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
 for(const id of hook.renderers.keys())for(const root of hook.getFiberRoots(id)){const walk=f=>{if(!f)return;const v=f.memoizedProps?.value;if(v?.state&&typeof v.captureHomeResumeActorFence==='function')actors.push(v);walk(f.child);walk(f.sibling)};walk(root.current)}
 if(actors.length!==1||actors[0].state.kind!=='authenticated')throw Error('actor_not_authenticated');
 const actor=actors[0];if(!actor.state.user.email?.startsWith('ui-exam-ios-')||!actor.state.user.email.endsWith('@example.test'))throw Error('not_test_actor');
 const context=load('src/application/tracks/trackAdmissionContext.ts').productionTrackAdmissionContext;
 const client=load('src/infrastructure/storage/mmkvClient.ts');const lease=client.captureActiveProfileStorageLease();
 const expectedSessionId=__CCARP_EXPECTED_SESSION__;
 const session=load('src/storage/repositories/trainingSessionRepository.ts').readActiveTrainingSession(context);
 const draft=await load('src/storage/repositories/trainingSessionDraftRepository.ts').getActiveTrainingSessionDraft(context);
 if(!client.isActiveProfileStorageLeaseCurrent(lease))throw Error('profile_changed');
 const sessions=load('src/storage/repositories/trainingSessionRepository.ts').readTrainingSessions(context).value;
 const attempts=load('src/storage/repositories/trainingAttemptRepository.ts').readTrainingAttempts(context).value;
 const recorded=expectedSessionId?sessions.find(entry=>entry.id===expectedSessionId):null;
 const result=expectedSessionId?load('src/storage/repositories/trainingSessionResultRepository.ts').readTrainingSessionResult(expectedSessionId,context):null;
 const history=sessions.filter(entry=>entry.id!==expectedSessionId&&entry.id!==session?.id).map(entry=>({idSha256:hash(entry.id),sha256:hash(JSON.stringify(entry))}));
 const activeTrackId=load('src/storage/repositories/activeTrackRepository.ts').readActiveTrackId();
 return {activeTrackId,history,attemptCount:attempts.length,recordedSession:recorded?{id:recorded.id,status:recorded.status,orderSha256:hash(JSON.stringify(recorded.itemOrder)),optionsSha256:hash(JSON.stringify(recorded.optionOrderByOccurrence)),configuration:recorded.configurationSnapshot}:null,result:result?{total:result.totalOccurrences,answered:result.answeredOccurrenceIds,unanswered:result.unansweredOccurrenceIds,details:result.evidence.details}:null,schema:'ccarp-native-session-evidence-v1',mode:identity.mode,actorSha256:hash(actor.state.user.uid),profileSha256:hash(lease.profile.id),session:session?{id:session.id,idSha256:hash(session.id),track:session.trackId,mode:session.modeId,cursor:session.currentItemIndex,count:session.actualLength,contentVersion:session.contentVersion,artifactSha256:session.artifactSha256,orderSha256:hash(JSON.stringify(session.itemOrder)),optionsSha256:hash(JSON.stringify(session.optionOrderByOccurrence)),configuration:session.configurationSnapshot,occurrences:session.itemOrder.map(entry=>({occurrenceId:entry.occurrenceId,questionId:entry.item.questionId}))}:null,draft:draft?{revision:draft.revision,responses:draft.responsesByOccurrenceId,flags:draft.flaggedOccurrenceIds,responseSha256:hash(JSON.stringify(draft.responsesByOccurrenceId))}:null};
})()
