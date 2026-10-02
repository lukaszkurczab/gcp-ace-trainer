Historical shared acceptance files referenced below are archived in Git at `74d8439c9801448c6b536d2f72eb4bd18811482d`; links resolve to that snapshot. Mobile ACK/resume was accepted locally; this does not accept the remaining SMTP scope or the full failure matrix. Earlier pending statements below describe their recording date.

# AUD-08-B4 consume post-commit response-loss QA — v5

**Scoped verdict: PASS WITH ISSUES.** The v5 consume response-loss test covers one committed public consume POST, loss of that response and its first status response, same-operation status recovery, SDK identity restoration, one committed consume ACK whose response is lost, and terminal-status cleanup. This is not whole-B4 acceptance.

Reviewer: GPT-6 Luna, high. Read-only independent review; no emulator, service, simulator, or production source was changed or run by this reviewer.

## Acceptance evidence

- Consumer pin file [evidence/B3/CONSUMER-SOURCE-PINS-v5.json](https://github.com/lukaszkurczab/gcp-ace-trainer/blob/74d8439c9801448c6b536d2f72eb4bd18811482d/docs/active/AUD-08/evidence/B3/CONSUMER-SOURCE-PINS-v5.json): all 46 listed app source/config files matched. Producer pin file [evidence/B3/CURRENT-PRODUCER-PINS.json](https://github.com/lukaszkurczab/gcp-ace-trainer/blob/74d8439c9801448c6b536d2f72eb4bd18811482d/docs/active/AUD-08/evidence/B3/CURRENT-PRODUCER-PINS.json): all 27 listed backend files matched. The test file hash matches the v5 consumer pin.
- Recorded required gate [evidence/B3/HTTP-SDK-SOURCE-v5.log](https://github.com/lukaszkurczab/gcp-ace-trainer/blob/74d8439c9801448c6b536d2f72eb4bd18811482d/docs/active/AUD-08/evidence/B3/HTTP-SDK-SOURCE-v5.log), SHA-256 `52e4dd386ac7b87382f200ee62ddff41ab27cd2d06a5c88937595a1a3213b45f`: 1 test pass, 0 failures, 0 skips. The log shows isolated Auth/Firestore emulator shutdown. The reviewer verified the log hash and source pins but did not rerun the gate.
- In `scripts/recoveryOperationIntegration.emulator.test.ts`, the consume transport first checks that the operation ID and proof are already in the memory vault. It awaits the real local HTTP response, then queries Firestore for `result_available`, expected generation 1, resulting/user generation 2, encrypted result, security-operation owner, and consumed-code index before throwing the simulated response-loss error.
- The first automatic public status fallback also awaits an actual successful HTTP response, checks its operation ID and result status, then throws before adapter delivery. The assertions require the original coordinator to remain signed out with pending state, the same proof in the vault, one consume POST, and persisted backend result/generation/index state.
- A new coordinator over the same memory vault loads and reconciles by the same operation ID and proof. The real Firebase SDK signs into the matching UID; a forced token read checks authorization generation 2. Wrong UID and missing-generation checks make no HTTP requests. The consume segment asserts no session-exchange or `/me` requests and no second consume POST.
- The preexisting ACK failure is explicitly before send: it increments the attempted-request counter but not the actual-request counter. The later ACK awaits a successful real HTTP response, checks acknowledged status, generation 2, cleared security-operation slot, and deleted encrypted result before throwing. The final status GET proves acknowledged state; assertions require one actual ACK commit, two ACK attempts total, retained used-index state, and local vault removal.
- Assertions inside the transport wrapper cannot alone make the gate green: the loss flags and recorded response-loss arrays are checked after coordinator completion, and final assertions independently read backend operation, user, result, code-index and vault state. A failing commit assertion leaves the corresponding flag/count expectation unsatisfied.

## Limits

The network path reaches the local Fastify/backend and Firestore/Auth emulators. App Check and SecureStore are fixtures, and the “cold” coordinator is reconstructed in the same process over an in-memory vault. This does not prove native SecureStore durability, process-death recovery, production App Check, or provider behavior. The broader B4 cases identified in `B4-REPORT.md` remain open, including persistence-write failure after commit, replacement replay, and deletion/revoke interaction. The test and reports also do not settle the pending account-identity policy.

## Reviewer verification

Read-only inspection of the test and v5 evidence; SHA-256 check of the gate log; local SHA-256 comparison of all 46 app and 27 backend pin entries. No tests, services, emulator processes, or devices were run by this reviewer.
