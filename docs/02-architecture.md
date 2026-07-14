# 02 — Architecture

## Canonical structure

```txt
application composition root
  → shared learning kernel
  → track-family runtime
  → track instance and active content bank
  → repository contracts
  → MMKV infrastructure
```

The shared learning kernel owns session lifecycle, immutable attempts, canonical results, review mutation commands, evidence aggregation contracts, and repository interfaces. It is family-agnostic: it does not know certification domains, Algorithms patterns, item renderers, or a global list of interaction types.

`CertificationFamilyRuntime` owns certification scoring, competency evidence, practice semantics, and profile-driven simulation. `AlgorithmsFamilyRuntime` owns mental units, taxonomy evidence, choice/ordering/complexity interactions, and algorithmic review policy. A new track is an instance of a family, not a new parallel runtime.

## Ownership and dependencies

UI dispatches application commands and renders states; it does not score, select review items, write storage, or improvise feedback. Family runtimes validate payloads, select items, score them, and build deterministic outcomes. Repositories persist canonical records but do not interpret item payloads. Infrastructure alone imports MMKV and constructs one storage client; no screen, domain module, or track imports it.

The track instance owns a versioned `ExamExperienceProfile` for every certification simulation. The profile contains source URL, checked date, optional guide version, duration, question count or range, navigation, answer-change, flagging, navigator, section, and automatic-final-submit policy. The kernel stores the profile reference and applies the family runtime; it never supplies global exam defaults.

## Review and content ownership

A review record carries a source item reference plus skill, competency, or taxonomy evidence. A family may choose an exact item, reviewed variant, contrast item, or repair item; it cannot widen taxonomy silently or fabricate a generic substitute. Active content is content-versioned but the version identifies only the active bank.

## Required recovery rule

If an existing model, record, flow, or module cannot be moved into the canonical structure without preserving obsolete semantics, delete it. Do not create fallbacks, translators, compatibility adapters, or parallel paths. Backward compatibility is not required for pre-production storage, content, or runtime models. An explicit runtime failure is a valuable signal that migration work remains; it must not be hidden by substituting defaults or reading the old system.

Consequently, the target has no AsyncStorage read path, no dual storage writer, no historical record translator, no old-and-new authoritative module pair, and no permanent status flags that disguise an unfinished replacement. Unknown IDs, unsupported payloads, and absent content fail explicitly.

## Error boundary

Preparation, content resolution, profile resolution, and repository failures are visible unavailable/error states. A runtime failure is actionable evidence for implementation work; it must not turn into a default topic, item, answer, score, or review outcome.

## Current repository fact

Current source still contains older storage and training models. That is implementation work to remove, not an architectural exception to this document.
