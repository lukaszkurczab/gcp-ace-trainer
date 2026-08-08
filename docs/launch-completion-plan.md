# Patternly — implementation-plan handoff

**Status:** no active implementation plan
**Updated:** 2026-08-08

This file intentionally contains no executable task ledger. The previous plan described a superseded product contract; its obsolete ordering, task numbers, repair diaries, and repeated logs have been removed from the current repository. Detailed history remains available in Git. The still-relevant repository facts and unfinished capability areas below are retained as input to Directive 3 rather than being discarded.

Current product behavior is owned by:

1. `canonical-product-contract.yaml` and its schema, semantic parser, and tests;
2. `product-owner-decision-register.md`;
3. narrative documents `00`–`13` and `15`–`17` according to `README.md`.

Reports, audits, screenshots, design evidence, ADRs, and old task identifiers do not authorize work or claim current status.

## Retained implementation starting point

Directive 3 must verify, classify, and sequence these facts rather than assuming a greenfield application:

- the shared learning kernel, Certification and current Algorithms/Coding Interview learning semantics, deterministic scoring/review, journal-first MMKV durability, drafts, timers, recovery, and reset are substantial foundations;
- Firebase Admin token verification, deny-all direct Firestore rules, Cloud Run HTTP/account boundary, revisioned/idempotent sync, paginated snapshots, adoption primitives, deletion intent/proof, environment isolation, and security tooling exist on the server side;
- the content repository has canonical manual source, schemas, semantic validators, provenance, immutable release identities, checksums, reproducibility, and byte-verification;
- current mobile account/auth/sync integration, explicit guest installation identity, goals, nested Activity, RevenueCat/backend entitlement, Premium packages, analytics/crash consent, content reports, and PITR restore safety remain unverified or absent;
- current server synchronization still models account-wide active-session fields that conflict with the device-owned target and require explicit keep/move/rewrite/delete analysis;
- current navigation and registry still expose Home, a one-option Language route, visible family-like categories, two-track branches, and the pre-migration Algorithms identity;
- current content delivery bundles whole-track artifacts and lacks the target Free-node/immutable whole-node Premium package boundary;
- current platform configuration remains Expo 54, Light-only, iPad-capable, and below the target iOS/Android release matrix;
- current visual references and runtime/device evidence remain evidence to assess, not automatic target approval or completion.

Relevant retained evidence includes `launch-surface-inventory.md`, `competitive-product-gap-audit.md`, `launch-readiness-audit.md`, `reports/launch-001-account-data-contract.md`, the account/provider foundation reports under `reports/launch-003*`, and `reports/launch-005-learning-runtimes.md`. Directive 3 decides whether each still supports a current verification gate and removes or reclassifies it when it does not.

Directive 3 must audit the pushed application and content repositories, then regenerate this file in place as the sole execution-order and repository-status source. Until that change is committed and pushed, no implementation task is selected from repository documentation.
