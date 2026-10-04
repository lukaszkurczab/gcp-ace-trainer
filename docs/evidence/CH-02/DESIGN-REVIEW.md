# CH-02 independent design review

2026-10-04, gpt-6-luna/high, separate from implementation. PASS with conditions; design-only, no runtime readiness claim. Fit.95/simplicity.89/risk.84/maintainability.88, minimum.84.

Backend userProfileSchema requires UUID/date-time, exact required profile/identity keys and nullable acceptedTermsVersion/email (acceptedTermsVersion string has no minLength in actual OpenAPI); provider/subject nonempty, email format, boolean verified. Do not infer subject binding to Firebase UID. Operation status pending may already have a proof; require proof for completed remote stages. Match requested IDs, preserve formats/wire/deadline/generation guards.

Required correction: deleteAccount invalid_response currently marks failed and later resets operation credentials. Retain remotePending/same operation and secret; no automatic status/retry/cleanup on malformed success. Malformed public proof does not permit cleanup; status errors do not update stage. Exercise actual client→production account paths. Registration sharing is optional; controller chooses bounded four-method scope and retains established registration parser rather than opportunistic tightening. This narrows, not changes, accepted approach.

No direct contract overlap found with N05 source/history→sync/admission or BIZQ02–05/ARCH/PERSIST; shared repo/index/docs ownership remains guarded. Source refs: backend src/api/openapi.ts:563, account-lifecycle/store.ts:1050; app accountDataService.ts:737–769 and accountSessionExchange.ts:12–20. Runtime QA remains required.
