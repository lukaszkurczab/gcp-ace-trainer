# BIZQ-01 profile-gate probe tool QA — 2026-10-07-03

**Verdict: PASS WITH ISSUES for the capability step only.** The earlier `02` FAIL report is preserved as historical review of earlier source bytes. This report reviews the corrected probe. It authorizes no observation/reload by itself and does not close Q13, Guest preservation, bounded acceptance, full BIZQ-01, or release.

## Reviewed evidence

Reviewed the corrected `q13-test-attestation/probe-profile-gate.mjs`, its focused tests and README. The probe SHA-256 is `ec8b8946915dbf31c7f8e8a20d3d271ff241744c6d716775c6aee2a003d03724`. The matching binding, entry-receipt, and host-context source ref/nonce and exact-byte hash relations were checked offline; the inputs are private and mode 0600. `verifyBinding()` passed against the exact detached old-source checkout and entry receipt. The host context binds the expected app identity and iPhone 17 to one loopback Metro target. The operator separately confirmed the actual old Inspector target is type `node` with the same app/device identity and IPv6 loopback endpoint; no Inspector connection was made for this review.

Focused verification passed: probe tests **11/11** and `node --check`. These tests exercise target filtering, fresh resume-ack event indexing, and delayed receipt writing with mocked operations. They do not substitute for the next real capability operation.

## Findings

- The previous target mismatch is corrected narrowly: `selectInspectorTarget()` requires exactly one matching app/device target, requires the observed `node` type, and requires the IPv6 loopback endpoint on port 8081. It does not accept arbitrary targets or ports.
- The observation receipt is now written only after `withInspector()` resolves, including its socket-close wait. Debugger cleanup errors throw before receipt creation. The close-failure test confirms the writer is not called when the operation rejects.
- Resume acknowledgement now requires a `Debugger.resumed` event at or after the event-array index captured immediately before sending `Debugger.resume`, avoiding a stale historical ACK.
- Allowlisted facts remain constrained to exact exception class and own `code` fields; unknown facts remain inconclusive. The probe does not read error message/stack, module exports, or storage, and does not reload. Cleanup independently attempts resume/ack, breakpoint removal, and debugger disable.
- **Issue:** runtime binding still hashes sibling tool sources but does not include `probe-profile-gate.mjs` itself. This report binds the exact reviewed probe bytes by hash. The capability run must use those unchanged bytes; verify the hash immediately before running. Add self-source binding to the versioned tooling when the package is next revised, without treating this as a new provider/provenance gate.

## Decision and limits

This QA permits proceeding to the minimal `capability` mode only while the reviewed source hash remains exact and the already-observed app/device/target identity remains current. Capability only checks loaded module/source identity and sets/removes a breakpoint; it must not reload or wait for the gate. If it passes and the diagnosis remains warranted, any subsequent `observe` remains a separate operation with at most one ordinary reload, no `Page.reload`, and no profile/storage mutation. Stop on target/binding refusal, incomplete cleanup, inconclusive facts, or changed runtime identity.

No Inspector operation, Metro action, reload, account action, or profile/storage write was performed in this QA. This is not proof of actual breakpoint behavior, a diagnosis, Q13 acceptance, Guest preservation, or educational effectiveness. The prior FAIL findings were fixed in the reviewed source; report `02` remains unmodified history.

| Fit | Simplicity | Risk | Maintainability | Minimum |
|---:|---:|---:|---:|---:|
| 0.94 | 0.88 | 0.84 | 0.82 | 0.82 |

The remaining self-hash omission is bounded by this exact source receipt and immediate pre-run hash check. It does not justify widening diagnostic scope or adding an external provider gate.
