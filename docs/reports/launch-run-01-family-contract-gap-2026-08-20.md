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

## Current revalidation — 2026-08-21

The content repository remains at HEAD
`12b99c78e03ec6c58964d7f83d11d1b50af08467`; the application remains at HEAD
`19b6601e19e1888ffce1449dd5e54ca5df4f8996`. Current candidate-bank validators
report the following interaction inventories:

| Track | Items | Interaction inventory | Admission |
| --- | ---: | --- | --- |
| Backend System Design | 1,569 | `choice`: 1,569 | runtime/publishing `not_admitted`, human review `pending` |
| Frontend System Design | 1,766 | `choice`: 601; `ordering`: 1,018; `decision_matrix`: 147 | runtime/publishing `not_admitted`, human review `pending` |
| Object-Oriented Design | 1,413 | `choice`: 1,413 | runtime/publishing `not_admitted`, human review `pending` |

The registered `design_interview` authoring family supports only `choice` with
`single` or `multiple` selection. Its source schema fixes interaction and
scoring to `choice` and `exact_selected_set_with_partial_v1`. The Frontend
candidate source instead declares
`frontend-system-design-interview-candidate-source-v1` and `familyId:
system_design`, with rich interaction validation owned by the Frontend
candidate-bank validator. `validateAuthoringContracts` intentionally keeps
all three Design banks behind the inactive/not-admitted/unapproved candidate
boundary rather than promoting them through the Design authoring schema.

The app still has no `DesignFamilyRuntime`, Design interaction dispatch, or
Design package profile. Track descriptors remain catalogue metadata and do
not provide executable runtime behavior.

## Decision

RUN-01 is no longer blocked by LR-01. It remains blocked by the missing `design_interview` family contract, interaction/scoring adapter boundary, and package schema/runtime support. No app or content runtime code was changed in this reconciliation. Adding a Design family union, package, selector, or registry entry before those contracts and executable content exist would create a false production path and violate the immutable package admission rules.

Do not add `ordering` and `decision_matrix` to the family registration in
isolation, and do not copy the Frontend candidate schema into Backend or
Object-Oriented Design. The canonical next slice must first select one family
source identity and define the interaction, scoring, feedback, persistence,
and accessibility semantics for all supported Design types.

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
- `npm run authoring:validate`: PASS; 10 registrations and 838 existing source JSON files remain schema-valid.
- `npm run validate:frontend-bank`: PASS; 1,766 items and 1,165 rich interaction items, admission remains closed.
- `npm run validate:backend-system-design`: PASS; 1,569 items, admission remains closed.
- `npm run validate:object-oriented-design`: PASS; 1,413 items, admission remains closed.

## Remaining risks

- Design Interview requires an approved executable content package before runtime admission can be tested.
- AWS and the remaining Certification tracks have separate immutable-input blockers and are not implied by this RUN-01 reconciliation.
- Maestro evidence currently covers the implemented shared shell and Coding/Certification paths on iOS; Design-specific Maestro evidence must wait for the first executable Design runtime.
