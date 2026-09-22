# ODK-119 — app snapshot/cache foundation (partial)

The prior domain helper granted Premium for seven days after a local `verifiedAt` value and had no runtime caller. This slice replaces it with strict provider-backed snapshot validation and a dedicated local cache. A fresh response must contain exactly one item for the explicit account, entitlement and product, with `source: revenuecat` and strict UTC timestamps. Active and grace access stop at the respective provider-confirmed expiry; hold, expired and refunded deny. The cache persists the greatest observed wall time before any offline access decision, so clock rollback denies access. An invalid response does not replace the record; a fresh negative response does.

This is a standalone foundation, **not a completed Premium gate**. The app does not yet refresh the backend endpoint at bootstrap/foreground/reconnect/purchase/restore or use the cache in package/session admission. The package runtime currently resolves bundled track content without a separate paid package identity, so that boundary must be made explicit before gating. Provider console and E2E evidence are still required.

Briefing: independent validation on the configured `gpt-5.6-luna/max` profile approved the narrowed plan with scores consistency 0.96, simplicity 0.91, risk 0.86, maintainability 0.91; minimum **0.86**. Independent `gpt-5.6-luna/max` implementation QA approved the slice (consistency 0.88, simplicity 0.92, risk 0.84, maintainability 0.87; minimum **0.84**). Its storage-read exception finding was hardened after review.

Verification: `npm run typecheck` PASS; targeted `premiumEntitlement.test.ts` 4/4 PASS. No full app suite claimed.
