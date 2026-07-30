# Patternly — current product status

## Status — 2026-07-30

`RELEASE VERIFIED / FULL AUDIT PENDING / USER-TESTING HOLD`

This is the only retained execution-status document. Raw audit reports,
screenshots, logs and historical build artifacts are intentionally not
canonical: regenerate them against the then-current source whenever a new audit
or release decision starts.

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

## Durable verified facts

- Algorithms 2375/2375 and Certification 360/360 received item-level manual
  review before release `0015`.
- At release closure, `patternly-content` passed 45/45 architecture tests;
  Algorithms source inspection covered 2375 items in 213 batches without
  diagnostics.
- At the 2026-07-30 application baseline, recovery inventory, typecheck,
  400/400 tests, content-boundary, runtime-privacy-boundary and the cross-repo
  release contract passed.
- The exact ten-item Algorithms research journey passed twice consecutively on
  iOS and twice on Android. Current-release light, dark and larger-text
  represented states had no open visual P0–P3 finding.
- Participant-build identity schema 1 covered 279 build-affecting inputs and
  produced SHA-256
  `6c113edc3bbbfdd716d48385b5356a35eb1b22932084287b3a2e896a863bf646`.
  Documentation, tests and evidence artifacts are outside that digest.

These are dated baseline facts, not permission to reuse old evidence after a
source change. The next full audit must rerun every applicable gate.

## Durable product decisions

- The active visual direction is Option 3 — Quiet Layered: few elements,
  generous space and only decision-relevant information. Option 1 contributes
  only the one-dominant-action hierarchy rule.
- The first research cohort uses English product content and a notes-only data
  model with no screen, audio or video recording.
- The current product is local-first, with no account, sync, billing or hidden
  fallback path.
- Only Algorithms and Google Cloud Associate Cloud Engineer are active.
  Future tracks remain deferred until evidence from the first cohort.

The canonical rationale and triggers remain in
[`product-owner-decision-register.md`](product-owner-decision-register.md).

## Work remaining before user testing

| Work | Status | Completion evidence required |
| --- | --- | --- |
| New full product audit | `planned` | Fresh functional, visual, accessibility, publication and device evidence against the post-cleanup source |
| Manual VoiceOver traversal | `blocking` | Completed iOS rows in [`pre-recruitment-acceptance.md`](user-testing/pre-recruitment-acceptance.md) |
| Manual TalkBack traversal | `blocking` | Completed Android rows in the same acceptance record |
| Timed human dry-run | `blocking` | One 45–60 minute run with a person uninvolved in implementation |
| Research operations | `blocking` | Real participant contact, approved note storage, compensation rules and applicable privacy notice |
| Final readiness decision | `blocking` | Explicit owner GO after every required gate passes |

Do not recruit participants or describe Patternly as ready until the final
decision is `GO`.

## Canonical handoff

- Product contract: [`canonical-product-contract.yaml`](canonical-product-contract.yaml)
- Content rules: [`07-content-guidelines.md`](07-content-guidelines.md)
- Product decisions:
  [`product-owner-decision-register.md`](product-owner-decision-register.md)
- Research packet: [`user-testing/README.md`](user-testing/README.md)
- Manual acceptance:
  [`user-testing/pre-recruitment-acceptance.md`](user-testing/pre-recruitment-acceptance.md)
- Current content lock:
  [`../integration/contracts/content-release/release.lock.json`](../integration/contracts/content-release/release.lock.json)

The next work item is the owner-requested full audit. It must treat this status
as orientation only and repository evidence as authoritative.
