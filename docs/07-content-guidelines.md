# 07 — Content Guidelines

## Purpose

Patternly content teaches transferable decisions rather than recognition of remembered wording.

Content must be:

- original;
- factually correct;
- lawful to use;
- aligned with a stable family taxonomy;
- structurally validated;
- audited in canonical source and released with technical evidence;
- compatible with the interaction and mode in which it is used.

Content quality is part of the product contract. Runtime, UI, validators, or generic fallback text must not compensate for incomplete educational material.

## Catalogue, Free verticals, and publication

Learners see tracks, not implementation families. The internal families are `certification`, `coding_interview`, and `design_interview`. The target catalogue contains ten equal-status track briefs; a track enters the production registry only with a real bundled `freeNodeId`, complete core loop, valid modes and goal templates, Progress dimensions, provenance rules, and a release-ready content/package plan. Empty cards, placeholder tracks, and fixed filler counts are prohibited.

Shared architecture is proven before broad copying: GCP ACE for Certification, Coding Interview for `coding_interview`, Backend System Design for Design Interview, then a second representative track in each reusable family. Brief approval is not production admission and does not authorize bulk content generation.

Canonical source may be corrected, but an already published artifact or package is immutable. A correction creates a new content and publication identity with complete validation, technical/editorial review, provenance, checksums, and reproducibility evidence.

Each production track bundles one complete English Free node. Premium content is published as immutable compressed whole-node packages. A session pins an exact package version; runtime never assembles a session through per-question Firestore fetching or silently substitutes a newer version. Document `08` owns delivery, activation, cache, and review-resolution behavior.

Launch application and content are English-only. Future locale packages reuse stable evidence identities while localizing learner-visible content; they do not fork scores, attempts, review evidence, or taxonomy identity merely because language changes.

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

### Operational explanation standard

`Details` is complete because it closes the learner's reasoning gap, not because
it reaches a word count. Length, number of blocks, code, and imagery are
diagnostic signals only. They are never substitutes for editorial judgment.

Every `Details` document must let a learner answer five questions when they are
relevant to the item:

1. **What does a learner need before this mechanism makes sense?** Make the
   explanation self-contained for a learner who has the track's general entry
   prerequisites but no prior knowledge of this specific case, pattern,
   shorthand, formula, service boundary, or implementation idiom. Define or
   unpack every item-specific term and intermediate relation needed for the
   reasoning. Do not require the learner to infer a missing bridge from the
   accepted option.
2. **What mechanism determines the answer?** State the causal rule, invariant,
   contract, or derivation rather than only naming the correct concept.
3. **How does that mechanism apply here?** Walk through the concrete values,
   state transition, requirement, or decision in the prompt.
4. **Where does the tempting alternative fail?** Expose the hidden assumption,
   violated boundary, or counterexample behind a plausible mistake. The
   response-specific distractor explanation may provide part of this layer, but
   the complete document must remain useful after a correct answer too.
5. **What transfers to the next problem?** End with a decision rule, invariant,
   trace pattern, or boundary that the learner can apply without memorizing the
   current wording.

Do not repeat `Reason` as the first paragraph and then rename a generic slogan
as a key takeaway. `Reason` orients; `Details` teaches. A complete explanation
may be concise when the mechanism is genuinely simple, but it fails audit when
removing the prompt and correct option leaves no derivation, application, or
transferable rule.

Choose the presentation form from the reasoning task:

| Reasoning task | Preferred authored form | Use code or an image when |
| --- | --- | --- |
| Recognition or strategy choice | mechanism paragraph, concrete contrast, decision-rule or counterexample callout | a state trace is harder to express accurately in prose |
| Ordering or state transition | numbered steps that name the invariant before and after each material operation | a short language-neutral trace makes mutation or pointer movement materially clearer |
| Complexity | explicit cost model, counted operations, aggregate or recurrence derivation, and worst/expected/amortized boundary | pseudocode is needed to show which operation is nested, repeated, or hidden |
| Implementation planning | invariant, state shape, operation order, edge case, then the smallest useful pseudocode | syntax-independent control flow or state update is itself the learning objective |
| Spatial or structural reasoning | labelled states or a compact local SVG plus a text equivalent | the relationship cannot be understood as efficiently from a trace or list |
| Certification decision | scenario requirement, exact capability or limitation, why it determines the choice, competing-option boundary, and transfer condition | a diagram is needed to distinguish scopes, trust boundaries, or request paths |

Code is not a default marker of depth. Include only the smallest executable or
pseudocode fragment needed to expose the mechanism, and explain the relevant
line or state transition. Do not turn a decision-focused item into a full
solution dump. Images are local, accessible, and used only when spatial
structure is part of the reasoning.

An item fails the editorial explanation audit when any of the following is
true:

- `Details` only restates the correct option, `Reason`, or prompt;
- it names a concept or complexity class without deriving why it applies;
- it contains no concrete application even though the prompt supplies values,
  states, constraints, or a scenario;
- its transfer statement is generic enough to fit unrelated items;
- a plausible distractor receives only a negation or label rather than its
  failed assumption and relevant boundary;
- multiple-choice feedback does not explain an omitted material correct
  element;
- the chosen format makes the mechanism harder to follow than a short trace,
  ordered list, counterexample, code fragment, or diagram would;
- it assumes prior knowledge of an item-specific term, formula, case, pattern,
  service boundary, or implementation idiom that is necessary to follow the
  reasoning and is neither established by the track's entry prerequisites nor
  explained in `Details`;
- it is technically correct but leaves the learner unable to reconstruct the
  decision without seeing the accepted answer.

Automated checks may flag short explanations, repeated text, verbatim
`Reason`/`Details` overlap, shallow distractor explanations, or an implausibly
uniform block shape. Such flags prioritize review; they do not approve or
reject pedagogy on their own. Every active item still receives a complete
technical and editorial review against the item-specific objective.

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

## Coding Interview content

Coding Interview content is strategy-first and teaches transferable reasoning rather than syntax recall or imitation of a coding platform.

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

### Coding Interview originality

Coding Interview content may use common algorithmic concepts, structures, and archetypes, but prompts, scenarios, options, traces, and explanations must be independently authored.

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

## Provenance for Coding Interview and general technical content

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

Passing structural validation alone does not prove pedagogical or factual quality.

## Canonical release authority

Patternly has no manual approval or activation record. A batch enters the active bank only through the canonical source-to-release pipeline, after its audit findings have been corrected in source and the technical evidence binds the exact committed inputs to the immutable artifact.

## Content audit requirements

The audit verifies:

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

A field-complete item may still fail the content audit.

## Batch release

A batch may enter the active content bank only when:

1. every included item passes structural validation;
2. required factual sources are current enough for the claims made;
3. the audit defects are corrected in canonical source;
4. technical evidence and the manifest bind the exact item set;
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
- applying audited item replacements;
- checking schema consistency;
- identifying mechanical coverage gaps;
- correcting a bounded content scope against an explicit learning objective;
- running validation and reporting results.

Codex must not:

- perform an unbounded mass rewrite from a generic instruction;
- invent missing educational explanations at runtime;
- treat structural validation as proof of pedagogy or factual nuance;
- mark a batch released without the required technical evidence;
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

## Content-report correction workflow

A learner report is triaged against the exact stable content and publication identity. Accepted corrections modify canonical source, pass technical/editorial and provenance review, create a new immutable package/release, and retain an auditable relation to the report without exposing account or response data to the content repository. A report never patches a published object in place.
