# Patternly — historical release-candidate status

> Historical RC evidence as of 2026-07-31. This file is not a current product
> contract or execution-status authority. Directive 2 reconciles the canonical
> documentation before Directive 3 regenerates the sole execution plan.

## Status — 2026-07-31

`CONTENT RELEASE PINNED / PRODUCT COMPLETION NO-GO`

The active objective is public launch readiness. Internal product tests run
independently and do not define release sequencing or public-launch approval.
The current evidence and complete product-to-launch sequence are in
[`launch-completion-plan.md`](launch-completion-plan.md). The narrower release
audit remains supporting evidence, not the active execution order.

## Bound content release

| Field | Value |
| --- | --- |
| Release | `patternly-core-0015` |
| Producer release commit | `d780204eba858c05b94fdbce8de38ec4c3900a50` |
| Content source commit | `9e23b08d051ac473436f27544b0dbfefeda496d6` |
| Algorithms | `algorithms-core-0008`; 2375 items; `2c6749d68c4c2c9f95bc4b9c4d21350df92776603648b2240fd1da39bb8d9adf` |
| Certification | `gcp-ace-0014`; 360 items; `f692d3878c12907cc1df7922a1eb6e5567757989450063dc9e495cebf4bd4042` |

No partial bank was published. The application release lock and bundled
content identify this exact coordinated release.

## Current verified facts

- The refactored canonical bank contains Algorithms 2,375 items and
  Certification 360 items.
- Fresh `patternly-content` verification passes 45/45 tests.
- The automated explanation audit inspects 2,735/2,735 items exactly once and
  keeps its form-risk signals advisory.
- Fresh application recovery inventory, typecheck, 407/407 tests,
  content-boundary and runtime-privacy-boundary pass.
- The pinned multi-track release exactly matches the producer manifest and
  application bundle.
- Android's merged release manifest targets API 36.

Manual item review is not a launch requirement. The repository does not use a
manual approval record as release authority.

## Work remaining before public launch

| Work | Status | Completion evidence required |
| --- | --- | --- |
| Complete route/state inventory | `done` | all 21 registered routes, embedded states and missing launch surfaces are classified in `launch-surface-inventory.md` |
| Competitive/category gap review | `done` | direct Algorithms, certification and adjacent learning products were compared; justified gaps are assigned in the launch plan |
| Account/data contract | `done` | completed vendor-neutral lifecycle, authority, adoption, offline, recovery and deletion contract passed independent QA; 25/25 focused and 407/407 full tests pass |
| Registration, sign-in and account lifecycle | `blocking` | no auth/account routes or service path exists in current source |
| Visual system and screen completion | `blocking` | one shell/header/state system; no clipping; complete entry, setup, outcome, review, progress and settings surfaces |
| Missing or misleading surfaces | `blocking` | privacy/support access completed; language and tablet contracts resolved; no retained non-functional route |
| Study Activity and content trust/reporting | `blocking` | durable history can be reopened; release/source context is visible; per-item problem reports reach a canonical correction path |
| Canonical Certification practice lifecycle | `blocking` | timer, leave/pause/resume, conflict, unanswered validation and truthful summary verified on both platforms |
| Android production signing | `blocking` | signed AAB using a production upload key / Play App Signing path |
| iOS distribution archive | `unknown / needs evidence` | validated signed archive and clean TestFlight install |
| Native configuration alignment | `partial` | one iOS minimum, tablet/orientation and appearance contract across config files |
| Public privacy and support | `blocking` | public URLs, in-app access and completed store declarations matching the binary |
| Store metadata and screenshots | `planned` | complete App Store and Play draft packet |
| Signed-artifact smoke | `planned` | physical-device verification of the actual store candidates |
| Future content-release validation | `partial` | both `validate:real:*` commands pass from a clean checkout |

Research-only checks and internal testing do not appear as public-launch gates.

## Canonical handoff

- Product contract: [`canonical-product-contract.yaml`](canonical-product-contract.yaml)
- Content rules: [`07-content-guidelines.md`](07-content-guidelines.md)
- Product decisions:
  [`product-owner-decision-register.md`](product-owner-decision-register.md)
- Product completion plan:
  [`launch-completion-plan.md`](launch-completion-plan.md)
- Complete launch surface inventory:
  [`launch-surface-inventory.md`](launch-surface-inventory.md)
- Competitive product gap audit:
  [`competitive-product-gap-audit.md`](competitive-product-gap-audit.md)
- Supporting launch audit:
  [`launch-readiness-audit.md`](launch-readiness-audit.md)
- Current content lock:
  [`../integration/contracts/content-release/release.lock.json`](../integration/contracts/content-release/release.lock.json)

The next work item is **Task 2 — canonical visual shell and component rules**
from the product completion plan. The route and competitive-gap discovery and
Task 1 contract are complete;
implementation tasks now perform bounded verification for their assigned
surfaces instead of requesting another app-wide audit. Known Certification
lifecycle and visual defects remain blocking inputs to later implementation
stages.
