# 11 — Implementation Guidelines

## Mandatory recovery rule

If an existing model, record, flow, or module cannot be moved into the canonical structure without preserving obsolete semantics, delete it. Do not create fallbacks, translators, compatibility adapters, or parallel paths. Backward compatibility is not required for pre-production storage, content, or runtime models. An explicit runtime failure is a valuable signal that migration work remains; it must not be hidden by substituting defaults or reading the old system.

Implementation must therefore migrate ownership or delete the old path. It must not add default topic/item/answer values, dual reads/writes, an old storage bridge, a translator, a permanent status flag, a hidden catch-and-continue branch, or a second authoritative runtime.

## Boundaries

- The shared kernel owns lifecycle, canonical attempts, journal commands, and repository contracts.
- Family runtime owns payload validation, selection, scoring, review policy, and deterministic recommendations.
- UI renders explicit states and dispatches commands; it does not contain policy, scoring, or storage logic.
- Infrastructure alone imports MMKV. Use one client and one repository set. Delete AsyncStorage access rather than wrapping it.
- Static content owns authored feedback and answer contracts. Runtime never writes educational explanations.

## Contract implementation

Validate unknown IDs and unsupported payloads at the boundary and fail explicitly. Persist durable submit intent before feedback or advance. Keep attempts immutable and retry idempotent. Persist only committed state, session/item/option order, and foreground timer state; never unsubmitted selection.

Implement only the specified modes and score contracts. Ordering scores correct adjacent relations. Complexity is content-defined. Reinsert exists only in `Guided Practice` and Algorithms `Weak Area Review`, maximum once and with compatible reviewed content.

Certification simulations read the owning track's `ExamExperienceProfile`; no global duration or inferred behavior is allowed. If a required visual design is absent, stop and obtain a reference. Codex must not design a new interaction as an implementation shortcut.

## Completion discipline

Every change includes a dead-code check for old imports, storage keys, read/write paths, duplicate routes, obsolete tests, stale docs, unused types, and hidden default branches. Tests must prove removal or explicit failure, not a successful substitute.
