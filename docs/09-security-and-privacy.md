# 09 — Security and Privacy

## Data boundary

Patternly stores only local learning data necessary for sessions, committed attempts, review evidence, progress evidence, settings, and active-session recovery. It does not need accounts, identity profiles, cloud synchronization, confidence collection, or synthetic readiness metrics.

MMKV is an infrastructure boundary, not a domain dependency. One infrastructure client and repository set own local persistence. Old local data and old storage access are deleted rather than carried into the target. A reset deletes canonical local learning records.

## Content and exam provenance

Active content is original or appropriately sourced, with human review. Certification profiles retain official public `sourceUrl`, `sourceCheckedAt`, and optional guide version so the claimed simulation behaviour can be audited. A track with unclear official rules cannot claim faithful simulation.

## Product safety

Missing content, profile, or storage state is shown as an explicit error. The product never supplies an invented default answer, topic, or result. Do not retain obsolete local records or hidden translations because they can misstate learning evidence.

## Communication and affiliation

Patternly is independent. Certification provider names and trademarks are descriptive only; the app does not claim endorsement, official scores, or pass/fail outcomes. Diagnostic results and Patternly-defined practice thresholds are clearly distinguished from official decisions.
