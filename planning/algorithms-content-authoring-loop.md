# Algorithms Content Authoring Loop

Status: active planning document

## Goal

Build, review, and integrate production-quality Algorithms content in a repeatable topic loop: mental-model design, TypeScript authoring structure, real questions, content-quality review, correction, then the next topic.

## Decision Scope

This plan covers the manifest-order interpretation of `contrast-hash-map-vs-sorting` through `two-pointers`, inclusive: 21 content groups. The owner confirmed this interpretation.

Code implementation is intentionally outside this planning document. The first implementation loop must resolve the content-format contract before any topic-level authoring begins.

## Confirmed Facts

| Area | Status | Evidence |
| --- | --- | --- |
| Manifest records a stable `questions.json` logical key and public item order | done | `src/tracks/algorithms/content/manifest.json` |
| Bit manipulation demonstrates the TypeScript split-group pattern | done | `src/tracks/algorithms/content/items/bit-manipulation/index.ts` |
| New and reauthored groups use TypeScript files; physical `questions.json` files are not created | planned | owner decision and `docs/content/algorithms-content-pack.md` |
| Contrast binary-search content has been split into TypeScript files but needs loader, manifest, and item-order integration | partial | `src/tracks/algorithms/content/items/contrast-binary-search-vs-linear-scan/` |
| Bit manipulation has 140 imported TypeScript items but manifest metadata and taxonomy are not synchronized | blocking | current `npm test` output |
| Existing counts below are manifest metadata, not a quality verdict | done | `src/tracks/algorithms/content/manifest.json` |

## Canonical Content Contract Blocker

The TypeScript-per-topic workflow follows the existing `bit-manipulation` pattern. A reauthored group exposes `index.ts` to the loader and contains focused TypeScript topic files; it has no physical `questions.json`. The manifest keeps `items/<group>/questions.json` only as the stable logical key already required by the generic content-pack validator and public item-order contract.

No topic loop may expose a new TypeScript group until the contrast-binary reference implementation is registered and `npm run typecheck` passes.

## Topic Portfolio

The following targets are planning baselines, not evidence that content already exists. Existing groups with 30–40 items are quality-audit and gap-repair work; sparse groups require full content creation. Target totals are chosen to support multiple mental-model units without turning the topic into a bulk quiz set.

| Topic | Current | Planned target | Mental models to cover |
| --- | ---: | ---: | --- |
| contrast-hash-map-vs-sorting | 2 | 24 | direct lookup state vs order-revealing transform; duplicates; original-index contract; one vs many queries |
| contrast-sliding-window-vs-prefix-sums | 3 | 24 | contiguous maintainable state; negative-number failure; prefix history; query reuse |
| contrast-stack-vs-monotonic-stack-intro | 2 | 20 | latest unresolved item; monotonic eviction; next-greater signal; duplicates and equal values |
| contrast-two-pointers-vs-sliding-window | 2 | 24 | pair boundary elimination; contiguous range state; pointer movement signal; output contract |
| dynamic-programming-intro | 1 | 24 | state definition; transition; base case; overlapping subproblems; state-order correctness |
| graph-traversal | 1 | 24 | adjacency model; visited invariant; component traversal; BFS vs DFS goal; cycle safety |
| greedy-intro | 1 | 20 | local-choice signal; exchange or counterexample reasoning; sorting as preparation; when greedy is invalid |
| hash-map-and-set | 40 | 40 | lookup key; presence vs frequency; complement state; duplicate and reuse contracts; cost |
| heap-priority-queue | 1 | 20 | repeated extreme; heap invariant; top-k boundary; update cost; ties |
| intervals | 1 | 24 | overlap predicate; endpoint order; merge invariant; sorting prerequisite; touching boundaries |
| linked-list | 1 | 20 | node references; rewiring order; dummy node; slow/fast state; null boundaries |
| math-and-geometry | 1 | 20 | numeric invariant; modular state; coordinate representation; sign and overflow boundaries |
| mixed-pattern-practice | 35 | 35 | unlabeled signal recognition; competing approaches; constraint-first rejection; mistake transfer |
| prefix-sums | 35 | 35 | accumulated range state; prefix lookup; negative values; initialization; range-query tradeoffs |
| recursion-basics | 1 | 20 | base case; decomposition; call-state versus global state; return composition; stack depth |
| sliding-window | 40 | 40 | fixed and variable windows; window invariant; expansion and shrink rules; negative-value boundary |
| sorting-based | 5 | 24 | ordering reveals structure; sorting cost; index preservation; sort-plus-scan; custom order |
| stack | 30 | 30 | LIFO unresolved state; push/pop invariant; nested validation; previous state; empty stack |
| strategy-selection-core | 35 | 35 | constraints; data shape; output contract; complexity tradeoffs; rejected alternatives |
| tree-traversal | 1 | 20 | traversal order; recursive state; path versus global aggregation; null children; BFS/DFS selection |
| two-pointers | 35 | 35 | opposite ends; same direction; sorted elimination; duplicates; pointer-progress invariant |

## Topic Loop Template

Each topic receives a separate, independently reviewable implementation task using this exact sequence.

1. Mental-model packet: define 4–6 distinct learner decisions, target count by model, allowed item types, key misconceptions, and non-goals.
2. Canonical file structure: create the approved files with planning comments that name each mental-model unit and its target count. Do not create runtime-visible empty groups.
3. Production content: add real items with one primary skill atom, explicit decision signal, distinct distractor feedback, taxonomy refs, and active micro-checks.
4. Topic quality audit: verify factual accuracy, prompt-to-micro-check alignment, duplicate concepts, difficulty mix, taxonomy balance, and runtime contract.
5. Correction pass: resolve all P1/P2 content findings before marking the topic done.
6. Integration and report: update canonical loader/manifest/order only after the topic passes validation; report count, quality findings fixed, checks, and residual risk.

## Implementation-Ready Tasks

### T0 — Establish the canonical TypeScript content contract

- Goal: establish the canonical TypeScript split-group pattern before further authoring.
- Scope: contrast-binary-search group, Algorithms loader, manifest, item order, and `docs/content/algorithms-content-pack.md`.
- Non-goals: adding questions to any other topic.
- Inputs: current split contrast-binary files, deleted JSON file, loader imports, manifest, content-pack guide.
- Acceptance criteria: `index.ts` is the physical source; no physical `questions.json` remains in the reauthored group; loader imports the TypeScript aggregator; manifest counts and item order match loaded items; typecheck passes.
- Verification: `npm run typecheck`, Algorithms content tests, aggregate curriculum validation, manifest/item-order checks.
- Required evidence: changed loader/manifest/docs and clean check output.
- Risks: updating a split group can alter public item order and session selection; preserve stable IDs and order explicitly.
- Report target: `planning/algorithms-content-authoring-loop.md` status update plus concise implementation report.

### T1 — Per-topic mental-model and count packet

- Goal: convert one row of the portfolio into a topic-specific authoring plan before content changes.
- Scope: roadmap node, taxonomy atoms and variants, existing topic content, tests, and canonical file layout.
- Non-goals: editing another topic or broad taxonomy refactors.
- Inputs: roadmap objectives, existing questions, target baseline above, current validation rules.
- Acceptance criteria: named mental models, target counts per file, item-type mix, mistakes to diagnose, explicit exclusions, and no overlap with adjacent topics.
- Verification: source review against roadmap/taxonomy and a duplicate-coverage check against adjacent groups.
- Required evidence: a concise plan comment or topic packet checked into the canonical authoring path.
- Risks: superficial difficulty buckets, duplicate content between contrast and mechanics topics, unsupported skill atoms.
- Report target: topic implementation report.

### T2 — Per-topic authoring, QA, correction, and integration

- Goal: deliver one complete topic through the six-step loop above.
- Scope: only the selected topic's canonical files and required loader/manifest/order entries.
- Non-goals: unrelated content, runtime behavior changes outside the canonical content-format work, and speculative taxonomy expansion.
- Inputs: accepted T0 contract and T1 packet.
- Acceptance criteria: target count met; factual review has no P1/P2 findings; every active item validates; all required item types are represented; feedback is specific; runtime group is registered.
- Verification: topic aggregate validation, duplicate ID/prompt audit, curriculum validation, `npm run typecheck`, `npm test`, and `npm run validate:questions` where applicable.
- Required evidence: question-count report, validation output, review findings and fixes, and final diff scope.
- Risks: regression in manifest order, misleading complexity claims, fake contrast items, and overlong bank with repeated mental models.
- Report target: topic completion report and this plan's status table.

## Execution Order After T0

Use roadmap dependency order, not manifest alphabetic order, for implementation:

1. `hash-map-and-set`, `two-pointers`, `sliding-window`, `prefix-sums`, `sorting-based`, `stack`, `strategy-selection-core`.
2. The four contrast topics, starting with `contrast-hash-map-vs-sorting`.
3. `linked-list`, `recursion-basics`, `tree-traversal`, `heap-priority-queue`, `intervals`, `graph-traversal`, `greedy-intro`, `dynamic-programming-intro`, `math-and-geometry`.
4. `mixed-pattern-practice` only after its prerequisite contrast topics pass QA.

## First Next Task

T0 is first because it repairs a current runtime failure and establishes the only safe path for the requested TypeScript authoring loop. Starting `contrast-hash-map-vs-sorting` before T0 would repeat the existing split-brain content structure.

T0 now requires an owner decision about the out-of-scope bit-manipulation blocker: include its manifest, item-order, and taxonomy repair in T0, or continue the 21-topic loop with a known failing full-suite gate.

## Verification Reviewed

- `src/tracks/algorithms/content/index.ts`
- `src/tracks/algorithms/content/manifest.json`
- `src/tracks/algorithms/algorithmRoadmap.ts`
- `src/tracks/algorithms/algorithmContentQuality.ts`
- `docs/content/algorithms-content-pack.md`
- `docs/07-content-guidelines.md`
- `docs/16-leetcode-like-learning-system.md`
- Current worktree and prior `npm run typecheck` output

## Remaining Risks

- Scope phrase can mean either 21 manifest-order groups or eight roadmap-order groups.
- Existing unsplit groups still have physical JSON sources and must be migrated one topic at a time.
- Current contrast-binary split must complete T0 before it becomes the template for the remaining 21 groups.
- Bit manipulation currently prevents the full Algorithms content loader from passing runtime validation even though it demonstrates the desired physical TypeScript structure.
