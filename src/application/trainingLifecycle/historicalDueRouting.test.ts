import assert from "node:assert/strict";
import test from "node:test";
import { TrainingLifecycleUseCases } from "./TrainingLifecycleUseCases";
import type { TrainingLifecyclePorts } from "./contracts";
import { getTrackRegistration } from "../../domain";

const trackId = "claude-certified-architect-professional-certification";
// Routing-only probe: real retained-artifact admission is covered separately by
// singleCase.integration.test.ts. Resolution deliberately stops before any write.
test("Claude due routing breaks due-time ties by ID and leaves manual/other modes on discovery", async () => {
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
  ]) {
    const calls: string[] = [];
    const stop = new Error("routing-probe-stop");
    const ports = {
      clock:{now:() => "2026-10-13T12:00:00.000Z"}, sessionIds:{async create(){return "routing-probe";}},tracks:{getTrackRegistration},
      repositories:{async getActiveSession(){return null;},async getAttempts(){return [];},async getHistory(){return [];},async getReviews(){return reviews;}},
      packages:{async resolveExactArtifact(pin:{contentVersion:string}){calls.push(pin.contentVersion);throw stop;},async resolveForPreparation(){calls.push("discovery");throw stop;}},
    } as unknown as TrainingLifecyclePorts;
    await assert.rejects(new TrainingLifecycleUseCases(ports).startSession({trackId,modeId:input.modeId,request:input.request}));
    assert.deepEqual(calls,[input.exact ? "a-pin" : "discovery"]);
  }
});
