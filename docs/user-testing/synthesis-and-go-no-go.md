# Synthesis and GO/NO-GO guide

## Principle

Synthesize observable behavior, interventions, participant language, and exact
content IDs. Do not create a composite usability, learning, value, or readiness
score. Immediate accuracy and stated return intent are separate signals and do
not prove retention, transfer, interview improvement, or willingness to pay.

## Case inclusion

Include a case only when:

- participation consent was recorded;
- the approved build and English locale were used;
- the exact Algorithms item order matched the manifest;
- protocol deviations are documented;
- notes contain enough timestamped evidence to reconstruct the critical
  journey.

Exclude an operationally invalid case from cross-participant counts, but retain
the de-identified operational failure in the study log. A participant who
struggles or does not finish is not invalid merely because the outcome is
negative.

## Individual case synthesis

For each included participant, create a one-page case summary from the
observation form:

1. product description in their own words;
2. independent journey points and intervention levels;
3. one strongest and one contradictory feedback/transfer observation;
4. critical misunderstandings;
5. current alternative and return situation;
6. paid outcome and evidence threshold, without interpreting it as purchase
   intent;
7. item-specific content defect candidates;
8. protocol or build deviations;
9. claims the case cannot support.

Preserve participant codes, not names.

## Cross-case matrices

Create separate matrices; do not sum them.

### Value comprehension

- describes a repeatable-decision practice product;
- distinguishes it from a code runner;
- does not infer validated interview readiness;
- understands that Algorithms and GCP are current instances, not the only
  possible long-term paths.

### Core journey

- chooses track;
- chooses mode and declared scope;
- starts and completes a session;
- finds feedback;
- interprets summary/progress;
- chooses a next action;
- highest intervention level at each point.

### Feedback and transfer

- identifies the mechanism behind an answer;
- feedback addresses the participant's actual error;
- applies complement derivation from item 6 to item 8;
- distinguishes expected and worst-case complexity across items 9 and 10;
- evidence contradicting usefulness;
- exact item IDs for every content concern.

### Return and commercial hypothesis

- concrete return situation;
- expected frequency;
- current alternative;
- relative advantage required;
- paid outcome;
- evidence required before payment;
- stop-use trigger.

Report counts as `n/N` beside representative evidence, never as a score.

## Defect routing

Classify each finding by owner:

- Product/IA/copy: journey, expectation, navigation, state semantics.
- Runtime defect: persistence, feedback timing, ordering, scoring, summary, or
  state behavior contradicts the contract.
- Content defect: prompt, constraints, accepted answer, scoring, feedback,
  taxonomy, or interaction is incoherent.
- Research defect: leading prompt, missing evidence, build mismatch, or
  moderator intervention contaminated the result.

For a content defect, open work against the canonical content source with the
exact item ID and evidence. Fix the item contract directly. Do not add a filter,
weak-content label, alternative runtime explanation, or substitution list.

## Decision gate

The synthesis owner issues exactly one outcome: **GO** or **NO-GO**. There is no
composite threshold and no “conditional GO”.

### GO to the next product experiment only when all are true

1. At least 6 operationally valid participant cases are included. With fewer
   than 6, the outcome is NO-GO and the cohort must be completed or rerun.
2. A strict majority of included participants (`floor(N/2) + 1`) describe the
   product's core value in their own words and distinguish it from a code
   runner.
3. A strict majority complete the core journey through next action without a
   level-3 intervention.
4. No critical misunderstanding appears independently in two or more included
   participants.
5. There is specific behavioral or verbal evidence in more than one case that
   authored feedback changed a later decision or explanation. Same-session
   evidence is sufficient only for the next experiment, not for an
   effectiveness claim.
6. No unresolved factual, accepted-answer, scoring, or feedback-timing defect
   makes the representative content unsafe to interpret.
7. The study has both confirming and contradictory evidence recorded, and all
   material protocol deviations are disclosed.

Commercial answers do not block GO unless they show that the proposed outcome
has no value for the recruited problem. They never select a price or billing
model by themselves.

### NO-GO when any GO condition is false

The decision record must name the failed condition, evidence, responsible
owner, and smallest coherent corrective action. After correction, run a fresh
dry-run or cohort appropriate to the failure; do not reinterpret old evidence
as a pass.

GCP ACE remains outside this participant-research decision regardless of the
Algorithms result. A GCP cohort requires a separate protocol and acceptance
gate; the reviewed pinned bank alone is not participant-research evidence.

## Decision record

| Field | Required entry |
| --- | --- |
| Included / excluded cases | participant codes and reason |
| Cohort outcome | GO / NO-GO |
| Value-comprehension evidence | counts plus representative and contradictory evidence |
| Core-journey evidence | counts, intervention levels, failure points |
| Feedback/transfer evidence | exact item IDs and participant evidence |
| Repeated critical misunderstandings | description, cases, timestamps |
| Content/runtime blockers | exact IDs or states and owner |
| Return/alternative evidence | behaviors and concrete alternatives |
| Paid-outcome hypotheses | outcomes and evidence thresholds, no price |
| Unsupported claims | explicit list |
| Corrective action or next experiment | owner, scope, verification |
| Raw-data deletion dates | participant-level notes; scheduling contact data if retained until the session |

## Claims discipline

An Algorithms GO supports only this statement:

> In this moderated cohort and build, a majority understood the intended value
> and completed the core journey, with observed evidence that feedback affected
> later same-session reasoning and no repeated critical misunderstanding.

It does not support claims about retention, delayed transfer, interview
performance, population-wide usability, certification readiness, conversion,
or price. Those require separate experiments, including delayed and transfer
outcomes where possible.
