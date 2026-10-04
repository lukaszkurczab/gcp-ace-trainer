# CH-02 — account API boundary validation

2026-10-04. Canonical source: PATTERNLY-WORKING-PLAN §8.3 CH-02; docs/04 and docs/11 boundary validation. Current backend source, generated OpenAPI and actual store override stale report claims.

## Outcome and acceptance

Unknown payloads in getMe, deleteAccount, getDeletionProof and getDeletionOperationStatus become DTOs only after full required-field/type/format/status/identity validation. Invalid me cannot select/activate profile or start sync. Invalid deletion response cannot confirm a durable remote-completion stage or authorize cleanup. Correct backend responses, nullable fields, generation/proof verification, wire format, credentials, deadline and explicit retry remain.

Actual backend pending can carry null or an allocated proof ID; remote_deleted/complete require proof. Operation response matches requested operation; public proof matches requested proof and contains canonical operation UUID. Provider and subject are nonempty strings, not a closed invented enum or Firebase UID equality. User ID UUID and date/email formats follow current backend OpenAPI; acceptedTermsVersion is string|null, without an invented minLength. No backend schema/package or generic transport rewrite.

Invalid successful deletion is ambiguous: current catch marks failed, and next attempt clears/recreates the operation. Minimal correction retains remotePending and same ID/secret with safe diagnostic, without automatic status/retry/cleanup. Invalid proof keeps previously confirmed remoteDeleted stage but cannot authorize cleanup.

## Ownership and independence

Worker gpt-6-luna/high (reused for dependency/persistence analysis) owns adapter, client tests, minimal accountDataService catch and actual account lifecycle/exchange/profile tests. Controller owns only this evidence and own queue/state hunks. Independent design and acceptance reviewers gpt-6-luna/high, separate conclusions. Registration acceptance is outside scope; existing envelope parser remains necessary and is not opportunistically tightened. Provider inspected, not changed absent proven requirement.

BIZQ N05 owns content questions/version/proof/history then bank/app lock/demo sync/admission. No same target file diff at preflight. CH02 does not call output-producing content scripts, emulator/Metro/device. Shared app repo/index/docs require own hunks only. BIZQ02–05/ARCH/PERSIST runtime/progress/planner/review/data and AUD08 generation/proof/recovery protocol unchanged. Backend clean, read-only schema reference. No service config/deploy/publish/purchases; preserve foreign files/stashes/processes.

## Approach and checks

Local validators and public-method wiring; one narrow consumer correction. Controller scores fit.95/simplicity.89/risk.84/maintainability.88 min.84; decisive risks are nullable fields and retained uncertain operation identity. Independent design accepted same minimum with preservation/date/email conditions. Valid/invalid public fetch matrix; actual production coordinator/lifecycle paths asserting no selection/sync/cleanup and identity reuse; relevant account suites and typecheck. Independent QA must inspect diff and execute critical behavior rather than rely on worker report. Node/tsx local isolated storage seams, no native/provider acceptance claim. See PREFLIGHT.json and DESIGN-REVIEW.md.
