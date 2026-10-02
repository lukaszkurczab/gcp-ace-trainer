# Independent acceptance — BIZQ-02 Home weekly answers slice05

Reviewer: `/root/bizq_qa`, gpt-6-luna High; source/repository QA, read-only. The separate design briefing is documented in `BRIEFING-REVIEW.md` and is not used as implementation evidence.

**Verdict: PASS WITH ISSUES** for this bounded source slice. I found no remaining requirement-linked source defect. Native React Native rendering and SDK account-transition behavior are unverified because the current Metro bundle returns HTTP 500; this is a stated limitation, not a gate for this source acceptance. Full BIZQ-02 and BIZQ-01..06 remain open.

## Acceptance evidence

- **Selected track, current profile, week and captured time:** `projectWeeklyAnsweredActivity` filters to the selected track, excludes the current active session, uses the shared device-local Monday calendar, counts `answeredAt <= now`, and excludes future and previous-week attempts from the ready count. The application presenter captures one clock and timezone per calculation.
- **History and identity:** attempts from ended-early sessions and historical package identities remain countable; repeated questions with distinct attempt IDs count separately; identical attempt IDs count once and conflicting payloads return explicit unavailable. Invalid relevant timestamps/contexts return unavailable. Corrupt repository reads still propagate through Home's existing shell error boundary.
- **Real Home read and profile fence:** current and pinned-baseline tests execute the actual `loadShellData` function body with application readers and the real profile router, capturing only UI sinks. Same-profile controls pass. Against pinned baseline `1515a3191514552f93cac058fb6c2e46a47e68ce`, A→B, A→B→A, and transition-during-final-read reproduce publication of account A data. Current source captures the existing opaque lease before the first await and synchronously checks the same lease/no-transition immediately before success setters; current A/B and A/B/A probes reject through the existing shell error path.
- **Copy and accessibility semantics:** the actual `HomeTab` consumer passes the projected plural count to both visible text and its accessibility label. Real i18next tests resolve counts 0, 1, 2, 5, 21 and 22 in all seven locales, including Polish forms. The unavailable key also resolves.
- **Scope:** scoring, recommendations, Premium, CAS, reminders, content/runtime/admission, and other queue/audit ownership remain outside the slice. No device, runtime restart, app install, data reset, deploy or publish was performed.

## Independent verification

- Focused Home weekly, Home shell, Activity and Progress presentation tests: **27/27 passed**.
- `npm run typecheck`: passed.
- `npm run validate:content-boundary` and `npm run validate:runtime-privacy-boundary`: passed.
- `git diff --check` over this slice's owned source/test/locale files: passed.
- Controller's wider current regression run: **58/58 passed** in `ACCEPTANCE-FINAL.log`; its 14/14 Home weekly and shell integration cases are also recorded there.

The AST-based Home test proves the source read/publication pipeline, not React rendering or Expo SDK fidelity. The current Metro probe cannot resolve `learningEvidenceProjection`, so rendered theme/font/wrapping behavior and native account switching remain unverified. The separate HomeTab “This week / answered” behavior is the scope of this slice; this does not establish full BIZQ-02, native release readiness, or a same-profile atomic snapshot across every Home model.
