Historical shared acceptance files referenced below are archived in Git at `74d8439c9801448c6b536d2f72eb4bd18811482d`; links resolve to that snapshot. Mobile ACK/resume was accepted locally; this does not accept the remaining SMTP scope or the full failure matrix. Earlier pending statements below describe their recording date.

# AUD-08-B4 post-commit vault-write-failure QA — v6b

**Scoped verdict: PASS WITH ISSUES.** The frozen integration test covers local vault write rejections after real backend ISSUE and consume commits, then reconciles each operation without issuing a second POST. This does not accept the full B4 matrix.

Reviewer: GPT-6 Luna, high. Read-only review. No source, service, emulator, or device was changed or run by this reviewer.

## Evidence

- Final source pin: [evidence/B3/CONSUMER-SOURCE-PINS-v6b.json](https://github.com/lukaszkurczab/gcp-ace-trainer/blob/74d8439c9801448c6b536d2f72eb4bd18811482d/docs/active/AUD-08/evidence/B3/CONSUMER-SOURCE-PINS-v6b.json); all 46 app files matched. [evidence/B3/CURRENT-PRODUCER-PINS.json](https://github.com/lukaszkurczab/gcp-ace-trainer/blob/74d8439c9801448c6b536d2f72eb4bd18811482d/docs/active/AUD-08/evidence/B3/CURRENT-PRODUCER-PINS.json); all 27 backend files matched. The recovery integration test is included in the consumer pins.
- Required gate: [evidence/B3/HTTP-SDK-SOURCE-v6b.log](https://github.com/lukaszkurczab/gcp-ace-trainer/blob/74d8439c9801448c6b536d2f72eb4bd18811482d/docs/active/AUD-08/evidence/B3/HTTP-SDK-SOURCE-v6b.log), SHA-256 `6b2815d9c39e8f6021bc9c43027bd1998587b6491e8a241da0eb41b057e0dffd`. The recorded result is 1 pass, 0 failures, 0 skips, with isolated Auth/Firestore emulators shut down cleanly. The reviewer verified the log hash and all source hashes but did not rerun the gate.
- The first v6 log predates a final assertion added to the test source and is stale for the final bytes. This review relies on the refreshed v6b pins and run only.

### ISSUE result write rejection

The fixture rejects a selected SecureStore write only for an ISSUE result record containing codes. The initial operation-ID record is therefore saved before the real HTTP POST; the wrapper verifies that same ID before sending. After the HTTP response, Firestore assertions verify the committed `result_available` reissue, encrypted result, account generation, and operation-slot owner. The selected local write then rejects without changing the previous serialized vault value.

The coordinator snapshot and retained record remain `in_progress`, with no codes and no saved intent. Assertions require no implicit status GET and no saved-ACK POST before recovery. A new coordinator over the same memory vault reads status for the same ID, persists the result, and recovers the codes without a second ISSUE POST. The subsequent saved ACK is tied to that same ID and removes the backend result and local vault entry. Authorization generation remains 3 throughout this reissue.

### Consume result-binding write rejection

The fixture rejects both selected result-binding writes: first after the real consume POST response, then after its automatic status GET. Before POST, the wrapper verifies the operation ID and proof are in the vault. Firestore checks after both rejections confirm the committed recovery operation at expected generation 2/resulting generation 3, the encrypted result, the updated account generation, the owned security slot, and the code index marked used.

The assertions require both writes to fail while preserving the same serialized operation-ID/proof record. The coordinator remains `in_progress` with no pinned UID/generation, and the Firebase SDK remains signed out; no ACK request occurs. A new coordinator resumes by status with the same proof. The binding is durably present before Firebase custom-token sign-in; captured sign-in evidence checks the exact UID and generation 3 and confirms the token was not persisted. One ACK then completes the operation, removes the encrypted result, and clears the vault.

Request counters distinguish transport attempts from responses received by the app. The storage-failure cases assert one consume POST and no retry POST; the ISSUE case asserts one committed POST followed by one status GET. The two earlier consume ACK attempts remain separately accounted for as one before-send fixture failure and one actual committed ACK. The suite checks room for seven added rate-limited requests against the current isolated bucket without resetting the bucket or changing its limit.

## Limits

This verifies real local HTTP/Fastify and Firestore/Auth emulator effects with an in-memory SecureStore fixture that rejects selected writes before replacing its value. It is not evidence about native SecureStore’s behavior when a platform write rejects after an ambiguous partial commit, process-death recovery, production App Check, or a mounted React provider. Existing terminal ACK behavior, App Check and other B4 policy/failure-matrix gaps remain outside this slice. It does not resolve pending account-identity policy.

## Reviewer verification

Read-only source/test/log inspection; local SHA-256 verification of all 46 consumer and 27 producer pins and the v6b gate log. No tests, emulators, services, or devices were run by this reviewer.
