# BIZQ-01 profile-gate probe tool QA — 2026-10-07-02

**Verdict: FAIL — do not run `capability` or `observe` until the two tool defects below are corrected and this review is repeated.** This is an acceptance review of the bounded Q13 profile-gate diagnostic tool only. It does not close Q13, Guest preservation, bounded acceptance, full BIZQ-01, or release.

## Evidence and scope

Reviewed `q13-test-attestation/probe-profile-gate.mjs`, its README and focused test file at the exact source bytes identified by SHA-256 `65916e5b89b5470d5d7070ba6c7a4193f196669ebbbe24e2972911ea32c423e2`. The test source hash is `96360f5f4c27dfea58cfcab4ea4dc28ff209d14339153af4f7472d9511cdecaa`; the README hash is `f1c18147a4b3357514c03b1a575a685c88ab099768a2d1ca40601801c8f9c7fd`. These hashes bind this review to the reviewed bytes; they do not make the probe self-verifying.

Offline `verifyBinding` passed against the current private OOD23 source binding, its detached checkout, and matching private `js_bundle_entry` receipt. A separate private host-context check confirmed byte hashes for the binding and entry receipt, matching source ref and nonce, the expected app bundle identifier and iPhone 17, and one loopback Metro target on port 8081. The three private inputs were mode 0600. The context file uses a newer shape than the README's illustrated v1 context; this probe does not consume that host context, so the schema difference is not itself a probe failure. No target metadata was read by this reviewer, and no Inspector connection, runtime probe, reload, service action, or account/profile mutation was performed.

Focused verification passed: `node --import tsx --test .../probe-profile-gate.test.mjs` (9/9) and `node --check .../probe-profile-gate.mjs`. These are pure tests. They do not establish that this Inspector target is accepted by the tool, that the breakpoint can be installed on the real loaded bundle, or that cleanup works against the actual device debugger.

## Blocking defects

1. **Inspector target type may reject the actual React Native target.** `openTarget()` accepts only `target.type === "page"` while the current React Native 0.86 Metro `/json/list` observation on the main runtime was `type: "node"`. The private old-target type has not been established in this review. If the admitted old target also reports `node`, `capability` deterministically stops at `inspector_target_count_invalid`; app ID, device name, and loopback WebSocket checks already provide the narrow identity constraints. Confirm the old target's type privately, then allow the observed debugger-capable type while keeping the unique app/device/WebSocket constraints. Do not broaden to arbitrary targets or port selection.

2. **An observation receipt can survive connection-close failure.** `runProbe()` writes the receipt from its callback's `finally`, but `withInspector()` closes the socket only after that callback returns. If close times out or fails, the command fails while the mode-0600 receipt remains. This contradicts the README's no-receipt-on-cleanup-failure rule and could leave apparently valid evidence after incomplete cleanup. Return the observation only after debugger cleanup, let `withInspector()` finish closing successfully, then create the receipt; ensure every thrown close/cleanup path leaves no receipt. Add a pure test for close failure and absence of a receipt.

## Non-blocking evidence limitations

- The probe requires one exact initialized module set, a unique nonce-bearing loaded bundle containing the gate catch, and allowlisted class/own-code facts. It does not evaluate message, stack, or module exports; it records unknown facts as inconclusive. Those are appropriate bounded constraints.
- `cleanupDebugger()` attempts resume, resume acknowledgement, breakpoint removal, and debugger disable independently. Its tests verify later attempts after mocked failures. `Cdp.waitEvent()` can return a previously stored `Debugger.resumed` event, so the acknowledgement is not guaranteed to be causally after `Debugger.resume`; use a fresh-event waiter/sequence if this can be corrected without widening the diagnostic.
- The binding hashes four sibling tool sources but omits `probe-profile-gate.mjs` itself. The source hash above records the reviewed tool, but runtime `verifyBinding()` will not reject a later edit to this probe. Before relying on the CLI for reproducible acceptance, bind the probe source through a non-circular manifest/input or an equivalent reviewed integrity check. This is a maintainability/evidence-binding gap, not the immediate reason for FAIL.
- Synthetic tests validate the modeled contracts only. A passing capability run, after these defects are repaired, would establish actual Inspector access and breakpoint set/remove for the accepted target; it would not diagnose the profile failure or prove Q13 acceptance. Any later observe run remains limited to one ordinary reload and allowlisted safe facts.

## Scores and next action

| Fit | Simplicity | Risk | Maintainability | Minimum |
|---:|---:|---:|---:|---:|
| 0.92 | 0.85 | 0.62 | 0.82 | 0.62 |

The narrow design fits the requested diagnostic and avoids storage/purchase bypasses. Risk is below the 0.8 floor because target compatibility is unresolved and receipt persistence does not honor the cleanup contract. Correct those two defects, add the close-failure test, reconfirm exact old target metadata privately, then request independent review against the changed source hash before any capability operation. No educational-effectiveness claim is made.
