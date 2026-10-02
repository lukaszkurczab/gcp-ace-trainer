# AUD-08-B3 — initial independent source QA

Verdict: FAIL for full B3 acceptance. Reviewer: GPT-6 Luna, high, independent and read-only. Targeted suite: 95/95 PASS (coordinator, vault, adapter, session exchange and lifecycle); typecheck PASS. No devices/emulators/services were used. Source continued changing after this review, so this is not a final frozen-source verdict.

Verified persistence ordering before request/exposure, no custom token persistence or snapshot publication, strict six A2 adapter methods, exact Firebase UID/generation before consume ACK, matching-session cold ACK without sign-in, missing-claim-only explicit issue bridge and startup/profile/guest guard placement.

Material defect: current startIssue always retains/reconciles an existing operation; delivery_unconfirmed blocks replacement and offers no consciously confirmed new operation. Approved A2 protocol requires conscious replacement after unavailable result, with old codes invalidated only by the new issue. No automatic retry/new ID is permitted. Producer store confirms new UUID is allowed after expired/released slot with current generation and original 300-second recent-auth rule. Correction requires a separate validated briefing and runtime evidence.

Material gaps: no mounted-provider/auth-observer concurrency test; native SecureStore/Firebase SDK/route/cold-restart/background acceptance not performed. Different-account mismatch sign-out disclosure/policy remains pending PO. UI source test separately found missing background-code hide; independently approved visibility correction is in progress.
