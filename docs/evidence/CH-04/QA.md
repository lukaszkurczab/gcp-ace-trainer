# Independent acceptance — CH-04

Verdict PASS. Reviewer gpt-6-luna/high, independent read-only review and own execution.

Objective: implement canonical CH-04 completely while preserving concurrent BIZQ OOD119 work. Original plan §8.3 AC: separate complete list/detail guards, reject inherited enums, malformed dates/revision/channel/subjectVerified/extension/delivery/reportSubmissionIds; explicit error, stable UI, no actions from unverified detail; valid minimal/full nullable backend payloads; unchanged auth/wire/domain/revision contracts.

Reviewer read actual panel diff, tests and backend PrivacyRequestListItem/PrivacyRequestDetails/toListItem/readAdmin/contracts. validListItem checks own-key enums, channel/outcome, valid UTC calendar dates and nonnegative safe revision; validDetails adds exact request identity and every rendered/action-driving field. Open clears previous detail before await. Load clears list before fetch. Invalid PATCH confirmation clears controls and exposes error, without changing transport/auth/revision/domain behavior. All required backend null fields accepted; reportSubmissionIds is string[] matching actual backend projection. No backend/wire changes.

Independent actual command: ADMIN_BEHAVIOR_PORT=25224 node --test --test-name-pattern='CH-04|privacy queue' scripts/admin-behavior.test.mjs. Mounted Chromium with controlled HTTP/Firebase:5PASS,0FAIL; git diff --check clean. First sandbox browser launch blocked by Mach rendezvous; authorized escalation executes the same safe local test and passes. This is actual component behavior against wire payloads, not live Firebase/backend/SMTP integration, which CH-04 does not require or claim. No acceptance blocker remains.
