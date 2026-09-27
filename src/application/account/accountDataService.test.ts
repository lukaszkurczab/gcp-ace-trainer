import assert from "node:assert/strict";
import test from "node:test";

import { accountDataRecordFingerprint } from "../../storage/repositories/accountDataRepository";
import { toGuestMergePartitionRecords } from "./accountDataService";
import { CODING_INTERVIEW_TRACK_ID, GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID } from "../../domain";

function activeTrack(trackId: string) {
  const record = { fingerprint: "", recordId: "current", recordType: "active_track" as const, state: { trackId }, trackId, version: 1 };
  return { ...record, fingerprint: accountDataRecordFingerprint(record) };
}

test("guest-merge materialization accepts its timestamp-free contract only when active track is unambiguous", () => {
  assert.equal(toGuestMergePartitionRecords([activeTrack(CODING_INTERVIEW_TRACK_ID)])[0]?.trackId, CODING_INTERVIEW_TRACK_ID);
  assert.throws(
    () => toGuestMergePartitionRecords([activeTrack(CODING_INTERVIEW_TRACK_ID), activeTrack(GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID)]),
    (error: unknown) => error instanceof Error && error.message === "account_data_track_invalid",
  );
});
