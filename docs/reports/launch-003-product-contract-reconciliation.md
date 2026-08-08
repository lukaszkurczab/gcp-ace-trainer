# Launch 003 — Product contract reconciliation

**Status:** Directive 2 working evidence; not implementation status or execution order
**Audit date:** 2026-08-08
**Application baseline:** `main` at `29ff01430eb73bd6e40e455f0f0bc0c0b6c5957d`
**Content baseline:** `master` at `d780204eba858c05b94fdbce8de38ec4c3900a50`

## Scope and authority

This report records the evidence used to reconcile the normative contract and narrative documents. It does not authorize implementation, external mutations, visual approval, or execution sequencing. Product and commercial decisions come from the Product Contract owner directive; visual and handoff decisions come from the Brand/Design owner directive. Current code is implementation evidence only.

Statements in this report are classified as:

- `DIRECT_OWNER_DECISION` — explicitly decided by the supplied owner directives;
- `DERIVED_TECHNICAL_CONSEQUENCE` — necessary to make an owner decision safe and internally coherent;
- `CURRENT_REPOSITORY_FACT` — verified implementation state, not target authority;
- `OPEN_MATERIAL_DECISION` — a consequential choice that remains with the owner.

## Authority and contradiction matrix

| Topic | Previous/current evidence | Reconciled target and kind | Primary owner |
|---|---|---|---|
| Entry | Local learning already opens without an auth gate, while the old contract required a verified account | Guest reaches a complete Free node before registration; account is required for Premium, sync, restore, and cross-device continuity (`DIRECT_OWNER_DECISION`) | Contract; docs 01 and 03 |
| Commercial model | No billing implementation; old narratives excluded billing | Permanent Free plus one account-bound Premium entitlement, sold monthly and annually; no slots or tiers (`DIRECT_OWNER_DECISION`) | Contract; docs 01 and 09 |
| Session ownership | Local runtime owns one active session, but the server model synchronizes active-session reference, draft, and timer | At most one active session per device; pointer, session, draft, position, timer, and journal never synchronize (`DIRECT_OWNER_DECISION`) | Contract; docs 08 and 17 |
| Synchronization | Server has revisioned snapshots, idempotent operations, adoption, and deletion; mobile integration is absent | Journal-first local mutation followed by compact idempotent account operations; explicit triggers, incremental cursors, pagination, and rebuildable projections (`DIRECT_OWNER_DECISION`, `DERIVED_TECHNICAL_CONSEQUENCE`) | Contract; docs 02 and 08 |
| Identity | Server verifies Firebase ID tokens; old target was email/password only with exact 30-minute ordinary links | Email/password, Apple, Google, and eight one-time recovery codes; provider-controlled ordinary action-code expiry; exact 30 minutes only for the custom deletion token (`DIRECT_OWNER_DECISION`) | Contract; doc 09 |
| Content delivery | Immutable, reproducible whole-track artifacts are bundled in the app | Complete Free nodes remain bundled; immutable compressed whole-node Premium packages use authorized signed delivery, validation, atomic activation, and exact version pinning (`DIRECT_OWNER_DECISION`) | Contract; docs 07 and 08 |
| Navigation | Current tabs are Home, Practice, Progress, Settings; Language is a one-option route; Activity is only a summary | Tabs are Today, Practice, Progress, Settings; Activity is nested under Progress; no launch Language route (`DIRECT_OWNER_DECISION`) | Contract; docs 01 and 03 |
| Product taxonomy | Two visible tracks expose category labels and use `algorithms`/`certification` families | Families are internal; ten equal-status target track briefs; Coding Interview replaces Algorithms atomically; no placeholder production cards (`DIRECT_OWNER_DECISION`) | Contract; docs 01, 07, 15, 16 |
| Language | English runtime plus dormant Polish plumbing | Launch application and content are English-only; later locales preserve evidence identity (`DIRECT_OWNER_DECISION`) | Contract; docs 01 and 07 |
| Observability and reports | No Firebase Analytics, Crashlytics, or content-report implementation | Fail-closed consent/privacy gate; closed event vocabulary; account-unlinked content reports with bounded context (`DIRECT_OWNER_DECISION`) | Contract; doc 09 |
| Backup | Platform backup exclusion exists; PITR is not enabled | Firestore seven-day PITR target, restore runbook and sandbox drill, tombstone reconciliation, no account resurrection; backup is disaster recovery only (`DIRECT_OWNER_DECISION`) | Contract; docs 08 and 09 |
| Platform | Expo 54, iOS 15.1/iPad, Light-only are current configuration facts | Expo 57; iOS 16.4+, iPhone only; Android API 28/36; portrait; Light/Dark/System; 200% text; signed phone smoke (`DIRECT_OWNER_DECISION`) | Contract; docs 05 and 12 |
| Design authority | Checked-in references record earlier approved implementation evidence | Figma is temporary authority during 3 → 2 → 1 exploration; only the owner approves actual visuals; after verified handoff repository tokens/assets/components, Storybook, tests, and baselines are operational authority (`DIRECT_OWNER_DECISION`) | Contract; docs 05 and 06 |

## Compatible current foundations

The following are `CURRENT_REPOSITORY_FACT` foundations to preserve for later implementation planning: the shared learning kernel and family runtimes; journal-first local durability and recovery; device-local session/draft/timer records; Firebase Admin token verification; deny-all direct Firestore client rules; Cloud Run HTTP boundary; revisioned/idempotent sync primitives; adoption preview/confirm primitives; deletion intent/proof primitives; environment isolation; and the content repository's canonical-source, checksum, immutable-release, provenance, and byte-verification pipeline.

The current account-wide active-session fields, cross-device session conflict logic, all-content-bundled delivery, two-track registry, visible category copy, Home and Language routes, and Light/iPad platform claims are implementation deltas, not target authority. Directive 3 owns their architecture classification and sequencing.

## Mutable provider facts checked

Checked on 2026-08-08 against primary provider documentation:

- [RevenueCat customer identity](https://www.revenuecat.com/docs/customers/identifying-customers) supports custom non-guessable App User IDs and cross-platform customer identity; [restore behavior](https://www.revenuecat.com/docs/projects/restore-behavior) is configurable. Patternly therefore owns the conflict experience and uses an opaque account ID, never email.
- Firebase supports [provider linking](https://firebase.google.com/docs/auth/web/account-linking) to one user and [revoked-token enforcement](https://firebase.google.com/docs/auth/admin/manage-sessions). Ordinary email action behavior remains provider-controlled; Patternly does not promise a fixed 30-minute Firebase expiry.
- [Firestore PITR](https://cloud.google.com/firestore/native/docs/pitr) retains data for seven days when enabled. Restore remains an operational recovery action and must reconcile deletion tombstones.
- [Cloud Storage signed URLs](https://cloud.google.com/storage/docs/access-control/signed-urls) are time-limited bearer access; [object generations and preconditions](https://cloud.google.com/storage/docs/request-preconditions) support immutable publication identity.
- [Expo SDK 57](https://docs.expo.dev/versions/latest/) targets Android API 36 and requires iOS 16.4 or later.
- Apple [account deletion guidance](https://developer.apple.com/support/offering-account-deletion-in-your-app/) and Google Play's [account-deletion requirement](https://support.google.com/googleplay/android-developer/answer/13327111) require truthful deletion paths and subscription disclosure; deleting a Patternly account is not represented as store cancellation or refund.

Provider capabilities are implementation constraints, not permanent product semantics unless the canonical contract expressly owns the behavior.

## Open external checkpoints

No unresolved product decision blocks this reconciliation. The following remain external checkpoints, not defaults:

- numeric monthly and annual prices and actual store product records;
- owner selection and approval of real Figma work;
- production domain, DNS, sender, store, signing, Apple/Google provider, and RevenueCat console configuration;
- authorization to enable PITR and execute a restore drill;
- any scheduler or cloud mutation described by historical PO-034.

Directive 3 will convert verified implementation deltas and these external checkpoints into one execution plan. This report must not be used as a second plan.

## Verification

The reconciled documentation and executable contract were checked from the application repository on 2026-08-08:

- `npm run qa:static` — passed outside the restricted sandbox: recovery inventory and Stage 1 boundaries passed, TypeScript passed, all 557 tests passed, content-boundary validation passed, and runtime-privacy-boundary validation passed. A sandboxed run first produced 23 `listen EPERM 127.0.0.1` failures in HTTP tests; those were environment restrictions rather than assertion failures and all passed when loopback binding was permitted.
- contract-change gate — passed against the staged change with 36 path entries (including both sides of the document 16 rename); the YAML change included the required schema, semantic parser, and canonical test companions.
- `npm run test:content-release-cross-repo` — passed 1/1; the application release lock still byte-matches the content repository manifest and bundle.
- focused canonical contract and contract-gate tests — passed 32/32, including the complete superseded-model negative table.
- Markdown relative-link scan — passed for all 50 Markdown files inspected.
- `git diff --check` — passed.
- deleted-path scan for the superseded document 16 filename outside retained directive/hygiene history — no live references.
- independent Directive 2 QA — passed after historical design evidence was made explicitly non-authoritative and direct owner decisions received complete semantic mutation coverage.

The content repository was inspected at the recorded baseline and was not modified. No application, server, content package, Figma, Storybook, provider, store, domain, build, or cloud mutation was performed.
