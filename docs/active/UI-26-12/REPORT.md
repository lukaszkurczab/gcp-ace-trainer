# UI-26-12 — Exam Review

Status: ACCEPTED — independent Luna High QA PASS. 2026-09-30.

## Change and cause

Only EXAM_REVIEW disables its native header; SessionShell owns the top inset and the single return action. Previous/Next retain boundary guards and Back to results uses popTo with the exact route sessionId. Unanswered now uses the canonical PracticeFeedbackBlock, expanded initially, without adding report capability. Removed the replaced manual Details branch, dead import and styles. Answered disclosure/report defaults remain intact. German Previous is Vorherige, distinct from Back to results.

HTTPS opener rejects unsafe/malformed targets before invoking the injected opener, preserves the exact canonical URL and exposes failure. Native testing found an existing detached Linking.openURL receiver defect: installed React Native invokes this._validateURL. Both production default and fixture injection now call Linking.openURL(url) through a wrapper; no fallback. Canonical scoring, question order, content, storage and entitlement contracts remain.

## Fixture and evidence limits

Strict DEV+smoke deep links select exam-ready or source-failure; sandbox/release resolve an inert unavailable peer. Fresh launch key resets independent navigation and trace. The actual Result and ExamReview screens use optional memory readers; production readers remain defaults. Fixture Result mirrors production native header; Review remains headerless. Notice is in the body and explicitly says in-memory/no saved result. Source open attempt counter distinguishes handler attempts from external OS calls.

Shared fixture builder uses actual bundled canonical GCP profile/catalog, domain session/attempt/result factories, scorer/fingerprint and production review projection. Fixed 50 questions: 1 correct, 1 incorrect, 48 unanswered, 1/50 points. No partial outcome invented for single-choice questions. Readers reject other IDs; fixture invokes no repositories, session starts, backend writes or entitlement services. Source-failure throws before external opener; ready calls actual Linking with projected URL. This proves local screen behavior, not saved production-session acceptance, real auth providers or Premium. Partial-credit aggregates are verified by CPU regression; separate multi/partial runtime remains AUD-15. VoiceOver excluded by PO decision.

## Checkpoint and assessment

App base ff78a605c2a84bac17c1df9680e593d63626ba87; backend 4f714e5146c48815ae03d03d8d47ccc96146c440; content 0174e42fbe7634a54c1f5d87369063c7e01e8c7e; web 9585919b7d0c1a8396e6d255e49850e64e129d0e. Four upstreams 0/0 after fetch. Other repos untouched. Node22.22.3, existing iPhone17/iOS26.4 only, Maestro2.10. Smoke Metro localhost8081 status PASS; backend8080 ready database/authentication/providerReader true; Auth19099 config PASS over reused Firestore18081. No datastore/profile reset.

Independent briefing-only Luna High approvals: source .93/.89/.92/.90 min .89; runtime .88/.82/.82/.85 min .82; receiver correction .97/.96/.94/.96 min .94; fixture Result header .97/.96/.95/.96 min .95. Luna medium owns bounded implementation; independent Luna High QA owns acceptance.

## Verification

- Final focused Node22 suite 78/78 PASS: canonicalSourceLinks, certificationExamReviewProjection, fixture command/runtime, examReviewPresentation, certificationPracticeReviewPresentation, ExamScreen.navigation, examReadOwner, sessionResultPresentation, questionSourceSurface, practiceCopy, loadingStateOwnership, Metro fixture mapping. Additional feedback/result regression 8/8 PASS including partial aggregates and immutable historical maximum. Typecheck, content boundary, runtime privacy boundary and diff-check PASS.
- Actual-source EN dark standard flow PASS: Result1/50 → correct/incorrect/unanswered → canonical Resource Manager source → Safari About resource hierarchy → resume with stopApp:false → exact URL/count1 → same Result1/50 → ExitHome.
- EN light standard full50 controlled-failure flow PASS: both boundaries disabled correctly, complete five authored Details lines/Reason, no Unanswered report, exact IAM URL/count1, full visible error above footer, Previous49→Next50, same Result1/50, ExitHome.
- DE dark 2× final full reproducible flow PASS (143/143 commands COMPLETED). Header/Previous/Next readable; status/details require scrolling under long canonical English content. Full localized error, count1, exact IAM URL, same result and ExitHome evidenced in suffix.
- Independent QA: 26/26 source tests plus post-header12/12 and diff-check PASS, EN standard/light/browser/error screenshots reviewed; final DE screenshots and143/143 commands reviewed; final verdict PASS, no acceptance gap.

[VERIFICATION.json](VERIFICATION.json) stores sanitized command/status evidence; [screenshots](screenshots/) stores required captures. Maestro flows are reusable regression harnesses. Simulator content_size large / accessibility-extra-large; components cap multiplier at2. Variants cover requested dimensions, not all combinations or seven-language release acceptance.

## Failed attempts and corrections

First launch hit stale disabled bundle while Metro rebuilt; restart smoke Metro/client connection resolved it, no alias change. Sandbox Metro start EMFILE required authorized outside-sandbox watcher access, no approval rejection. Detached Linking method caused actual ready opener failure and was fixed. Initial browser assertion assumed a generic address label, replaced with observed canonical page heading. launchApp default restarted the in-memory fixture; stopApp:false preserves it. Centering the last source item can time out despite visibility; normal visibility plus actual browser proves operation. Large text needs explicit status/error scrolling and short gestures inside the reduced content viewport, as recommended for screen fragments in Maestro. These failed attempts are not counted as PASS.

UI-26-11 active evidence archived to history ff78a605; reusable source/tests/flows retained. Legal-values PO input remains pending and is not release acceptance. No EAS publish, service deployment or content publication.
