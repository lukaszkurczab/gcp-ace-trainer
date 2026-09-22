# ODK-119 — authenticated bootstrap and foreground refresh (partial)

The account foreground sidecar now requests a provider-backed entitlement refresh once when a confirmed authenticated account becomes active, and again after a successful identity refresh on return to the foreground. The account provider sequences all entitlement refresh requests, including purchase/restore, so a response from an earlier request cannot overwrite a later one. The existing generation, Firebase UID and backend account checks remain immediately before cache mutation. A provider failure leaves cache unchanged and does not turn it into online access.

This is **not full ODK-119 completion**. Reconnect needs an explicit connectivity signal; sign-out/account-switch cache clearing and Premium package/session admission need runtime integration. Provider console and E2E evidence remain open.

Independent `gpt-5.6-luna/max` briefing validation: consistency 0.92, simplicity 0.84, risk control 0.83, maintainability 0.88; minimum **0.83**, approved. Independent implementation QA approved the slice (consistency 0.92, simplicity 0.88, risk control 0.88, maintainability 0.90; minimum **0.88**). A QA-identified sign-out race was closed by using a read-only generation capture; its regression test and the full focused retest pass.

Verification: app `npm run typecheck` PASS; 33/33 targeted queue, foreground scheduler, account identity and entitlement tests PASS after the race fix. No full app suite claimed.
