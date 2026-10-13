import assert from "node:assert/strict";
import test, {afterEach} from "node:test";
import {loadCanonicalRuntimeCatalog} from "../../content/canonical/runtimeCatalog";
import {installKeyValueStorageForTests,MemoryKeyValueStorage,setActiveProfileLeaseForTests} from "../../infrastructure/storage/mmkvClient";
import {initializeStorageMetadata} from "../../storage/repositories/storageMetadataRepository";
import {getActiveTrainingSession,getTrainingSessionResult,getTrainingSessions,provisionGuestInstallation} from "../../storage/repositories";
import {STORAGE_KEYS} from "../../storage/keys";
import {productionTrackAdmissionContext} from "../tracks/trackAdmissionContext";
import {contentPackageRuntimeOwner} from "../contentPackageRuntimeOwner";
import {composeTrainingLifecycleUseCases} from "./trainingLifecycleComposition";
import {bootstrapApplication} from "./applicationBootstrap";

afterEach(()=>installKeyValueStorageForTests(new MemoryKeyValueStorage()));
for (const family of ["certification","design_interview"] as const) {
  test(`${family} immutable absolute deadline survives backward/forward clock changes and fresh bootstrap expiry exactly once`,async()=>{
    const storage=new MemoryKeyValueStorage();installKeyValueStorageForTests(storage);
    setActiveProfileLeaseForTests({id:"00000000-0000-4000-8000-000000000051",kind:"guest",accountId:null});
    initializeStorageMetadata();await provisionGuestInstallation();
    let wallMs=Date.parse("2026-10-13T10:00:00.000Z");
    const wallClock={now:()=>new Date(wallMs).toISOString()};
    const compose=()=>composeTrainingLifecycleUseCases({wallClock,sessionIds:{async create(){return `persist11-deadline-${family}`;}},
      premiumSessionAdmission:{async authorize(){return "allowed";}}});
    const trackId=family==="certification"?"google-cloud-associate-cloud-engineer":"object-oriented-design-interview";
    const modeId=family==="certification"?"certification-exam-simulation":"design-interview-simulation";
    const track=(await loadCanonicalRuntimeCatalog()).getTrack(trackId);
    const profile=track.simulationProfiles?.find(p=>p.modeId===modeId);assert.ok(profile);
    const lifecycle=compose();await contentPackageRuntimeOwner.resolveForDiscovery(trackId,family);
    const started=await lifecycle.startSession({trackId,modeId,request:family==="certification"?{}:{scope:{simulationProfileId:profile.profileId}}});
    const session=started.session;assert.equal(session.configurationSnapshot.timer,"absoluteDeadline");
    const deadline=session.configurationSnapshot.timerDeadlineAt;assert.equal(typeof deadline,"string");
    assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER),undefined);
    const activeRaw=storage.snapshot();
    wallMs-=60_000;
    let restored=compose();
    const resumed=await restored.resumeActiveSession();
    assert.equal(resumed.configurationSnapshot.timerDeadlineAt,deadline);
    assert.equal(await restored.finalizeExpiredSimulationIfDue(),null);
    assert.deepEqual(storage.snapshot(),activeRaw,"clock rollback must not rewrite the immutable deadline or learning data");
    const bootstrap=()=>bootstrapApplication(()=>contentPackageRuntimeOwner.verifyBundledPackages(),async()=>{await restored.resumeActiveSession();},async()=>{restored=compose();});
    assert.deepEqual(await bootstrap(),{kind:"ready",activeSessionId:session.id});
    assert.equal((await getActiveTrainingSession(productionTrackAdmissionContext))?.configurationSnapshot.timerDeadlineAt,deadline);
    wallMs=Date.parse(deadline as string)+1;
    assert.deepEqual(await bootstrap(),{kind:"ready",activeSessionId:null});
    const result=await getTrainingSessionResult(session.id,productionTrackAdmissionContext);assert.ok(result);
    const completed=(await getTrainingSessions(productionTrackAdmissionContext)).value.filter(s=>s.id===session.id);
    assert.equal(completed.length,1);assert.equal(completed[0]?.status,"completed");
    assert.equal(completed[0]?.configurationSnapshot.timerDeadlineAt,deadline);
    assert.equal(completed[0]?.completedAt,wallClock.now());
    assert.equal(await getActiveTrainingSession(productionTrackAdmissionContext),null);
    assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER),undefined);
    const terminalRaw=storage.snapshot();
    wallMs=Date.parse(session.startedAt)-120_000;
    for(let launch=0;launch<2;launch++) {
      assert.deepEqual(await bootstrap(),{kind:"ready",activeSessionId:null});
      assert.deepEqual(storage.snapshot(),terminalRaw,"rollback/restart after expiry must not resurrect or refinalize the session");
      assert.deepEqual(await getTrainingSessionResult(session.id,productionTrackAdmissionContext),result);
    }
  });
}
