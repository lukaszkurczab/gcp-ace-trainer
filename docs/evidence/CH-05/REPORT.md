# CH-05 — bounded admin requests and uncertain writes

Implementation date: 2026-10-04. Acceptance: independent Luna High PASS; final frozen-source mounted suite 55/55 and configuration 3/3.

## Delivered scope

One narrow `patternly-web/src/adminRequestLifecycle.js` owns the total 12-second token → fetch → response-body deadline, cancellation, timer cleanup and publication leases. The three privacy/legal/security panels retain their own payloads, validation, revision checks and domain errors. Replaced unbounded request helpers and inconsistent busy/finally paths are removed. No package/dependency, backend protocol, auth configuration or generated artifact changed.

Dispatched writes keep a runtime resource/effect uncertainty latch across remounts and admin changes. A refresh or newer revision does not clear a pending or unknown external delivery. Legal answers require exact normalized response digest and terminal answer proof. Privacy public delivery requires terminal delivery facts; extension retry shares the notice effect. Security sends bind recipient and notification version, block pending/unknown resend and retain existing reconciliation/manual resolution. Unknown create ACK cannot be inferred from title/date/list matches. Export cancellation checks account, incident, revision and export version before Blob creation or download.

The initial UID-only latch proposal was rejected for concrete duplicate-send risk (risk 0.72). Independent Luna High reviewed the revised scope: fit 0.95, simplicity 0.85, risk 0.83, maintainability 0.89, minimum 0.83. Source review and acceptance were independent of the implementation worker. Controller additionally corrected stale lease/finally handling, digest-before-lock races, after-SMTP 404 uncertainty and action-specific resolution conditions against actual backend source.

## Ownership and independence

Web owns three panels, the helper and `scripts/admin-behavior.test.mjs`; app owns CH-05 evidence and only its canonical plan/state receipt. BIZQ-01 N04/20 retains questions, catalog/version, migration, candidate/readiness/admission, generated banks, app lock and web demo provenance. CH-05 uses an isolated Vite port/cache, no shared build generation, Metro or simulator. BIZQ-02..05 and ARCH/PERSIST learning runtime, progress, planner, review and durable-data contracts are not changed. CH-04 validation and all 33 malformed PATCH variants are preserved; each invalid dispatched confirmation now also proves no blind second mutation.

## Limits retained by the accepted task contract

This is mounted React browser acceptance with controlled HTTP/Auth ports and actual browser Response/WebCrypto behavior. It does not establish real SMTP, Firebase SDK, Firestore, production readiness or mobile behavior. No deployment, publication, production purchase or service configuration change occurred.

The latch is volatile within the browser runtime, not durable across browser reloads. Where the current backend DTO cannot prove the exact action outcome, the UI retains an explicit unavailable/uncertain state: privacy response preparation after a lost ACK; unconfirmed legal delivery without exact terminal answer; security payload-target actions whose exact target is absent from the read projection; incident creation after lost ACK. These backend read/recovery gaps remain with AUD-08; frontend retry is not a substitute.

Final verification and reproducible commands: [QA](QA.md). Historical preflight and corrected hypotheses: [PREFLIGHT](PREFLIGHT.md), [briefing](BRIEFING.md), [design review](DESIGN-REVIEW.md).

Accepted implementation commit: `patternly-web` `3a2614f` (five owned files). Documentation commit carries only CH-05 evidence and additive own receipts; foreign working plan/audit/BIZQ changes remain unstaged.
