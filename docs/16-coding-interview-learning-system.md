# 16 — Coding Interview Learning System

## Purpose and scope

This document owns the internal `coding_interview` family learning semantics for the learner-visible target track **Coding Interview: DSA & Problem Solving**. It elaborates `canonical-product-contract.yaml` and cannot override it. The former Algorithms identity must migrate atomically across application and content repositories; this document does not authorize a permanent alias.

It describes:

- the Coding Interview taxonomy;
- Coding Interview practice blueprints;
- semantics of the eight Coding Interview modes;
- Coding Interview item selection;
- mental-unit sequencing;
- pattern and strategy discrimination;
- family-specific scoring interpretation;
- algorithmic review selection and reinsert policy;
- family-specific evidence interpretation;
- Coding Interview recommendation rules;
- `Interview Simulation` learning semantics;
- Coding Interview-specific content requirements.

It does not redefine:

- shared session lifecycle;
- repository implementation;
- mutation-journal mechanics;
- generic review-resolution mechanics;
- generic `Reason` and `Details` structure;
- shared UI components;
- security and privacy boundaries.

Those shared concerns remain defined by the canonical product contract.

## Product boundary

Coding Interview is a strategy-first learning family.

It is not:

- an online judge;
- a code-execution environment;
- a complete coding course;
- a clone of an external interview platform;
- a source of official interview outcomes;
- proof of interview readiness.

Patternly trains the decisions that precede and guide implementation:

```txt
recognize the relevant structure
→ identify constraints and preconditions
→ select an approach
→ define state and invariant
→ order the operations
→ justify correctness
→ derive complexity
→ produce an implementation plan with data structures, invariants, operation order, and edge cases
→ distinguish the approach from plausible alternatives
→ transfer the reasoning to a related problem
```

The product may use pseudocode, traces, snippets, diagrams, ordering, and complexity interactions, but it does not require executable code submission.

## Scientific basis

Patternly uses findings from cognitive science and computing-education research as design constraints. These findings support general mechanisms; they do not constitute experimental validation of the complete Patternly product.

### Retrieval practice

Retrieving information or a decision rule from memory can produce better delayed retention than additional restudy. Retrieval can also support transfer, particularly when learners retrieve and apply knowledge across varied examples rather than merely repeat identical questions.

Coding Interview practice therefore requires an active decision before instructional feedback is shown. Passive rereading of an explanation is not the default learning loop.

Retrieval alone is not sufficient evidence of transferable understanding. Selection must vary surface form, constraints, and application while preserving the underlying mechanism.

### Spacing and successive retrieval

Distributed practice generally produces stronger delayed retention than the same practice massed into one period. The most effective spacing interval depends on the intended retention interval; research does not provide one universal review schedule for every learning target.

Coding Interview review therefore distinguishes:

- immediate correction;
- later due retrieval;
- repeated success after the due time.

A correction shortly after an error does not by itself prove durable learning.

### Worked examples and reduced search

Worked examples can reduce unproductive problem-solving search while learners are acquiring a new procedure or schema. Their benefit is strongest when examples expose the structural reasoning rather than only the final answer.

Programming-education studies suggest that subgoal-labelled examples can help learners organize procedures around the purpose of groups of steps and can improve performance or transfer in some programming contexts. Longer-term course research has also reported benefits, although these findings do not imply that every subgoal implementation will work for every learner or topic.

`Learn Approach` therefore makes the following structure explicit:

- applicability signal;
- preconditions;
- invariant;
- maintained state;
- decisive operation;
- correctness mechanism;
- complexity consequence;
- failure boundary.

It does not merely show a finished solution.

### Fading guidance

A smooth transition from examples to increasingly incomplete examples and then independent problem solving can support schema acquisition. Guidance that is useful for novices can become redundant as knowledge increases, so Patternly reduces explicit cues across learning stages rather than treating maximum explanation as permanently optimal.

Patternly does not infer a learner’s expertise from one score. Fading is implemented through declared content stages and explained recommendations, not through a hidden mastery estimate.

### Self-explanation

Learners who explain why solution steps follow from principles tend to extract more structural knowledge from examples than learners who focus only on surface steps.

Patternly supports this mechanism through items that require learners to identify:

- why a step is necessary;
- which invariant it preserves;
- which state changes;
- which precondition makes the approach valid;
- why a tempting alternative fails.

Patternly does not require free-form self-explanation in the current interaction contract. It approximates targeted self-explanation through authored decision, ordering, contrast, and reasoning items.

### Contrast and interleaving

Interleaving related categories can improve discrimination when learners need to choose between plausible alternatives. Contrasting cases can help make decisive structural differences more noticeable than studying one category in isolation.

Coding Interview `Contrast Practice` therefore places closely competing strategies or variants into explicit comparison. `Independent Practice` interleaves previously introduced mental units so that the learner must identify the applicable strategy rather than follow a visible topic cue.

Interleaving is not used indiscriminately. Initial acquisition remains more bounded because comparison is useful only when the learner has enough knowledge to represent the alternatives being compared.

### Corrective feedback

Multiple-choice testing can reinforce false alternatives when learners select plausible distractors without receiving correction. Corrective feedback can reduce this risk while retaining the benefits of retrieval practice.

Every non-simulation Coding Interview mode therefore provides authored feedback after durable submission.

Feedback must explain the relevant mechanism and selected misconception. Merely displaying the correct option is insufficient.

### Learning versus current performance

Performance observed during practice is not equivalent to durable learning. Highly supported, blocked, or massed practice may improve immediate success without proving later retrieval, discrimination, or transfer.

Patternly therefore separates:

- evidence volume;
- learning-stage evidence;
- performance signals;
- due retrieval;
- repeated mistake evidence.

It does not infer readiness, retention, or mastery from a recent percentage.

## Limits of the scientific evidence

Research supports the learning mechanisms above. It does not prescribe:

- Patternly’s declared mode configuration;
- session sizing, timing, review, or reinsert policy;
- the exact taxonomy;
- recommendation thresholds;
- the proportion of item types within a session.

These are Patternly product decisions.

They must be:

- explicit;
- versioned;
- deterministic;
- testable;
- revisable from product evidence.

Patternly does not claim that using these mechanisms guarantees interview success.

## Coding Interview taxonomy

Coding Interview content is organized as:

```txt
roadmap node
→ mental unit
→ pattern family
→ pattern variant
→ problem archetype
→ skill atom
```

### Roadmap node

A roadmap node is the learner-facing topic or contrast area shown in the Coding Interview roadmap.

A node may contain one or more mental units, but a practice batch must identify which mental unit is primary.

### Mental unit

A mental unit is the smallest coherent reasoning structure that should be learned and diagnosed together.

A mental unit may define:

- an applicability signal;
- relevant constraints;
- preconditions;
- invariant;
- maintained state;
- legal operations;
- answer-timing rule;
- correctness argument;
- complexity consequence;
- common false heuristic.

Examples of separate mental units include:

- recognizing when a fixed-size window applies;
- maintaining a variable-window validity invariant;
- distinguishing lower bound from exact search;
- controlling duplicates in backtracking;
- choosing state for a recursive search.

A mental unit is not merely a source-code file or a broad algorithm label.

### Pattern family and variant

A pattern family groups related solution structures.

A variant identifies a meaningful change in:

- precondition;
- state;
- invariant;
- boundary;
- traversal direction;
- stopping condition;
- answer contract.

Variants must not be created solely for cosmetic differences.

### Problem archetype

A problem archetype describes the recurring problem structure to which a pattern or strategy may apply.

Archetypes are used to vary surface context while preserving the underlying decision mechanism.

### Skill atom

A skill atom identifies one observable reasoning action.

Examples include:

- recognize a monotonic predicate;
- choose a half-open interval;
- update the outgoing window state;
- derive amortized stack complexity;
- identify the recursive state;
- distinguish permutation duplicate control from subset duplicate control;
- determine when an answer is recorded.

An instructional item has one primary skill atom.

Secondary skill atoms may provide context but must not make the item diagnostically ambiguous.

## Coding Interview track instance

The Coding Interview: DSA & Problem Solving track instance owns:

- roadmap;
- taxonomy;
- active content manifest;
- active content bank;
- content version;
- `CodingInterviewPracticeBlueprint`;
- `CodingInterviewRecommendationPolicy`;
- `CodingInterviewSimulationProfile`;
- supported interaction types.

```ts
type CodingInterviewMode =
  | "Learn Approach"
  | "Guided Practice"
  | "Custom Practice"
  | "Recognize Patterns"
  | "Contrast Practice"
  | "Weak Area Review"
  | "Independent Practice"
  | "Interview Simulation";

type CodingInterviewPracticeBlueprint = {
  blueprintId: string;
  blueprintVersion: string;
  supportedLengthsByMode: Readonly<Record<CodingInterviewMode, readonly number[]>>;
  modeStageDistribution: Readonly<
    Partial<Record<CodingInterviewMode, readonly CodingInterviewLearningStage[]>>
  >;
  simulationDistribution: JsonValue;
};

type CodingInterviewLearningStage =
  | "approach_model"
  | "guided_application"
  | "recognition"
  | "contrast"
  | "independent_transfer"
  | "spaced_review"
  | "simulation";

type CodingInterviewRecommendationPolicy = {
  policyId: string;
  policyVersion: string;
  evidenceRequirements: JsonValue;
  repeatedMistakeRules: JsonValue;
  reviewPriorityRules: JsonValue;
  modePriorityRules: JsonValue;
};
```

Runtime validates these declarations.

It does not infer missing stages, distributions, thresholds, or mode support from filenames or current item counts.

## Canonical mode configuration

`canonical-product-contract.yaml` is the only Coding Interview mode matrix. It supplies the mode IDs and labels together with selection boundary, session length, feedback, timer, shortening, and reinsert configuration. This learning document does not repeat those values or map entry intents.

The family and mode configuration defines a capability envelope, but a versioned
track/package/Free profile resolves the subset available to the learner. Practice
setup renders only that resolved profile. The runtime never infers an unavailable
length from inventory, fills from another mental unit, or silently changes the
requested length.

The exact session plan is selected, ordered, and persisted before the first item appears. Selection does not adapt silently in response to answers during the active session.

## Shared non-simulation contract

All seven non-simulation modes:

- use the one active session owned by the current device;
- use unique content identities except an explicitly scheduled exact-item reinsert;
- persist the session before the first item appears;
- render the timer behavior resolved from the canonical configuration;
- keep an unsubmitted response in UI state only;
- create an immutable attempt after durable submission;
- disclose authored feedback only at the boundary resolved from the canonical configuration;
- may create or update review;
- produce a family-specific completed-session result;
- show no confidence, readiness, retention, or mastery measure.

A session’s prepared selection does not change in response to its own attempts.

Later sessions and recommendations may use newly committed evidence.

## Learn Approach

### Purpose

`Learn Approach` introduces one roadmap unit as a reusable reasoning structure. Its items may cover the unit's closely related mental units without widening into another roadmap unit.

It is intended for:

- a newly selected mental unit;
- a learner with little evidence in the unit;
- a learner returning after repeated foundational misconceptions;
- a manual request to revisit the underlying mechanism.

It is not a passive article or a list of facts.

### Length

The resolved canonical configuration supplies the requested length.

The publisher verifies that every selectable roadmap unit has the declared length before release. It must not fill from another roadmap unit automatically.

### Selection

All selected items share one roadmap unit.

The session blueprint should cover, where applicable:

1. applicability signal;
2. preconditions;
3. invariant;
4. maintained state;
5. decisive operation;
6. boundary or stopping rule;
7. correctness mechanism;
8. complexity consequence;
9. false heuristic;
10. transfer boundary.

Not every mental unit requires exactly one item for each category. The track blueprint declares the applicable composition.

### Instructional design

Items use existing approved interaction contracts to expose and test the approach structure.

Permitted forms include:

- identifying the decisive signal in a solved scenario;
- selecting the correct invariant;
- ordering conceptual steps;
- identifying which state is necessary;
- completing a partially specified reasoning chain;
- deriving one complexity dimension;
- distinguishing a valid application from a near miss.

A worked example must explain why the steps work. It must not present an unexplained final procedure.

### Guidance

Prompts may contain stronger structural cues than later modes.

They may explicitly name:

- the mental unit;
- the candidate pattern family;
- the stage of reasoning being examined.

The learner must still make a meaningful decision before feedback.

### Feedback

Feedback follows the resolved canonical disclosure boundary.

`Details` connects the current decision to the complete mental-unit model.

For correct work, it reinforces the mechanism and transfer boundary.

For partial or incorrect work, it corrects the selected misconception without reducing the explanation to the answer text.

### Review effects

Incorrect and partial attempts may create or increase review.

`Learn Approach` does not resolve persistent review.

### Summary

The summary shows:

- mental-unit components encountered;
- skill atoms attempted;
- misconceptions observed;
- evidence limitations;
- recommended next action.

A successful primer does not prove independent application.

## Guided Practice

### Purpose

`Guided Practice` stabilizes one roadmap unit through varied application with progressively reduced cues.

It is the default topic-practice mode.

### Length

Supported user-selectable lengths follow the resolved canonical product configuration.

Every selectable roadmap unit must satisfy the declared 10, 20, or 40-question length at publish time. It does not fill from another roadmap unit merely to reach the requested count.

### Selection

All initial session items share one roadmap unit.

Selection varies:

- problem archetype;
- surface context;
- constraints;
- boundary cases;
- response type;
- plausible false heuristic.

The prepared plan should progress from greater to lower support where the content bank permits:

1. explicit structural cue;
2. application with visible constraints;
3. application with less direct cueing;
4. boundary or misconception diagnosis;
5. transfer to a varied archetype.

The exact distribution belongs to the versioned blueprint.

### Guidance

Guided Practice may expose:

- named mental unit;
- relevant constraints;
- narrowed candidate strategies;
- partial reasoning structure.

Later items in the plan should require the learner to retrieve more of the decision structure independently.

Guidance is encoded by authored content, not generated dynamically by runtime.

### Feedback

Each item follows the resolved feedback-disclosure boundary.

Feedback explains:

- why the mental unit applies;
- which invariant or state matters;
- which learner-selected alternative fails;
- how the reasoning transfers.

### Review effects

Incorrect and partial outcomes may create or increase review.

Guided Practice does not resolve persistent review merely because later items are answered correctly.

### Reinsert

A failed or partial attempt may schedule one compatible reinsert under the shared reinsert contract.

Reinsert is a corrective opportunity, not proof that the original error has disappeared.

### Summary

The summary emphasizes:

- skill coverage;
- success across varied contexts;
- repeated mistakes;
- cue dependence where observable from item stage;
- recommendation for recognition, contrast, review, or further guided practice.

## Recognize Patterns

### Purpose

`Recognize Patterns` trains identification of the relevant pattern family, variant, or mental unit from problem signals and constraints.

It targets the question:

> “What structure is present, and which evidence justifies that classification?”

It does not train recognition from topic labels or remembered prompt wording.

### Length

The resolved canonical configuration supplies the requested length.

The mode offers 10 or 20 questions. The publisher rejects a release if any declared recognition scope cannot supply the selected length.

### Selection scope

The learner or recommendation selects a declared recognition scope.

That scope may contain:

- several variants within one pattern family;
- neighbouring pattern families;
- a roadmap cluster;
- a curated recognition set.

The scope must be explicit before session preparation.

Runtime does not choose an arbitrary global set.

### Selection principles

The plan should include:

- different surface contexts with the same underlying pattern;
- similar surface contexts requiring different patterns;
- positive examples;
- near misses;
- constraint changes that alter the applicable strategy;
- prompts where a common keyword is insufficient evidence.

The visible prompt must not reveal the target pattern through:

- file name;
- topic heading;
- option ordering;
- explicit answer cue;
- accessibility metadata.

### Response contract

Recognition items may ask the learner to identify:

- pattern family;
- pattern variant;
- relevant mental unit;
- decisive signal;
- missing precondition;
- reason a candidate pattern does not apply.

A pattern-name response without a valid decision signal is weaker evidence than a response that identifies both classification and mechanism. The exact scoring contract must remain explicit in the item.

### Feedback

Feedback identifies:

- decisive structural signal;
- relevant constraint or precondition;
- why a tempting surface cue was insufficient;
- the nearest plausible alternative and its boundary.

### Review effects

Wrong pattern, wrong variant, incorrect, partial, or repeated false-heuristic outcomes may create or increase review.

Recognize Patterns does not resolve persistent review.

### Summary

The summary shows:

- recognition scope;
- classification evidence;
- repeated false signals;
- commonly confused families or variants;
- recommendation for contrast, guided practice, or independent practice.

It does not convert classification accuracy into mastery.

## Contrast Practice

### Purpose

`Contrast Practice` trains discrimination between approaches that appear plausible under similar surface conditions.

It targets:

> “Which single constraint, invariant, output requirement, or operation changes the correct strategy?”

### Length

The resolved canonical configuration supplies the requested length.

The mode offers 10 or 20 questions. The publisher rejects a release if any declared contrast roadmap topic cannot supply the selected length.

### Contrast set

Every session selects one contrast roadmap topic composed from explicit contrast relationships, such as:

- binary search versus linear scan;
- hash lookup versus sorting and two pointers;
- sliding window versus two pointers without a contiguous window;
- DFS traversal versus backtracking;
- greedy choice versus dynamic programming;
- fixed-size versus variable-size window;
- lower bound versus exact-index search.

A contrast set must identify:

- compared strategies or variants;
- shared surface signals;
- decisive distinguishing constraints;
- common false heuristic;
- intended transfer boundary.

### Selection

Items are arranged into small contrast clusters within the selected roadmap topic where the content supports meaningful juxtaposition.

A cluster should vary one or a small number of decisive properties while keeping other surface characteristics comparable.

Selection must not create artificial pairs whose only difference is wording.

### Feedback

Feedback explicitly states:

- why both approaches initially appear plausible;
- which condition decides between them;
- why the selected alternative fails here;
- when it would become appropriate;
- how to test the distinction in a new problem.

### Review effects

Wrong contrast decisions may create or increase review using stable pattern, strategy, or false-heuristic evidence.

Contrast Practice does not resolve persistent review.

### Summary

The summary shows:

- contrast relationships practised;
- decisive constraints missed;
- directional confusion between paired approaches;
- recommendation for a specific mental unit or independent discrimination.

## Weak Area Review

### Purpose

`Weak Area Review` performs corrective or spaced retrieval from explicit review evidence.

It is not a generic session generated from a low aggregate score.

It has two sources:

- `due_queue`;
- `session_misses`.

### Shared selection boundary

Both sources select from a defined review-evidence set.

Selection uses:

1. eligible source items;
2. reviewed variants of the same mechanism;
3. compatible repair items within the same mental unit;
4. compatible contrast items directly tied to the recorded misconception.

It does not silently widen to:

- an unrelated mental unit;
- a broad pattern family without a documented repair relation;
- arbitrary roadmap content.

If the compatible pool is smaller than requested, the session shortens and discloses its actual length.

### `source = due_queue`

This source serves spaced retrieval and unresolved persistent review.

Selection prioritizes deterministically:

1. overdue persistent entries;
2. other overdue entries;
3. due repeated-mistake entries;
4. other due entries;
5. compatible reviewed variants where needed.

Only attempts satisfying the shared after-due rules may advance persistent-review resolution.

### `source = session_misses`

This source reviews incorrect and partial outcomes from one explicitly identified completed session.

Its purpose is immediate correction and elaboration.

Selection prioritizes:

1. missed source items;
2. reviewed variants of the same mechanism;
3. direct contrast or repair items.

An immediate correction does not count as durable resolution unless the attempt independently satisfies the shared `dueAt` contract.

The mode must not imply that reviewing session misses removes the need for later spaced retrieval.

### Length

The resolved canonical configuration supplies the requested length.

A review session uses the valid compatible pool and may shorten.

If no eligible source item exists, preparation fails or the entry action is unavailable according to the application contract.

### Feedback

Each item follows the resolved feedback-disclosure boundary.

Feedback should connect the new response to the recorded misconception without relying on a generic “review” explanation.

### Reinsert

Reinsert follows the resolved Coding Interview reinsert configuration.

### Summary

The summary distinguishes:

- source items;
- reviewed variants;
- due-qualified successes;
- immediate corrections;
- unresolved persistent review;
- next scheduled action.

It does not display a synthetic retention percentage.

## Independent Practice

### Purpose

`Independent Practice` trains strategy selection and reasoning with reduced explicit guidance across a declared interleaved scope.

It is the closest non-simulation mode to independent problem analysis.

### Length

The resolved canonical configuration supplies the requested length.

The mode offers 10 or 20 questions. The publisher rejects a release if any declared interleaved scope cannot provide the selected length.

### Selection scope

The learner or recommendation selects a declared scope, such as:

- current roadmap region;
- several introduced mental units;
- one or more pattern families;
- a curated mixed set.

The scope is explicit before start.

### Selection principles

The plan:

- interleaves mental units and pattern families;
- varies problem archetypes;
- avoids consecutive items with the same primary mechanism where alternatives exist;
- suppresses unnecessary topic cues;
- tests recognition, strategy, invariant, ordering, and complexity;
- uses unique item identities;
- does not adapt secretly during the session.

### Guidance

Prompts provide only the constraints needed to solve the item.

They do not identify the target pattern unless pattern identification is not part of the item’s learning objective.

No hint-derived review evidence exists unless the specific interaction explicitly supports hints.

### Feedback

Feedback remains available after each durable submission because this is a learning mode, not a simulation.

The explanation may be complete, but the prompt itself does not provide guided scaffolding.

### Review effects

Incorrect and partial work may create or increase review.

Independent Practice does not resolve persistent review unless the attempt occurs through an explicitly review-prepared contract; ordinary independent attempts remain performance evidence.

### Summary

The summary emphasizes:

- breadth of mental units;
- strategy-selection quality;
- invariant and complexity errors;
- transfer across archetypes;
- repeated confusion;
- recommended focused or review action.

A strong session is not labelled interview readiness.

## Interview Simulation

### Purpose

`Interview Simulation` is a Patternly-defined timed validation session.

It evaluates algorithmic decision performance under:

- mixed content;
- reduced cueing;
- editable navigation;
- delayed feedback;
- active-work time pressure.

It does not reproduce:

- live interviewer interaction;
- coding execution;
- clarification dialogue;
- implementation debugging;
- behavioural interview content;
- employer-specific scoring;
- an uninterrupted real interview.

### Product-defined configuration

The canonical product contract supplies the simulation configuration. Its values are product decisions, not prescriptions of learning-science research, and must be evaluated through product evidence.

### Preparation

Selection follows the versioned Coding Interview simulation blueprint.

The blueprint declares:

- included roadmap scope;
- mental-unit distribution;
- pattern-family distribution;
- interaction-type distribution;
- learning-stage distribution;
- complexity coverage;
- review-exclusion or recency rules where applicable.

Preparation fails explicitly when the resolved blueprint cannot be satisfied.

The simulation must not:

- shorten;
- duplicate content;
- widen the configured scope;
- insert unrelated items;
- use generic substitutes.

### Timer

The simulation timer is resolved from the canonical contract. The interface discloses the resolved active-work behavior and never presents it as an unsupported absolute deadline.

### Draft state

Before finalization, the simulation persists:

- response drafts by occurrence;
- current position;
- canonical foreground timer state;
- other state explicitly permitted by the simulation profile.

Draft mutations create no:

- immutable attempt;
- result;
- score;
- review mutation;
- correctness state;
- `Reason`;
- `Details`.

### Finalization

Manual submission or foreground-time exhaustion freezes one exact durable draft revision.

One idempotent finalization operation then creates:

- immutable attempts for answered occurrences;
- deterministic result and points;
- eligible review mutations from answered outcomes;
- completed-session diagnostics;
- persisted unanswered occurrence references;
- draft deletion.

Unanswered occurrences:

- receive zero points;
- remain a separate diagnostic category;
- create no fabricated response;
- create no ordinary item-level attempt;
- do not automatically create content-specific review.

Feedback becomes available only after verified finalization.

### Results

Results show at least:

- total items;
- answered items;
- unanswered items;
- correct items;
- partial items;
- incorrect items;
- points earned;
- maximum points;
- mental-unit or skill breakdown;
- repeated mistake evidence;
- post-session authored feedback.

The result does not show:

- pass or fail;
- readiness;
- interview probability;
- mastery;
- predicted employer outcome.

### Recommendation effect

Simulation evidence may support recommendations such as:

- review a repeated invariant error;
- revisit a mental unit;
- practise a specific contrast;
- return to independent practice;
- repeat simulation after due review.

A simulation result does not automatically recommend another simulation and does not override overdue review.

## Interaction contracts

## Multiple choice

The shared Coding Interview multiple-choice contract is:

- exact selected correct set → `correct`;
- non-empty proper correct subset containing no wrong option → `partial`;
- any selected wrong option → `incorrect` with zero points.

Items may assess:

- signal recognition;
- strategy choice;
- invariant;
- state;
- operation;
- correctness;
- boundary;
- complexity;
- mistake diagnosis.

Each active wrong option has authored stable-ID feedback.

A distractor should represent a plausible misconception or competing approach, not an obviously false filler.

## Ordering

Ordering contains at least two elements.

It scores preserved canonical adjacent relations.

For:

```txt
A → B → C → D
```

the scored relations are:

```txt
A→B
B→C
C→D
```

Exact-position scoring is not used.

Ordering may train:

- control-flow sequence;
- invariant-preserving operations;
- recursive decision order;
- state-update order;
- high-level implementation plan;
- reasoning trace.

Ordering is a reduced-generation scaffold. The adjacent-relation scoring rule is a Patternly product contract, not a direct result prescribed by worked-example or Parsons-problem research.

Feedback explains the actual preserved and broken relations.

## Complexity

Complexity items explicitly declare:

- checked dimensions;
- available response values;
- accepted values;
- accepted aliases;
- maximum points;
- optional shared preset.

Time-only and space-only items are valid.

There is no global closed list of complexity classes.

Complexity content must train derivation rather than answer recall.

Feedback explains, where applicable:

- visited elements;
- nested or repeated work;
- amortization;
- recursive depth;
- copied or allocated state;
- hidden helper cost;
- mutation versus extra space;
- numeric-width implications.

## Review creation

Coding Interview attempts may create or increase review from approved triggers, including:

- incorrect;
- partial;
- wrong pattern;
- wrong strategy;
- complexity error;
- repeated mistake;
- scheduled retrieval;
- weak taxonomy evidence;
- supported hint use;
- manual mark.

Coding Interview review evidence identifies:

- source item;
- exact attempt or transition provenance;
- roadmap node;
- mental unit;
- pattern family and variant where applicable;
- problem archetype where useful;
- primary skill atom;
- stable misconception or diagnostic code where present.

Review evidence describes a recorded learning event. It is not an inferred fixed learner trait.

## Persistent review resolution

Persistent review follows the shared contract:

- only successful review attempts after `dueAt` increment resolution progress;
- success before `dueAt` does not increment;
- partial or incorrect resets consecutive success;
- two consecutive successful after-due review attempts are required;
- same-session correction does not resolve persistent review;
- retry of the same committed attempt cannot increment twice.

Ordinary correct practice does not silently resolve persistent review.

## Reinsert

Reinsert enablement, eligibility, placement, and content choice resolve from the canonical mode configuration and family policy. For each eligible source attempt:

- create a new occurrence;
- create a separate immutable attempt;
- preserve both diagnostic outcomes;
- do not resolve persistent review merely because the second attempt is correct.

If the fixed session plan cannot provide the resolved placement, skip the reinsert.

Skipping must not:

- extend the session;
- reorder fixed occurrences;
- add unrelated content;
- widen taxonomy;
- duplicate generic content;
- modify persistent review scheduling;
- resolve the review entry.

The resolved reinsert policy is a Patternly product decision. It must be tested and evaluated; it is not represented as a universal finding from learning science.

## Coding Interview evidence model

Coding Interview evidence remains separated into three categories.

### Evidence volume

Examples include:

- attempts by mental unit;
- attempts by pattern family or variant;
- distinct item identities;
- distinct problem archetypes;
- distinct sessions;
- spaced retrieval occasions;
- contrast relationships encountered.

Evidence volume says how much relevant evidence exists. It does not say whether understanding is strong.

### Learning-stage evidence

Examples include:

- approach-model exposure;
- guided application;
- pattern recognition;
- contrast discrimination;
- independent transfer;
- due review;
- simulation.

A correct guided response and a correct independent response are not treated as equivalent evidence.

### Performance signals

Examples include:

- correct, partial, and incorrect outcomes;
- wrong pattern;
- wrong strategy;
- broken ordering relations;
- complexity dimensions missed;
- repeated false heuristic;
- successful after-due retrieval;
- unanswered simulation item;
- performance across varied archetypes.

No individual signal becomes a readiness or mastery value.

## Recommendation policy

Recommendations are:

- deterministic;
- family-owned;
- versioned;
- based only on canonical evidence;
- explained;
- overridable by a valid learner choice.

The general priority is:

1. continue or deliberately abandon the active session;
2. perform overdue `Weak Area Review`;
3. address repeated high-risk misconceptions;
4. use `Learn Approach` when the mental model is absent or repeatedly unstable;
5. use `Guided Practice` for one bounded mental unit;
6. use `Contrast Practice` for a recurring strategy confusion;
7. use `Recognize Patterns` when classification is the current bottleneck;
8. use `Independent Practice` when broader strategy selection and transfer are the next challenge;
9. offer `Interview Simulation` as a chosen validation condition, not proof of readiness.

Exact thresholds and tie-breaking rules belong to the versioned `CodingInterviewRecommendationPolicy`.

The policy must use explicit evidence counts and categories.

It must not use:

- hidden composite mastery scores;
- confidence collection;
- readiness;
- retention percentages;
- inferred personality or ability labels;
- AI authority language.

Example recommendation copy:

- “Review due: repeated boundary error.”
- “Continue guided practice: evidence is limited to four items in this mental unit.”
- “Practise the contrast between sliding window and same-direction two pointers.”
- “Pattern recognition is the current bottleneck.”
- “Try independent practice across the current roadmap region.”

Avoid:

- “You mastered binary search.”
- “You are interview-ready.”
- “Your retention is 91%.”
- “AI recommends this session.”

## Content quality

Every active Coding Interview instructional item has:

- one primary skill atom;
- explicit constraints;
- accepted-answer contract;
- scoring contract;
- concise authored `Reason`;
- complete authored `Details`;
- stable-ID wrong-option explanations where applicable;
- valid taxonomy references;
- content-stage metadata;
- completed content audit and matching technical release evidence.

### Mechanism requirements

Content should teach, where applicable:

- why the approach applies;
- why its preconditions matter;
- what state is maintained;
- what invariant remains true;
- how operations preserve the invariant;
- when the answer is recorded;
- why the algorithm terminates;
- how time complexity is derived;
- how space complexity is derived;
- why a plausible alternative fails;
- where the pattern stops transferring.

### False-heuristic control

Every mental-unit batch identifies important false heuristics, such as:

- “sorted input always means binary search”;
- “two pointers always means opposite ends”;
- “one loop means linear time”;
- “backtracking means trying every possibility without pruning”;
- “a correct answer after immediate correction proves the topic is learned”;
- “the same surface keyword implies the same strategy”.

Items must not accidentally reinforce these heuristics through repetitive wording or shallow distractors.

### Editorial batch order

The remediation and authoring priority is:

1. active roadmap units;
2. highest false-heuristic risk;
3. contrasts and mistake diagnosis;
4. remaining foundations and mechanics.

This is an authoring priority, not a runtime session-selection algorithm.

### Content audit

The content audit verifies:

- factual correctness;
- algorithmic correctness;
- prompt and answer consistency;
- invariant correctness;
- complexity derivation;
- boundary conditions;
- option plausibility;
- distractor explanation;
- transfer value;
- taxonomy alignment;
- absence of copied platform wording;
- absence of unnecessary complete-solution dumps.

Structural validation does not replace this audit.

## Pool readiness

A mode is available only when the active content bank can satisfy its declared selection contract.

Shortening and fixed-plan preparation behavior resolve from the canonical mode configuration. The runtime does not redefine it by mode in this document.

Runtime must not:

- duplicate content to fill length;
- silently widen the selection scope;
- substitute a neighbouring topic;
- use inactive content;
- generate a generic item;
- conceal insufficient content.

## Explicit failures

Coding Interview preparation or resume fails explicitly for:

- unknown track or mode;
- unknown roadmap node or mental unit;
- unknown pattern, variant, archetype, or skill atom;
- unsupported interaction payload;
- invalid practice blueprint;
- invalid recommendation policy;
- insufficient fixed-length simulation content;
- missing active content;
- content-version mismatch;
- missing simulation profile;
- storage or journal failure;
- incompatible active session.

No failure produces:

- a default topic;
- a default item;
- a guessed answer;
- a generic explanation;
- a fallback mode;
- a successful-looking empty session.

## Research and product validation

Patternly should evaluate its product-defined rules separately from the foundational research mechanisms.

Relevant product questions include:

- whether `Learn Approach` produces better later independent transfer than immediate Guided Practice;
- whether contrast clusters reduce specific strategy-confusion errors;
- whether the fixed session lengths create fatigue or repetition;
- whether the resolved reinsert placement improves later performance rather than only same-session correction;
- whether session-miss review adds value beyond authored immediate feedback;
- whether foreground-paused simulation timing predicts useful independent performance;
- whether the declared simulation plan provides sufficient breadth without excessive speed pressure;
- whether recommendations move learners toward stronger delayed and transfer performance.

Product evaluation must use delayed and transfer outcomes where possible, not only immediate session accuracy.

Until such evidence exists, these configurations remain reasoned product hypotheses rather than scientifically proven optimums.

## Cross-document ownership

The following remain external to this document:

- shared data envelopes and persisted types → `04-data-model.md`;
- generic content quality and correction → `07-content-guidelines.md`;
- persistence, simulation drafts, journal, reset, and recovery → `08-storage-and-offline.md`;
- security and privacy → `09-security-and-privacy.md`;
- implementation boundaries → `11-implementation-guidelines.md`;
- required verification → `12-testing-strategy.md`;
- complete session state transitions → `17-training-runtime-and-interaction-spec.md`.

This document supplies Coding Interview-family learning semantics to those shared contracts.

It does not create a second lifecycle, persistence system, feedback model, or review queue.
