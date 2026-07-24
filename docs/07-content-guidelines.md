# 07 — Content Guidelines

## Purpose

Patternly content teaches transferable decisions rather than recognition of remembered wording.

Content must be:

- original;
- factually correct;
- lawful to use;
- aligned with a stable family taxonomy;
- structurally validated;
- human-reviewed before activation;
- compatible with the interaction and mode in which it is used.

Content quality is part of the product contract. Runtime, UI, validators, or generic fallback text must not compensate for incomplete educational material.

## Instructional item contract

Every active instructional item provides:

```txt
stable item identity
→ prompt, context, and material constraints
→ stable interaction elements
→ accepted-answer and scoring contract
→ concise authored Reason
→ complete authored Details
→ interaction-specific error explanation
→ primary and secondary taxonomy references
→ family-appropriate provenance metadata
```

The item contract must identify:

- `itemId`;
- `contentVersion`;
- interaction type;
- primary skill, competency, or mental-unit reference;
- any secondary taxonomy references;
- prompt and all material constraints;
- stable option or element IDs;
- valid response shape;
- accepted answer;
- scoring contract;
- authored feedback;
- source or provenance metadata required by the content family.

An instructional item is not valid merely because required fields are populated. Its prompt, answer, scoring, taxonomy, feedback, and interaction must express one coherent learning contract.

## Prompt and decision quality

A prompt should test a relevant decision, mechanism, invariant, constraint, trade-off, or transfer boundary.

It must not depend primarily on:

- remembered answer wording;
- product-name recognition without a decision boundary;
- trivia unrelated to the primary skill;
- accidental grammatical cues;
- one option being substantially longer or more precise than all others;
- ambiguous assumptions not stated in the prompt;
- hidden constraints introduced only in feedback;
- trick phrasing that does not represent the target skill.

Material assumptions and constraints must appear before the learner submits a response.

Negative phrasing such as `NOT`, `EXCEPT`, or double negation should be used only when the exception itself is the learning objective and the wording cannot be made clearer through a positive decision prompt.

## Stable item and interaction identity

`itemId` represents one stable instructional intent.

Keep the existing `itemId` when correcting:

- factual wording;
- ambiguity;
- an incorrect accepted answer;
- an incomplete explanation;
- a weak distractor;
- a constraint omission;

provided that the primary instructional intent and taxonomy identity remain the same.

Create a new `itemId` and remove the old item when the change materially replaces:

- the primary skill or competency;
- the mental unit;
- the problem archetype;
- the interaction type;
- the core answer semantics;
- the decision being trained.

Do not retain an old-to-new item map for runtime compatibility or historical explanation reconstruction.

Stable option or interaction-element IDs follow the same rule:

- preserve an ID when wording changes but the semantic option remains the same;
- assign a new ID when the option’s meaning changes;
- remove obsolete IDs rather than translating them at runtime.

An option ID must never be reused for a different semantic answer.

## Authored feedback

Every active instructional item has authored `Reason` and complete `Details`.

Feedback is revealed only at the point permitted by the mode:

- practice modes: after durable item submission;
- session-end modes: after successful finalization.

Before that point, content fields must not be exposed through visible controls, accessibility metadata, validation messages, option ordering, or other UI state.

### Reason

`Reason` provides concise decisive orientation.

It should normally be one or two sentences and must:

- identify the decisive signal, requirement, invariant, or constraint;
- connect it to the expected decision;
- remain specific to the current item.

`Reason` must not:

- merely restate the correct option;
- repeat the prompt;
- provide generic praise or failure copy;
- contain the entire instructional explanation;
- reveal feedback before the active mode permits it.

### Details

`Details` is collapsed when first made available and contains the complete instructional explanation.

It forms one coherent narrative that, where applicable:

1. explains the underlying mechanism;
2. applies it to the concrete prompt;
3. corrects the learner’s selected error;
4. identifies the relevant constraint, precondition, invariant, boundary, or trade-off;
5. provides a transfer rule, trace, or counterexample.

`Details` remains available after correct, partial, and incorrect submitted outcomes.

For a correct response, it reinforces mechanism and transfer rather than inventing an error to correct.

For partial or incorrect work, it addresses the actual response rather than presenting only a generic model answer.

Expanding or collapsing `Details` has no effect on:

- scoring;
- attempts;
- review;
- evidence;
- timer state;
- recommendation;
- persistence;
- navigation.

Opening `Details` is never required before the learner may continue.

## Choice-item contract

Every active wrong option in an instructional choice item has a meaningful authored explanation keyed by its stable option ID.

A distractor explanation must state:

- why the option may appear plausible;
- which assumption, heuristic, requirement, or boundary makes it wrong;
- when the option could become valid, if such a boundary is educationally useful.

Runtime may compose the authored `Details` with explanations for the wrong options actually selected by the learner.

It must not:

- fabricate an explanation from the option text;
- map by visible option position;
- infer an explanation from a result enum;
- use a generic wrong-answer template;
- show an explanation for an unrelated option.

When multiple wrong options are selected, all applicable authored explanations may be included without repeating the same correction unnecessarily.

For partial multiple-choice responses, feedback must also explain materially omitted correct elements. A wrong-option explanation alone is not sufficient when the error is an incomplete correct set.

A distractor that cannot be explained as a realistic misconception or competing decision should be improved or removed. After its removal, the prompt, accepted answer, option balance, scoring, and content version must be revalidated.

## Distractor quality

Distractors should:

- represent plausible misconceptions or competing approaches;
- remain at a comparable abstraction level;
- be grammatically compatible with the prompt;
- be mutually distinguishable;
- avoid overlapping answer semantics unless overlap is explicitly part of the interaction;
- avoid giveaway wording;
- avoid implausible extreme claims used only to make the answer obvious.

For single-choice items, exactly one option must satisfy the complete accepted-answer contract.

For multiple-choice items, the prompt must make the selection model clear without revealing the number of correct options unless that number is part of the task.

Distractor count is not a quality measure. Prefer fewer meaningful options over additional obviously false ones.

## Ordering-item contract

Ordering content contains at least two stable elements.

The content contract defines the canonical ordering and supports adjacent-relation scoring.

Authored feedback must explain the actual preserved or broken relations. It must not describe a response as wrong solely because elements were not in exact positions when the scoring contract is based on adjacent relations.

Where useful, `Details` explains:

- the dependency between neighbouring steps;
- the invariant preserved by the order;
- the consequence of reversing or separating a relation;
- a valid transfer to another sequence.

## Complexity-item contract

Complexity content explicitly declares:

- checked dimensions;
- available response values;
- accepted values;
- accepted normalized aliases where applicable;
- maximum points;
- any shared preset explicitly used by the item.

Time-only and space-only items are valid.

No content item may depend on an undeclared global closed list of complexity classes.

Accepted values and aliases are hidden scoring inputs. They must not be exposed before the applicable feedback point.

Feedback must explain the actual dimension error, including where relevant:

- number of input elements visited;
- nested or repeated work;
- amortization;
- hidden helper cost;
- recursion depth;
- allocated state;
- numeric-width implications;
- distinction between input storage and extra space.

A complexity explanation must derive the result. Merely stating `O(n)` or another class is insufficient.

## Algorithms content

Algorithms content is strategy-first and teaches transferable reasoning rather than syntax recall or imitation of a coding platform.

It may train:

- recognition of problem signals;
- constraints and preconditions;
- strategy selection;
- contrast between plausible approaches;
- state and invariant selection;
- operation ordering;
- boundary reasoning;
- complexity derivation;
- error diagnosis;
- transfer to a related archetype;
- independent implementation planning.

An item should have one primary skill atom. Secondary skill atoms may provide context but must not obscure what the item is intended to diagnose.

### Mental-unit batches

Each editorial batch has one primary mental unit.

A contrast batch may include an explicitly named adjacent or competing mental unit when the contrast itself is the learning objective. The batch must still identify:

- the primary mental unit;
- contrasted units;
- false heuristic being diagnosed;
- intended transfer boundary.

The editorial-remediation priority is:

1. active roadmap units;
2. highest false-heuristic risk;
3. contrasts and mistake diagnosis;
4. remaining foundations and mechanics.

This order governs authoring and remediation work. It is not a runtime session-selection algorithm.

### Algorithms originality

Algorithms content may use common algorithmic concepts, structures, and archetypes, but prompts, scenarios, options, traces, and explanations must be independently authored.

Do not copy or closely paraphrase:

- proprietary problem statements;
- platform-specific wording;
- editorial solutions;
- test cases that uniquely reproduce a protected problem;
- external answer explanations.

Patternly is not an online judge and does not need to reproduce a complete external coding problem when a smaller decision-focused prompt teaches the intended mechanism more precisely.

## Certification content

Certification content teaches decision boundaries, service or product contracts, and scenario reasoning. It must not reduce learning to memorizing provider product names.

Each scenario item should identify:

- the material requirement;
- the relevant official capability, limitation, policy, or operational property;
- why that property determines the expected answer;
- why the selected competing option fails;
- the boundary under which another option would become appropriate.

Avoid vague justification such as:

- `more secure`;
- `more scalable`;
- `more reliable`;
- `serverless`;
- `managed`;
- `recommended`;
- `best practice`;

unless the explanation identifies the exact property and why it matters to the scenario.

### Certification provenance

Certification items use authoritative public sources appropriate to the claim.

Where applicable, provenance includes:

- source URL;
- date checked;
- guide or documentation version;
- product or service version;
- region or platform scope;
- notes on volatility.

Official public documentation and exam guides are preferred over secondary summaries.

An item depending on volatile UI placement, current pricing, temporary quotas, product availability, or frequently changing defaults is permitted only when:

- that volatile fact is itself necessary to the learning objective;
- the exact source and checked date are recorded;
- the owning batch has an explicit maintenance responsibility;
- the item is revalidated before the applicable content bank remains active.

Otherwise, rewrite the item around a stable capability or decision boundary.

Do not copy exam dumps, recalled exam questions, proprietary training questions, or wording intended to imitate official exam content.

Provider names and trademarks identify subject matter only and do not imply affiliation or endorsement.

## Provenance for Algorithms and general technical content

External provenance is required when an item depends on:

- a non-obvious technical specification;
- a version-sensitive language or platform behaviour;
- an external standard;
- a vendor-specific limit;
- a disputed or evolving factual claim.

Timeless algorithmic reasoning does not require an external citation in learner-facing feedback, but the authoring record must still identify its taxonomy, reviewer, and content batch.

Sources are authoring evidence. They must not be copied into learner-facing explanations unless the product design explicitly exposes source references.

## Session-pool readiness

An active content bank must support the unique-item and compatibility requirements of every mode it claims to provide.

For fixed-length modes:

- the required number of valid unique items must be available;
- selection must satisfy the mode blueprint;
- duplicates must not be introduced to fill the session;
- unrelated taxonomy must not be added silently.

If a fixed-length session cannot be prepared, preparation fails explicitly.

For review modes that permit shortening, the actual compatible length is disclosed according to the runtime contract.

Content planning must account for repeated use and avoid predictable recurrence, but content quantity never substitutes for editorial quality.

## Structural validation

Automated validators verify at least:

- unique item IDs;
- unique and valid option or interaction-element IDs;
- prompt and interaction shape;
- accepted-answer references;
- answer and scoring consistency;
- required `Reason`;
- required complete `Details`;
- required wrong-option explanation coverage;
- valid taxonomy references;
- valid source and provenance fields where required;
- valid checked dimensions and accepted values;
- minimum ordering length;
- session-mode compatibility;
- duplicate content identity violations;
- manifest and content-version consistency.

Validators must reject:

- unknown option IDs in feedback;
- accepted answers referring to absent options;
- runtime fallback text;
- unsupported interaction payloads;
- incomplete complexity contracts;
- missing active-bank content.

Passing structural validation does not constitute human editorial approval.

## Canonical content-approval authority

Patternly uses recorded human editorial approval as its only content-approval authority. A product or content owner may supply source material, taxonomy, or a manual activation record, but cannot replace the reviewer’s editorial disposition with owner activation.

Activation is a coverage operation after approval: it binds the exact approved item fingerprints to one active artifact. It never approves educational quality, factual accuracy, or learner-facing feedback by itself.

## Human editorial review

Every batch requires recorded human sign-off before activation.

The review record identifies:

- batch ID;
- family and track;
- primary mental unit, competency, topic, or exam domain;
- included item IDs;
- target content version;
- reviewer;
- review date;
- structural validation result;
- factual and editorial defects found;
- required corrections;
- final approval or rejection.

Human sign-off verifies:

- factual correctness;
- prompt and constraint completeness;
- prompt, options, accepted-answer, and scoring consistency;
- one clear primary learning objective;
- decisive and item-specific `Reason`;
- mechanism and concrete application in `Details`;
- correction of actual plausible misconceptions;
- transfer rule, trace, counterexample, or boundary where useful;
- meaningful distractor explanations;
- constraint and precondition coverage;
- correct complexity derivation;
- absence of false heuristics;
- alignment to taxonomy;
- appropriate cognitive load;
- absence of unnecessary solution dumps;
- originality and source legality;
- family-specific technical quality.

A field-complete item may still fail human review.

## Batch activation

A batch may enter the active content bank only when:

1. every included item passes structural validation;
2. required factual sources are current enough for the claims made;
3. human editorial sign-off is complete;
4. the manifest includes the exact approved item set;
5. the active `contentVersion` identifies that set;
6. all declared mode-readiness conditions are satisfied.

Do not activate a subset silently to make validation pass.

Do not hide weak or invalid active items behind:

- temporary quality statuses;
- draft flags;
- readiness labels;
- runtime exclusion lists;
- fallback items;
- generic answers.

A defect found in active content is corrected as a blocking content defect under the normal correction contract.

## Content correction and versioning

Correct active content in its canonical source.

Do not retain:

- obsolete explanation versions;
- historical item payloads;
- earlier option maps;
- answer translators;
- local-history compatibility contracts;
- runtime reconstruction of old content.

Any change to an active item’s learner-visible or scoring contract requires an active-bank `contentVersion` update. This includes changes to:

- prompt;
- material constraints;
- options or interaction elements;
- accepted answer;
- scoring;
- `Reason`;
- `Details`;
- distractor explanations;
- taxonomy;
- source-sensitive claims.

The new version identifies the complete active bank. It does not create a runtime archive of previous banks.

An active session referencing an inactive content version follows the explicit content-mismatch contract. Runtime does not substitute the current item version.

## Missing and invalid content

Missing, invalid, unsupported, or version-mismatched content is an explicit preparation or resume failure.

Runtime must not substitute:

- a default item;
- a default topic;
- a generic option;
- a guessed correct answer;
- a generic explanation;
- a different content version;
- an unrelated item from another taxonomy area.

The error state exposes only recovery actions defined by the application contract.

## Codex boundaries

Codex may assist with:

- implementing validators;
- applying exact reviewed item replacements;
- checking schema consistency;
- identifying mechanical coverage gaps;
- producing bounded candidate content for subsequent human review;
- running validation and reporting results.

Codex must not:

- perform an unbounded mass rewrite from a generic instruction;
- invent missing educational explanations at runtime;
- declare its own output human-reviewed;
- mark a batch approved without recorded human sign-off;
- change accepted answers, taxonomy, or interaction semantics without an explicit content specification;
- hide weak content behind temporary status fields;
- copy or closely paraphrase proprietary source material.

Every Codex content task must specify:

- exact batch;
- exact files;
- exact item IDs or creation target;
- primary learning objective;
- required answer and feedback contracts;
- source requirements;
- validation commands;
- human-review handoff;
- forbidden changes.

Planned or generated content remains unapproved until the documented human review is completed.
