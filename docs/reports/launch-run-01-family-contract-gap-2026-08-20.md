# RUN-01 family contract gap — 2026-08-20

Status: `blocking`

## Objective

Reconcile the RUN-01 dependency after LR-01 was rebaselined and verified, while preserving the canonical three-family launch model and avoiding fake Design Interview admission.

## Confirmed repository facts

| Area | Status | Evidence |
| --- | --- | --- |
| LR-01 sentinel | `done` | [launch-lr-002-sentinel-rebaseline-2026-08-20.md](launch-lr-002-sentinel-rebaseline-2026-08-20.md); pushed app SHA and green exact-SHA CI are recorded there. |
| Family-neutral kernel envelopes | `done` | `src/domain/learning/familyEnvelope.ts` and `tests/familyNeutralKernelExtension.test.ts` carry family-owned payload, response/result, and review evidence without a global payload union. |
| Canonical track projection | `partial` | `src/domain/tracks/trackAdmission.ts` defines the three internal families and eight track descriptors, but `CURRENT_PRODUCTION_TRACK_ARTIFACT_EVIDENCE` contains only Coding Interview, GCP, and AZ-104. The descriptors are explicitly a non-production projection. |
| App package family contract | `blocking` | `src/content/contracts/contentPackage.ts` and `src/content/application/contentPackageResolver.ts` accept only `coding_interview` and `certification`; canonical runner validation is implemented only for those two families. |
| Design Interview content execution | `blocking` | `patternly-content/config/families/design_interview.json` records `currentExecutableCapacity: 0` for every Design node and states that authoring-feasible records remain non-executable before runtime exists. |
| Free-node package construction | `blocking` | `patternly-content/scripts/product/free-node-inventory.mjs` has selectors only for Coding and Certification; unsupported families fail with `UNSUPPORTED_FREE_NODE_SELECTOR`. |
| Design package inventory | `blocking` | The generated app package inventory contains no Design Interview package, and the content repository has no canonical Design `config/tracks`/Free-node package profile that could be admitted safely. |

## Decision

RUN-01 is no longer blocked by LR-01. It remains blocked by the missing `design_interview` family contract, interaction/scoring adapter boundary, and package schema/runtime support. No app or content runtime code was changed in this reconciliation. Adding a Design family union, package, selector, or registry entry before those contracts and executable content exist would create a false production path and violate the immutable package admission rules.

## Implementation-ready next task

Define and implement the canonical `design_interview` family contract as one coherent slice across the app and content repositories:

- specify supported interaction adapters, scoring semantics, progress dimensions, review evidence, simulation rules, and node-local package identity;
- extend the verified package schema/resolver only after those semantics are explicit;
- add the first executable Backend System Design package from approved content, without routing it through Certification semantics;
- add focused contract tests and a Maestro path capture for the first Design flow.

Non-goals: do not create placeholder Design packages, do not mark authoring-only records executable, do not add provider-specific or backend-only lifecycle branches, and do not change user-visible family labels.

## Verification performed

- Read the current app package contracts/resolver and track admission source.
- Read the current `design_interview` family configuration and package-builder selectors in `patternly-content`.
- Confirmed the stale LR-01 dependency in the launch plan and reconciled it here.

## Remaining risks

- Design Interview requires an approved executable content package before runtime admission can be tested.
- AWS and the remaining Certification tracks have separate immutable-input blockers and are not implied by this RUN-01 reconciliation.
- Maestro evidence currently covers the implemented shared shell and Coding/Certification paths on iOS; Design-specific Maestro evidence must wait for the first executable Design runtime.
