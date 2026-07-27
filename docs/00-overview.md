# 00 — Overview

## Product

Patternly is a local, offline-first focus lab for technical decision practice. A track is a concrete content and learning domain, a track family defines the shared learning semantics for similar tracks, and a mode is a family-specific session configuration. The initial product contains Certification and Algorithms families; they are the first supported families, not a closed list of all future learning domains. The product does not provide an online judge, copied exam material, official certification status, user accounts, cloud synchronization, or a content feed.


## Track families and extension boundary

The shared kernel does not encode a fixed list of product tracks or concrete interaction payloads. A track instance supplies content, taxonomy, configuration, and family-specific metadata; its family runtime supplies selection, response validation, scoring, feedback composition, review policy, recommendations, and renderers.

The current structure is:

```txt
CertificationFamilyRuntime
├── gcp-ace
├── future Azure AI Fundamentals track
└── future AWS Solutions Architect Associate track

AlgorithmsFamilyRuntime
└── algorithms
```

Possible future families used to test extensibility are:

- `DatabaseReasoningFamilyRuntime` with a `sql-and-data-reasoning` track;
- `CodeReasoningFamilyRuntime` with a `debugging-and-code-review` track;
- `SystemDesignFamilyRuntime` with a `backend-system-design` track.

These are architecture examples and future candidates, not committed release scope. Adding a new track inside an existing family must not require changes to the shared kernel, persistence subsystem, or session shell. Adding a genuinely new family may add a family runtime and interaction handlers, but it must not introduce a parallel session lifecycle, storage path, or track-specific branch in shared screens.

## Canonical session modes

`canonical-product-contract.yaml` supplies all user-facing modes and their configuration. Progress never locks a mode; it supplies an evidence-based recommendation and the learner may choose another supported configuration.

## Product loop

```txt
choose track and mode → select a bounded session → attempt → receive authored feedback
→ create evidence and review obligations → choose the next explained action
```

The product shows only metrics that answer a training question, change a training decision, and have enough evidence. It does not collect confidence or display synthetic readiness, retention, or mastery percentages.

## Content and feedback

Every instructional item has concise immediate `Reason` and collapsed, complete `Details`, available after correct, partial, and incorrect attempts. Choice-item wrong options have authored explanations keyed by stable option ID. Patternly corrects content in place: it does not retain obsolete explanations to reconstruct local history.

Algorithms batches teach one mental unit at a time: active roadmap units, then highest false-heuristic risk, then contrasts and mistake diagnosis, then remaining foundations and mechanics. Certification remediation batches by competency area and then topic. All active content is audited in canonical source and released with matching technical evidence.

## Persistence and recovery rule

The target is one MMKV client, imported only by infrastructure, and one set of repositories. Historical local data, old keys, old read/write APIs, and Cloud write-through are deleted; they are not migrated or translated. A content version identifies the active bank only.

If an existing model, record, flow, or module cannot move into the canonical structure without preserving obsolete semantics, delete it. Do not create fallbacks, translators, compatibility adapters, or parallel paths. Backward compatibility is not required for pre-production storage, content, or runtime models. An explicit runtime failure is a valuable signal that migration work remains; it must not be hidden by defaults or by reading the old system.

## Certification boundary

Each certification track instance owns a versioned `ExamExperienceProfile` sourced from an official public guide and dated when checked. Patternly mirrors only documented official behaviour and never implies affiliation, official scoring, or a pass/fail outcome.

## Documentation authority

`canonical-product-contract.yaml` is the sole normative product-behavior contract. Documents `00`–`13` and `15`–`17` provide narrative context and cannot override it. `docs/plan.md` is the sole repository execution-order source.
