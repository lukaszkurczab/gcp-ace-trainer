import assert from "node:assert/strict";
import test from "node:test";
import { TrainingLifecycleUseCases } from "./TrainingLifecycleUseCases";
import { TrainingApplicationFailure, type TrainingLifecyclePorts } from "./contracts";
import { getTrackRegistration } from "../../domain";

const trackId = "claude-certified-architect-professional-certification";
// Routing-only probe: real retained-artifact admission is covered separately by
// singleCase.integration.test.ts. Resolution deliberately stops before any write.
test("Claude due routing breaks due-time ties by ID and leaves manual/other modes and tracks on discovery", async () => {
  const reviews = [
    {id:"z",trackId,status:"active",dueAt:"2026-10-12T12:00:00.000Z",sourceItem:{trackId,contentVersion:"z-pin",artifactSha256:"a".repeat(64)}},
    {id:"a",trackId,status:"active",dueAt:"2026-10-12T12:00:00.000Z",sourceItem:{trackId,contentVersion:"a-pin",artifactSha256:"b".repeat(64)}},
    {id:"completed",trackId,status:"completed",dueAt:"2026-10-01T12:00:00.000Z",sourceItem:{trackId,contentVersion:"completed-pin",artifactSha256:"c".repeat(64)}},
  ];
  for (const input of [
    {modeId:"certification-weak-area-review",request:{},exact:true},
    {modeId:"certification-quick-review",request:{reviewSource:"due_queue"},exact:true},
    {modeId:"certification-quick-review",request:{},exact:true},
    {modeId:"certification-weak-area-review",request:{reviewSource:"manual_request"},exact:false},
    {modeId:"certification-focus-practice",request:{},exact:false},
    {trackId:"aws-certified-solutions-architect-associate",modeId:"certification-weak-area-review",request:{reviewSource:"due_queue"},exact:false},
  ]) {
    const calls: string[] = [];
    const stop = new Error("routing-probe-stop");
    const ports = {
      clock:{now:() => "2026-10-13T12:00:00.000Z"}, sessionIds:{async create(){return "routing-probe";}},tracks:{getTrackRegistration},
      repositories:{async getActiveSession(){return null;},async getAttempts(){return [];},async getHistory(){return [];},async getReviews(){return reviews;}},
      packages:{async resolveForDiscovery(){calls.push("current");return {track:{trackId,getQuestion:()=>({})},runtime:{familyId:"certification"}};},async resolveExactArtifact(pin:{contentVersion:string}){calls.push(pin.contentVersion);throw stop;},async resolveForPreparation(){calls.push("discovery");throw stop;}},
    } as unknown as TrainingLifecyclePorts;
    await assert.rejects(new TrainingLifecycleUseCases(ports).startSession({trackId:input.trackId ?? trackId,modeId:input.modeId,request:input.request}));
    assert.deepEqual(calls,input.exact ? ["current", "a-pin"] : ["discovery"]);
  }
});

test("new due reviews exclude all removed IDs before exact routing and runtime preparation without changing history", async () => {
  for (const modeId of ["certification-weak-area-review", "certification-quick-review"]) {
    for (const allRemoved of [false, true]) {
      const identity = {trackId,contentVersion:"retained",artifactSha256:"a".repeat(64)};
      const reviews = [
        {id:"removed-oldest",trackId,status:"active",dueAt:"2026-10-10T12:00:00.000Z",sourceItem:{...identity,questionId:"removed"}},
        {id:"surviving",trackId,status:"active",dueAt:"2026-10-11T12:00:00.000Z",sourceItem:{...identity,questionId:"surviving"}},
        {id:"removed-same-pin",trackId,status:"active",dueAt:"2026-10-12T12:00:00.000Z",sourceItem:{...identity,questionId:"removed-too"}},
      ];
      const before = structuredClone(reviews);
      const calls: string[] = [];
      const ports = {
        clock:{now:()=>"2026-10-13T12:00:00.000Z"},sessionIds:{async create(){return "review-routing";}},tracks:{getTrackRegistration},
        repositories:{async getActiveSession(){return null;},async getAttempts(){return [];},async getHistory(){return [];},async getReviews(){return reviews;}},
        packages:{
          async resolveForDiscovery(){return {track:{trackId,getQuestion:(id:string)=>!allRemoved && id === "surviving" ? {} : undefined},runtime:{familyId:"certification"}};},
          async resolveExactArtifact(pin:unknown){assert.deepEqual(pin,reviews[1]!.sourceItem);calls.push("exact");return resolution;},
          async resolveForPreparation(){calls.push("current");return resolution;},
        },
        mutations:{async start(){assert.fail("an unavailable preparation must not write");}},
      } as unknown as TrainingLifecyclePorts;
      const resolution = {track:identity,runtime:{familyId:"certification",async prepare(input:{reviews:unknown[]}){
        assert.deepEqual(input.reviews,allRemoved ? [] : [reviews[1]]);
        throw new Error("insufficient eligible content");
      }}};
      await assert.rejects(new TrainingLifecycleUseCases(ports).startSession({trackId,modeId,request:{reviewSource:"due_queue"}}),
        (error:unknown)=>error instanceof TrainingApplicationFailure && error.code === "unknown_mode");
      assert.deepEqual(calls,[allRemoved ? "current" : "exact"]);
      assert.deepEqual(reviews,before);
    }
  }
});

test("a failed current catalog lookup refuses a fresh due review before resolving retained content", async () => {
  const ports = {
    clock:{now:()=>"2026-10-13T12:00:00.000Z"},sessionIds:{async create(){return "review-routing";}},tracks:{getTrackRegistration},
    repositories:{async getActiveSession(){return null;},async getAttempts(){return [];},async getHistory(){return [];},async getReviews(){return [];}},
    packages:{async resolveForDiscovery(){throw new Error("current unavailable");},async resolveExactArtifact(){assert.fail("no retained fallback");},async resolveForPreparation(){assert.fail("no preparation after failed lookup");}},
  } as unknown as TrainingLifecyclePorts;
  await assert.rejects(new TrainingLifecycleUseCases(ports).startSession({trackId,modeId:"certification-weak-area-review",request:{}}),
    (error:unknown)=>error instanceof TrainingApplicationFailure && error.code === "missing_content");
});
