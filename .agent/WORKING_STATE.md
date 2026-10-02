# Patternly — current working state

Updated 2026-10-02. Canonical remaining work: `docs/PATTERNLY-WORKING-PLAN.md`.

## Current baseline

Mobile ACK/resume is locally accepted: real committed consume interrupted before delivery, cold same-ID resume, exact SDK identity/generation, one ACK and cleanup without repeated consume. Shared panel translation and terminal warning are corrected. Accepted snapshot and QA remain in Git at `74d8439c9801448c6b536d2f72eb4bd18811482d`; closed reports/evidence and one-shot tooling have been removed from the active tree.

Existing iPhone17/app is stopped in guest state. Ordinary Metro8081/backend8080 were restored ready; test proxy18080 is absent. Guest local canonical preservation uses the applicable historical comparison and unchanged data paths; no whole-profile/cloud/package or unknown marker-writer claim. Remote revoke remains queued; no remote-completion claim.

## Remaining work

- AUD-08-B2: choose SMTP family with owner, complete that scope; retention30d already implemented locally. Cloud index/TTL application is a separate deployment step.
- AUD-08-B4: assess remaining full failure-matrix criteria, reuse applicable source/runtime evidence; SMTP-dependent cases await that decision.
- BIZQ and release work follow the canonical plan. No deployment/publication authorized.

## Local changes outside this cleanup

App/content AGENTS.md and parallel BIZQ/spec/content-review changes are preserved and excluded from this task's commits. Cleanup and push cover the app recovery completion and closed-task removal only; other repositories remain at their prior checkpoints.
