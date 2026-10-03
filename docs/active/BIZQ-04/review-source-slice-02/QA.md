# BIZQ-04 — explicit review source02 independent QA

**Verdict: PASS** for the bounded review-source selection correction.

The changed `CanonicalTrainingRuntime.prepare` path now validates the requested source against resolved mode capabilities before selection. Multi-source Coding weak-area review requires an explicit source; `due_queue` reads only scoped due reviews, so a historical miss cannot populate an empty queue. Requests for `session_misses` fail unavailable before session persistence because this boundary cannot verify completed-session provenance. Single-source Certification and Design due-review modes continue using their declared due source without a request override. The simulation dispatch also rejects review-source/ref controls before simulation preparation. The implementation uses the existing runtime and storage flow; the doc17 hash in `CONTRACT-HASHES.json` matches the current document.

Independent verification:

- `node --import tsx --test src/application/canonical/CanonicalReviewSource.test.ts src/application/canonical/CanonicalTrainingRuntime.test.ts src/application/canonical/odk096AwsSessionSelection.test.ts src/application/canonical/odk097DesignSessionSelection.test.ts src/application/coding-interview/codingInterviewSessionFacade.test.ts src/content/canonical/productModeConfig.test.ts` — **42/42 passed**.
- The new real-catalog/lifecycle cases cover explicit due-only selection with historical misses present, truthful shortening, empty due evidence without durable writes, unavailable `session_misses` without writes, retained single-source Certification/Design behavior, future/stale/foreign refs, deduplication, invalid source/ref controls, and simulation rejection before writes.
- `npm run typecheck` — passed.
- `git diff --check` on the touched runtime and existing runtime test paths — passed.

No material defect was found. This does not implement or claim `session_misses` support: it remains explicitly unavailable until completed-session evidence can be verified at the preparation boundary. Broader F-12 selection/priority policy, native UI, and full BIZQ-04 acceptance remain outside this slice.
