# AUD-08-B3 local native evidence tools

The v17 run is complete. Results and limitations are in `docs/active/AUD-08/B3-REPORT.md`, the v17 native evidence files, and independent QA. The consumed code/configuration must not be reused for another consume. Private inputs remain outside Git; these tools do not authorize another fixture effect, deployment, reset, commit or push.

## Boundary

The selected fact is process death after server consume commit but before delivery/SDK/status/ACK, followed by cold same-operation status, exact SDK UID/generation, ACK and cleanup without a second consume. Exact Hermes byte hashing is not required. Native v14 consume restart was after ACK; it is separate evidence.

Consumer v17 pins 55 files (53 unchanged from v15, panel and its test corrected); producer v12c pins 28 unchanged files. Historical static1589/0/4 and real HTTP/SDK4/0/0 cover their unchanged boundaries, with fresh51 UI/i18n/typecheck and actual native evidence. This is not full B2/B4 or release readiness.

## Safe reproduction sequence

Use only the existing iPhone 17. A private run directory must be owner mode700; JSON inputs/output mode600, regular, no symlink. Never put UID, email, passwords, codes, tokens or private logs in Git or command arguments. `$PRIVATE_ROOT`, `$BINDING_FILE` and `$SAVED_CODES_FILE` below denote private filesystem paths, not credentials. Do not reuse the completed v17 directory/config.

1. Verify current source pins, dependency/config applicability, local ports and the exact owned fixture. `restoreOwnedAuthFixture.mjs` targets only Auth19099/project `patternly-app-sandbox`; it creates the exact bound UID only when absent, otherwise verifies without update. It requires the prior explicit authorization for that fixture. It does not import/reset/list/delete accounts.
2. `ownedRecoveryEvidence.mjs prepare "$PRIVATE_ROOT" "$BINDING_FILE" "$SAVED_CODES_FILE"` verifies all source pins and exact local Firestore ownership/unused code/generation/slot/history/rate budget before writing private config/baseline. This bounded run uses saved code index1; after v17 it is spent and preparation must refuse it. Do not bypass that refusal.
3. Start the backend using its existing `dev:smoke` command and private secrets; start `nativeRecoveryProxy.mjs` with **absolute script path**, `--config "$PRIVATE_ROOT/config.private.json" --output "$PRIVATE_ROOT/proxy-state.private.json"`. Start `startNativeMetro.mjs http://127.0.0.1:18080` with Node22. Record only these owned backend/proxy/Metro PIDs in owner-only `processes.private.json`. Preserve shared services/data. The Metro launcher binds localhost through IPv4 without editing `.env.smoke.local`.
4. Open the existing development app on local Metro8081. `nativeUiStage.py navigate --private-root "$PRIVATE_ROOT"`, then `probe`, uses one known-absent public code and real App Check. It must return expired/invalid, display translated text without terminal wrong-account warning, and leave owned history/code untouched (`ownedRecoveryEvidence.mjs probe`). Each request consumes one rate unit; never reset the bucket. v17 needed two completed absent-code requests because the first exposed the repaired UI defect; the old zero-owned/unarmed proxy instance was archived before the second. A refused/uncertain request is not permission to resubmit.
5. Clear the completed synthetic terminal through `clear-probe-terminal`, reopen with `code-entry`, and `fill-owned`; `prepare-owned` combines these no-submit UI steps. Signal the exact recorded proxy PID with SIGUSR2 once, only after safe probe, no pending panel and zero owned/status/ACK counts. Do not signal an already armed or unidentified process.
6. Run the single canonical interruption helper:

   ```sh
   python3 scripts/aud08/interruptNativeConsume.py --private-root "$PRIVATE_ROOT"
   ```

   It submits once, waits through upstream processing, kills the app immediately on validated held response, then requires client-close-before-delivery, no status/ACK, no hold timeout and actual app absence. Failure stops the app and preserves uncertainty; **never repeat owned consume**. The proxy bounds the held response to120s and blocks a second owned request. A synthetic test does not prove this native boundary.
7. Before cold launch, `ownedRecoveryEvidence.mjs held "$PRIVATE_ROOT"` must establish exactly one new owned result_available operation, used code, generation+1, live encrypted result, prior history unchanged. Cold launch without clear/reinstall, observe the retained recovery gate, then explicitly resume once. The proxy validates same-ID status and exact UID/generation ACK; backend signature validation remains authoritative.
8. `ownedRecoveryEvidence.mjs post "$PRIVATE_ROOT"` requires same held op acknowledged, result absent, slot clear, generation advanced once, prior history unchanged and30d retention. The constrained proxy deliberately denies adoption/sync/revoke mutations and queried progress reads: v17 landed on `account-sync-failed`, not the initially expected adoption screen. `verify-completed-recovery` asserts this actual screen, canonical sign-out and no recovery panel. Do not tap sync/adoption to make the test pass. `exit-recovery` performs canonical local sign-out→explicit guest; `guest-continuity` checks Progress/Settings Guest. Pending remote revocation remains pending, not remotely completed. The earlier `resume`/`exit` adoption selectors are retained diagnostic stages, not the v17 completion gate.
9. Cold-start once more with proxy still counting: guest returns, no retained recovery panel or additional counters. `ownedRecoveryEvidence.mjs finish "$PRIVATE_ROOT"` runs the terminal readback before privately advancing only the exact local fixture binding. Stop the app in guest state, stop only owned proxy/Metro processes, and restore `startNativeMetro.mjs http://127.0.0.1:8080`. Verify ordinary Metro/backend ready and proxy18080 absent.

## Evidence and limits

Public artifacts contain fixed outcomes/counts/hashes only. Private Maestro screenshots/logs remain mode700 except the inspected identity/code-free expired UI screenshot. Preserve failed selectors/refusals and prior historical evidence. `native_frame_probe.py` is retained diagnostic history; LLDB capability failed, no debugger retry or Hermes attestation claim follows.

Guest preservation reuses the complete selected canonical MMKV comparison and source audit: six domain rows unchanged (not six exclusively learning rows), own expired Premium removed separately, markers classified with writer attribution still unknown. It does not certify whole-profile/cloud/content-package data; v17 UI continuity is not a new byte comparison. The current state and QA must state these limits.
