# Patternly — current working state

Updated 2026-10-02. **AUD-08-B3: PASS for agreed local scope**, independently accepted by Luna High. This is the single current handoff. Canonical plan: `docs/PATTERNLY-WORKING-PLAN.md`; detailed current result/history: `docs/active/AUD-08/B3-REPORT.md` (v17); acceptance: `B3-QA-CONTINUATION-v17.md`.

## Repositories and preserved edits

| Repository | Branch | HEAD |
|---|---|---|
| patternly | main | 532869d1af6dcd0558c5376b569ed43e408e1316 |
| patternly-backend | main | 019e48e7d8e074c2e45d7f5ebb639a4ad394ae8f |
| patternly-content | master | 0174e42fbe7634a54c1f5d87369063c7e01e8c7e |
| patternly-web | main | 9585919b7d0c1a8396e6d255e49850e64e129d0e |

No commit/push/deployment/publication. Pre-existing app/content AGENTS.md edits and unrelated BIZQ/spec/content README and content-review implementation/test changes preserved. B3 adds uncommitted tools/evidence/docs and a two-file production UI correction.

## Accepted result and applicable evidence

- Native v17 on existing iPhone17: one committed consume, response held, process killed before delivery/status/SDK/ACK, cold same-operation restore, explicit SDK resume with exact UID/generation, one ACK and verified cleanup. Final counters **consume1 / status2 / ACK1**; no second consume attempt or hold timeout. Backend result scrub/slot clear/gen+1/prior8 unchanged verified readonly. Cold guest launch leaves counters unchanged and no recovery gate.
- Shared RecoveryOperationPanel fixed nested translation lookup and terminal false account-mismatch warning. Fresh selected UI/composition/i18n **51/0/0**, typecheck PASS; independent presentation **13/13**, typecheck PASS. Corrected native terminal screenshot inspected. No protocol/storage/schema change.
- Consumer55 v17 and producer28 v12c pins match current files: consumer53 unchanged from v15 + panel/test2 changed, producer28 unchanged. Reuse historical static **1589/0/4 dedicated SKIP** and separate real HTTP/SDK **4/0/0** at unchanged boundaries, covering multiple scenarios. Proxy/test bytes unchanged, final loopback6/6 reused. Final syntax/JSON/diff checks PASS. Exact HEAD equality with historical manifests is not claimed.
- Native v14 ISSUE/save/cold/ACK and consume/ACK retained within their scopes; consume restart AFTER ACK was not interrupted resume. V17 now covers the selected missing process-death point, not full B4.
- Canonical guest learning: historical complete recognized selected MMKV keyspace comparison has six unchanged domain rows (not six exclusively learning rows), own expired Premium cache removed separately. Exhaustive registry/producer/consumer audits and unchanged guest/persistence/sign-out/protocol sources support reuse. Independent QA finds no material new writer/regression requiring new bytes after v17. Actual v17 safe local sign-out→explicit guest→Progress/Settings PASS; no reset/reinstall/adoption/transfer/discard. No fresh byte comparison or whole-profile/cloud/content-package/marker writer attribution claim. Historical strictMismatch=true/preservationAccepted=false/writerProvenance=unknown retained.
- LLDB real capability failed (MAIN timeout/no capture); executed Hermes digest remains unverified and is not a product criterion. Source-to-runtime uses fresh post-fix Metro, real origin probe, corrected source-specific native UI and frozen pins. No further debugger attempt.
- Delivered non-secret continuation tools/runbook: `scripts/aud08/README.md`; consumed v17 config/code cannot be reused. Private inputs/logs/snapshots stay outside Git. Exact-owned missing local Auth UID restored under prior authorization; private fixture binding advanced only after terminal readback, without finish Auth/Firestore writes.

## Runtime and next boundary

Existing iPhone17/app stopped in guest state. Test proxy18080 absent; ordinary Metro8081/backend8080 restored ready. Existing Firestore18081 untouched; local owned Auth19099 ready. Remote revoke remains queued because the bounded proxy denied it; no remote-completion claim.

No material agreed B3 criterion remains open. Full B2/B4 remain separate: SMTP family needs PO, cloud index/TTL application and release/provider/physical-device/GO gates remain outstanding. Preserve approved retention30d and retained old ISSUE/explicit current-account policy. No automatic retry of uncertain effects or reuse of spent v17 fixture code. Next work follows the canonical plan; this continuation does not authorize deployment, publication, commit or push.
