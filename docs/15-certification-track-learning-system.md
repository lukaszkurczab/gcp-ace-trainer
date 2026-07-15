# 15 — Certification Track Learning System

## Purpose and scope

This document defines Certification-family-specific learning behaviour.

It owns:

- Certification taxonomy;
- Certification practice blueprints;
- semantics of the seven Certification modes;
- Certification item selection;
- competency-first remediation;
- family-specific evidence interpretation;
- family-specific recommendation rules;
- Certification review selection;
- Certification scoring interpretation;
- family interpretation of `ExamExperienceProfile`;
- Certification-specific content requirements.

It does not redefine:

- shared session lifecycle;
- durable mutation-journal mechanics;
- repository implementation;
- generic review-resolution mechanics;
- generic `Reason` and `Details` structure;
- shared UI components;
- security and privacy boundaries.

Those contracts remain owned by the corresponding shared documents.

## Scientific basis

Patternly uses established findings from cognitive and educational psychology as design constraints, not as a claim that the complete Patternly system has already been experimentally validated.

### Retrieval practice

Attempting to retrieve knowledge can improve later retention more effectively than additional study alone. Retrieval practice can also support transfer when learners must apply previously retrieved knowledge to new questions or contexts.

Certification practice therefore requires active decisions. Reading explanations without first attempting a response is not the default instructional loop.

### Spacing and successive relearning

Learning episodes distributed over time generally produce stronger delayed retention than the same practice massed into one period. Repeated successful retrieval across separated occasions provides more useful evidence of durable learning than repeated success within one session.

Certification review therefore schedules future retrieval and does not treat an immediate same-session correction as resolution of persistent review.

### Interleaving and discrimination

Interleaving related categories can improve the learner’s ability to discriminate between problem types and associate each type with an appropriate strategy. Its value is particularly relevant when several plausible alternatives share surface features but require different decisions.

Certification `Mixed Practice` and portions of `Scenario Practice` therefore interleave competing services, properties, and configurations. Initial focused practice remains more bounded so that the learner first acquires the relevant decision boundaries.

### Guidance, examples, and self-explanation

Worked examples and self-explanation can support learning when learners do not yet possess a stable problem-solving schema. The useful mechanism is not passive exposure alone, but attention to why each decision follows from the relevant principle or condition.

Patternly does not claim that an ordinary multiple-choice item is a worked example. Instead, `Focus Practice` begins with more explicit decision signals, and authored `Details` explains the reasoning path, mechanism, and transfer boundary after the learner attempts the item.

### Corrective and elaborated feedback

Effective formative feedback should identify whether the response was successful and provide specific information that helps correct the learner’s reasoning. Multiple-choice testing can expose learners to plausible but false alternatives; corrective feedback reduces the risk that selected distractors are retained as knowledge.

All non-simulation Certification modes therefore provide authored response-contingent feedback after durable submission.

### Learning versus current performance

Performance during immediate practice is not equivalent to durable learning. Massed or highly supported practice may improve short-term performance without proving later retrieval or transfer.

Patternly therefore keeps evidence volume, learning stage, spacing, context, and performance signals distinct. It does not convert a recent percentage into readiness, retention, or mastery.

## Limits of the evidence

The research above supports general learning mechanisms. It does not prescribe:

- Patternly’s mode names;
- exact session lengths;
- exact queue priorities;
- exact recommendation thresholds;
- the number of competency areas in a session;
- a universal schedule suitable for every certification.

Those values are Patternly product decisions. They must remain versioned, testable, and open to revision from product evidence.

Patternly does not claim that these rules predict official exam success.

## Certification taxonomy

Certification content is organized as:

```txt
exam domain
→ competency area
→ topic
→ skill atom
```

### Exam domain

An exam domain represents a broad area from the applicable official exam guide or another explicitly declared track blueprint.

An official domain weight may inform practice selection only when:

- it is publicly documented;
- the source and checked date are recorded;
- the owning track explicitly selects it for that practice blueprint.

An official exam weight is not automatically a learning priority. Patternly may use a separate pedagogical distribution, but it must identify that distribution as Patternly-defined.

### Competency area

A competency area represents a coherent family of decisions that can be remediated together.

Competency area is the primary unit for:

- weak-area grouping;
- scenario variation;
- recommendation explanation;
- broad progress breakdown.

It must be narrow enough that a recommendation such as “review network access decisions” identifies a useful practice action.

### Topic

A topic is the learner-facing focus inside a competency area.

Topic is the primary unit for:

- `Focus Practice`;
- understandable summary labels;
- targeted content authoring;
- first-level remediation within a competency.

### Skill atom

A skill atom identifies the specific observable decision trained by an item.

Examples include:

- selecting the applicable service property;
- identifying a required permission boundary;
- recognizing a regional versus global constraint;
- choosing the correct operational responsibility;
- distinguishing two similar networking controls.

An instructional item has one primary skill atom. Secondary skill atoms may provide necessary context but must not obscure the primary diagnostic target.

## Certification track instance

Each Certification track instance owns:

- taxonomy;
- active content bank;
- content version;
- `CertificationPracticeBlueprint`;
- `CertificationRecommendationPolicy`;
- versioned `ExamExperienceProfile`;
- supported interaction types;
- source and provenance metadata.

```ts
type CertificationPracticeBlueprint = {
  blueprintId: string;
  blueprintVersion: string;
  domainDistribution: readonly {
    domainId: string;
    weight: number;
    source: "official" | "patternly_defined";
  }[];
  competencyIdsByDomain: Readonly<Record<string, readonly string[]>>;
  supportedLengthsByMode: Readonly<
    Record<CertificationMode, readonly number[]>
  >;
  minimumActivePoolByMode: Readonly<Partial<Record<CertificationMode, number>>>;
};

type CertificationRecommendationPolicy = {
  policyId: string;
  policyVersion: string;
  evidenceRequirements: JsonValue;
  repeatedMistakeRules: JsonValue;
  modePriorityRules: JsonValue;
};
```

The runtime validates these declarations. It does not infer a missing distribution, threshold, or mode capability from the item bank.

## Canonical Certification modes

Certification has exactly these user-facing modes:

1. `Diagnostic Baseline`
2. `Focus Practice`
3. `Scenario Practice`
4. `Weak Area Review`
5. `Mixed Practice`
6. `Quick Review`
7. `Exam Simulation`

No second Certification mode taxonomy exists.

## Mode configuration summary

| Mode                  | Default length | Supported length | Primary selection boundary             | Feedback                  | Timer              | May shorten | Persistent-review resolution |
| --------------------- | -------------: | ---------------- | -------------------------------------- | ------------------------- | ------------------ | ----------- | ---------------------------- |
| `Diagnostic Baseline` |             40 | fixed 40         | broad practice blueprint               | after each durable submit | elapsed foreground | no          | no                           |
| `Focus Practice`      |             20 | 10, 20, 40       | one selected topic                     | after each durable submit | elapsed foreground | yes         | no                           |
| `Scenario Practice`   |             20 | 10, 20, 40       | one selected competency area           | after each durable submit | elapsed foreground | yes         | no                           |
| `Weak Area Review`    |             10 | 10 or 20         | unresolved error-based review evidence | after each durable submit | elapsed foreground | yes         | yes                          |
| `Mixed Practice`      |             20 | 10, 20, 40       | interleaved practice blueprint         | after each durable submit | elapsed foreground | yes         | no                           |
| `Quick Review`        |             10 | maximum 10       | due maintenance retrieval              | after each durable submit | elapsed foreground | yes         | yes                          |
| `Exam Simulation`     |        profile | profile          | `ExamExperienceProfile`                | session end               | absolute countdown | no          | no                           |

The exact selected plan is fixed and persisted before the first item appears.

No non-simulation Certification mode uses reinsert.

## Shared non-simulation contract

All six non-simulation modes:

- create one canonical active session;
- use unique item identities within that session;
- persist the session before the first item appears;
- use elapsed foreground count-up;
- keep an unsubmitted response in UI state only;
- create an immutable attempt after durable submission;
- provide authored feedback after durable submission;
- may create or increase review;
- show no confidence, readiness, retention, or mastery metric;
- produce a family-specific completed-session result.

Selection must not change in response to answers submitted within the current session. This keeps the prepared session deterministic and prevents feedback from silently changing its scope.

A later recommendation may use the newly committed evidence.

## Diagnostic Baseline

### Purpose

`Diagnostic Baseline` creates broad initial evidence across the selected Certification track.

It is not:

- a psychometrically calibrated placement test;
- a readiness estimate;
- an exam-pass predictor;
- a measurement unaffected by learning;
- an official score.

Because retrieval and feedback themselves affect learning, the baseline is simultaneously a diagnostic and a learning session.

### Availability

The mode is recommended when broad track evidence is absent or insufficient under the versioned recommendation policy.

It remains manually available after the learner has more evidence, but a later run is described as a new broad diagnostic session rather than a replacement of historical evidence.

### Length

`Diagnostic Baseline` contains exactly 40 unique items.

If the track cannot prepare 40 valid items satisfying the declared diagnostic blueprint, preparation fails explicitly.

The session must not:

- shorten;
- duplicate items;
- widen the declared taxonomy;
- use generic content;
- silently change the blueprint.

### Selection

Selection uses the track’s declared diagnostic distribution.

It:

1. allocates items across declared exam domains;
2. covers competency areas within those domains;
3. maximizes primary-skill-atom coverage before repeating a skill atom;
4. uses unique item identities;
5. prefers items not previously attempted when sufficient content exists;
6. does not weight the plan toward the learner’s known weak areas;
7. does not adapt item selection after the session starts.

If official exam-domain weights are used, that provenance is visible in the track configuration.

If Patternly-defined pedagogical weights are used, the product does not present them as official exam weighting.

### Item composition

The baseline should include a declared mix of:

- direct decision items;
- scenario items;
- competing-option discrimination;
- operational or configuration constraints.

It must not consist primarily of product-name recall.

### Feedback

Feedback appears after each durable submission.

Immediate feedback is used because the session is instructional and because authored correction reduces the risk of retaining plausible distractors.

Feedback does not alter later scoring or selection within the baseline.

### Review effects

Incorrect and partial attempts may create or increase review obligations.

A baseline attempt does not resolve a persistent review entry. Persistent review resolution is reserved for explicitly prepared review modes.

### Summary

The summary shows:

- domain and competency coverage;
- number of attempts behind each breakdown;
- correct, partial, and incorrect outcomes;
- repeated mistake signals where present;
- newly created review obligations;
- an explained next action.

It does not show:

- readiness;
- mastery;
- retention;
- pass probability;
- official pass/fail;
- a single composite score presented as durable competence.

## Focus Practice

### Purpose

`Focus Practice` builds and stabilizes decision rules within one selected topic.

It is the default mode when:

- a learner selects a topic;
- evidence for that topic is still limited;
- the learner needs a more bounded practice context;
- a recommendation identifies one specific topic as the next useful focus.

### Length

Default length is 20.

Supported requested lengths are:

- 10;
- 20;
- 40.

If the selected topic contains fewer compatible unique items than requested, the session shortens and shows its actual length before start.

It does not fill from sibling topics automatically.

### Selection

All selected items share the chosen topic.

Within that topic, selection should vary:

- skill atom;
- scenario context;
- surface wording;
- competing distractors;
- relevant constraints.

The session should not repeat equivalent prompts merely to create volume.

### Instructional progression

The fixed session plan progresses from lower-support to higher-transfer items where the content bank supports that ordering:

1. explicit requirement or property decisions;
2. application to concrete scenarios;
3. contrasts between plausible options;
4. transfer or boundary cases.

This progression is a Patternly implementation of guided practice and progressive removal of obvious cues. It is not represented as a separate mastery level.

### Feedback

Every item receives immediate authored feedback after durable submission.

`Details` should make the decision rule explicit and connect the specific scenario to the broader service, configuration, security, networking, or operational contract.

### Review effects

Incorrect and partial work may create or increase review.

Focus Practice does not resolve persistent review, even when the learner later answers a related item correctly in the same session.

### Summary

The summary emphasizes:

- topic coverage;
- skill atoms attempted;
- recurring distractor or decision-boundary errors;
- evidence limitations;
- recommended next action.

A strong immediate result may recommend later spaced retrieval rather than declaring the topic learned.

## Scenario Practice

### Purpose

`Scenario Practice` trains application and discrimination within one competency area.

It differs from `Focus Practice` because:

- `Focus Practice` remains within one topic;
- `Scenario Practice` crosses related topics inside one competency;
- every selected item must meet the Certification scenario-content contract;
- the learner must infer which property or constraint controls the decision.

### Length

Default length is 20.

Supported requested lengths are:

- 10;
- 20;
- 40.

If there are not enough compatible unique scenario items within the competency, the session shortens and discloses its actual length.

It does not silently widen into another competency.

### Selection

Selection:

- remains within one selected competency area;
- includes multiple topics where available;
- varies scenario surface features;
- includes plausible competing services or configurations;
- emphasizes decision boundaries rather than factual recall;
- avoids adjacent items with effectively identical solution logic where possible;
- uses no duplicate content identity.

The family runtime may interleave topics inside the competency to strengthen discrimination between similar alternatives.

### Feedback

Feedback must explain:

1. the material scenario requirement;
2. the capability, limitation, or policy that controls the decision;
3. why the expected option satisfies that requirement;
4. why the selected competing option fails;
5. when that competing option would become appropriate, where useful.

### Review effects

Incorrect and partial outcomes may create or increase review.

Scenario Practice does not resolve persistent review.

### Summary

The summary shows:

- competency coverage;
- topic coverage;
- repeated scenario-decision errors;
- recurring competing-option selections;
- whether evidence comes from varied scenarios or a narrow context;
- recommended next action.

## Weak Area Review

### Purpose

`Weak Area Review` is corrective remediation for unresolved error-based review evidence.

It is not a generic low-score session and does not select items from an unexplained aggregate percentage.

### Eligible review evidence

The mode prioritizes entries carrying one or more error-related reasons, including:

- `incorrect`;
- `partial`;
- `repeated_mistake`;
- family-supported misconception or decision-error evidence;
- other approved error-based Certification review reasons.

Pure maintenance retrieval belongs to `Quick Review`.

### Length

Default requested length is 10.

Supported requested lengths are:

- 10;
- 20.

The mode shortens when the compatible reviewed pool is smaller than requested.

If no eligible entry exists, the mode is unavailable and the product explains that no weak-area review is currently due.

### Selection

Selection proceeds in this order:

1. overdue eligible source items;
2. other due eligible source items;
3. reviewed variants of the same decision mechanism;
4. compatible repair items from the same competency area and topic;
5. compatible repair items from the same competency area when topic-level content is insufficient.

The runtime may widen from topic to competency only when the family review policy explicitly defines the selected item as a compatible repair of the same decision boundary.

It must not:

- move to an unrelated competency;
- duplicate content to fill length;
- add generic questions;
- use normal mixed-practice items merely to reach the requested count.

### Ordering

Priority is deterministic and considers:

- overdue state;
- repeated error evidence;
- unresolved persistent review;
- source-item relevance;
- competency and topic compatibility.

Exact priority fields and tie-breaking belong to the versioned Certification review policy and are covered by deterministic tests.

### Review resolution

Attempts in this mode are eligible to advance persistent-review resolution.

The shared review contract still applies:

- only successful attempts after `dueAt` increment resolution progress;
- success before `dueAt` does not increment;
- partial or incorrect resets consecutive success;
- two consecutive successful after-due review attempts are required;
- a same-session correction does not resolve persistent review.

There is no reinsert.

### Summary

The summary shows:

- entries practised;
- unresolved entries;
- review successes that counted;
- attempts that occurred before due date;
- reset consecutive-success sequences;
- remaining next review action.

It does not show a synthetic retention percentage.

## Mixed Practice

### Purpose

`Mixed Practice` develops discrimination across domains, competencies, and topics.

It is appropriate when the next useful challenge is choosing among several plausible decision families rather than repeating one known category.

### Length

Default length is 20.

Supported requested lengths are:

- 10;
- 20;
- 40.

The track’s active bank must support the selected length under its mixed-practice blueprint.

If a manually requested length exceeds the valid unique compatible pool, the session may shorten only when the blueprint explicitly permits shortening. The actual length is shown before start.

### Selection

Selection follows the declared Certification practice distribution.

It:

- spans multiple competency areas;
- spans multiple domains when the track taxonomy supports them;
- interleaves topics;
- avoids consecutive items from the same topic where a valid alternative exists;
- uses unique item identities;
- includes both direct and scenario decisions according to the blueprint;
- does not prioritize only weak areas;
- does not adapt during the session.

An official exam-domain distribution may be used only when explicitly declared. Otherwise the distribution is Patternly-defined.

### Feedback

Mixed Practice still provides feedback after each durable submission.

It is a learning mode, not a simulation.

### Review effects

Incorrect and partial attempts may create or increase review.

Mixed Practice does not resolve persistent review.

### Summary

The summary emphasizes:

- breadth of tested domains and competencies;
- discrimination errors;
- repeated selection of the same competing service or configuration;
- evidence by context;
- whether a focused, scenario, or review session is the next useful action.

A high mixed-session result is not labelled readiness.

## Quick Review

### Purpose

`Quick Review` provides short spaced retrieval for due maintenance evidence that is not currently classified as unresolved weak-area remediation.

It is designed for a short return to previously successful material.

### Eligible review evidence

Quick Review selects due entries whose current purpose is scheduled retrieval or maintenance.

It does not select an unresolved error-based entry when `Weak Area Review` is the appropriate mode.

If a maintenance item produces an incorrect or partial result, the applicable review entry may be reclassified or escalated under the Certification review policy.

### Length

Requested maximum length is 10.

`actualLength` is the number of eligible compatible due items up to 10.

If only four eligible items exist, the session contains four items.

It does not fill remaining positions with:

- unrelated content;
- not-yet-due content;
- duplicates;
- generic questions.

If no maintenance retrieval is due, the mode is unavailable and the product states that no quick review is currently due.

### Selection

Selection prioritizes:

1. overdue scheduled retrieval;
2. due scheduled retrieval;
3. broad competency distribution where due items permit it;
4. avoidance of repeated content identity.

Selection does not use items merely because they were recently answered correctly.

### Review resolution

Eligible successful after-due attempts may advance persistent-review resolution.

Incorrect or partial outcomes reset the consecutive-success sequence under the shared review contract and may change the next recommendation to `Weak Area Review`.

### Summary

The summary shows:

- due items completed;
- successful after-due retrievals;
- entries escalated because of error;
- next scheduled action.

It does not display a retention percentage or claim that an item will remain known for a predicted period.

## Exam Simulation

### Purpose

`Exam Simulation` reproduces only the official behaviour represented by the selected track instance’s valid `ExamExperienceProfile`.

It is not the source of general Certification practice semantics.

### Profile ownership

Each Certification track instance owns a versioned profile containing:

- profile identity and version;
- official public `sourceUrl`;
- `sourceCheckedAt`;
- optional guide version;
- duration;
- question count or range;
- navigation policy;
- answer-change policy;
- flagging policy;
- navigator policy;
- section policy;
- timeout policy.

A session snapshots the exact profile identity and version.

No global Certification simulation defaults exist.

### Missing official behaviour

A material rule is not inferred from:

- another certification;
- an earlier exam version;
- current legacy UI;
- provider convention;
- memory;
- an unofficial source.

If the required official behaviour is unclear, the track cannot claim faithful simulation.

### Selection

The simulation uses the declared exam blueprint and exact question count or range permitted by the profile.

It uses unique item identities and does not silently:

- shorten;
- duplicate content;
- widen the declared scope;
- substitute default content.

### Feedback and attempts

No item-level correctness, `Reason`, `Details`, distractor feedback, attempt, score, or review mutation exists before finalization.

Editable draft answers remain simulation state.

Finalization creates immutable attempts for answered occurrences.

Answered incorrect or partial outcomes may create or increase review after finalization.

Unanswered occurrences:

- count according to the Certification simulation result contract;
- remain separately diagnosed;
- create no fabricated response;
- create no ordinary item-level attempt;
- do not automatically create content-specific persistent review.

### Scoring

Simulation results show:

- raw correct count;
- percentage;
- competency breakdown;
- unanswered count;
- partial and incorrect diagnostics where applicable.

Only `correct` increments raw correct count.

Partial remains diagnostic and contributes no correct item.

No official-looking pass/fail result exists.

A Patternly-defined practice threshold may be shown only when:

- explicitly configured;
- clearly labelled as internal;
- visually and verbally distinct from an official result.

### Review

Post-session review defaults to:

- answered non-correct items;
- unanswered items as a separate category.

The learner may switch to an all-items view.

Opening answer review does not create a new learning session. Starting remediation from the result creates a new explicitly configured practice session.

### Recommendation effect

Simulation evidence is stored as simulation-stage evidence.

It may support recommendations such as:

- review a repeated competency error;
- practise unanswered areas;
- return to mixed practice;
- run another simulation after due review.

It must not produce:

- readiness;
- pass probability;
- guaranteed outcome;
- official status.

## Certification scoring and diagnostic interpretation

Certification instructional choice items use the shared multiple-choice contract:

- exact selected correct set → `correct`;
- non-empty proper subset containing no wrong option → `partial`;
- any selected wrong option → `incorrect` with zero points.

Where the active interaction is single choice, only the complete expected option produces `correct`.

Family diagnostics may additionally identify:

- selected distractor;
- omitted required property;
- service-confusion pair;
- scope mismatch;
- responsibility-model error;
- identity or permission-boundary error;
- regionality error;
- operational-trade-off error;
- other stable family-owned mistake codes.

A diagnostic code must come from authored content or deterministic family logic. Runtime does not infer a misconception from prose alone.

## Certification feedback requirements

Certification feedback applies the shared `Reason` and `Details` contract.

Family-specific `Details` must explain, where applicable:

1. the scenario requirement;
2. the exact capability, limitation, policy, or operational property;
3. the mapping from requirement to expected decision;
4. why the selected competing option fails;
5. the boundary under which that competing option would be suitable;
6. a transfer rule to another plausible scenario.

Avoid unsupported explanation language such as:

- “more secure”;
- “more scalable”;
- “best practice”;
- “recommended”;
- “managed”;
- “serverless”;

unless the exact relevant property is stated.

Every active wrong choice option has an authored stable-ID explanation.

## Review creation

Certification attempts may create or increase review from the shared approved triggers.

Certification-specific review evidence identifies:

- source item;
- exact attempt or transition provenance;
- exam domain;
- competency area;
- topic;
- primary skill atom;
- stable mistake code where present.

The review entry remains content-level evidence with exact provenance. It is not an inferred learner trait.

Review scheduling and two-success resolution follow the shared review contract.

## Evidence model

Certification evidence remains separated into three categories.

### Evidence volume

Examples include:

- attempts by domain;
- attempts by competency;
- attempts by topic;
- attempts by skill atom;
- number of distinct items;
- number of distinct sessions;
- number of spaced retrieval occasions;
- number of scenario contexts.

Volume indicates how much evidence exists. It does not indicate success.

### Learning-stage evidence

Examples include:

- broad diagnostic exposure;
- focused topic practice;
- varied scenario application;
- due maintenance retrieval;
- error remediation;
- mixed discrimination;
- exam simulation.

A correct answer in one stage is not automatically equivalent to a correct answer in another stage.

### Performance signals

Examples include:

- correct, partial, and incorrect outcomes;
- selected distractor IDs;
- stable mistake codes;
- repeated errors;
- due review;
- successful after-due retrieval;
- unanswered simulation occurrences;
- time and completion signals where applicable.

No one signal is converted directly into mastery or readiness.

## Recommendation policy

Recommendations are:

- deterministic;
- family-owned;
- versioned;
- based only on canonical evidence;
- explained in learner-facing language;
- overridable by a valid manual choice.

The general priority is:

1. continue or deliberately abandon an active session;
2. perform overdue error-based `Weak Area Review`;
3. perform due maintenance `Quick Review`;
4. use `Diagnostic Baseline` when broad evidence is insufficient;
5. use `Focus Practice` for bounded topic acquisition;
6. use `Scenario Practice` for repeated application or competing-option errors within one competency;
7. use `Mixed Practice` when broad discrimination is the next useful challenge;
8. offer `Exam Simulation` as a chosen validation condition, not as proof of readiness.

The exact evidence thresholds and tie-breaking rules belong to the versioned `CertificationRecommendationPolicy`.

Those thresholds must:

- use explicit counts and evidence categories;
- remain deterministic;
- be covered by fixtures;
- avoid hidden weighted composite scores;
- never use confidence;
- never output readiness, retention, or mastery percentages.

A learner-facing recommendation states why it was selected.

Examples:

- “Review due: repeated IAM scope error.”
- “Continue focused practice: evidence is limited to three items in this topic.”
- “Practise scenarios that contrast regional and global resources.”
- “Quick review due across two competency areas.”
- “Try mixed practice to distinguish competing service choices.”

Avoid:

- “You have mastered networking.”
- “You are 82% ready.”
- “AI recommends this mode.”
- “You should pass the exam.”

## Insufficient-content behaviour

Every mode validates its active content pool before session creation.

The runtime must not:

- duplicate items to fill length;
- widen taxonomy beyond the mode contract;
- use inactive content;
- substitute another topic or competency;
- generate a generic question;
- hide the shortage.

Behaviour by mode:

- fixed `Diagnostic Baseline` → explicit preparation failure;
- `Focus Practice` → shorten within the selected topic;
- `Scenario Practice` → shorten within the selected competency;
- `Weak Area Review` → shorten to compatible eligible review content;
- `Mixed Practice` → shorten only when the declared blueprint permits it;
- `Quick Review` → use the eligible due count up to ten;
- `Exam Simulation` → explicit preparation failure when the profile requirements cannot be met.

The actual configuration is shown before start whenever shortening is permitted.

## Content activation requirements

Certification content enters the active bank only after:

- structural validation;
- accepted-answer validation;
- stable-ID distractor coverage;
- taxonomy validation;
- required source validation;
- human technical review;
- human editorial review;
- manifest inclusion;
- content-version update;
- mode-pool readiness checks.

Structural validation does not prove educational quality.

A Certification item fails review when it:

- tests product-name recall without a meaningful decision;
- relies on vague marketing characteristics;
- omits a material scenario constraint;
- has more than one defensible answer under the stated conditions;
- uses a distractor that cannot be explained as a plausible competing decision;
- states the answer without explaining the controlling property;
- depends on stale pricing or UI details without required provenance;
- copies or closely paraphrases exam-dump content.

## Provenance and legal boundary

Certification behaviour claims use official public sources.

Content may use other authoritative technical sources where appropriate, but official exam-simulation behaviour must come from the exam provider’s public documentation.

Certification items record volatile source and version information when they depend on changing:

- product capabilities;
- limits;
- prices;
- UI behaviour;
- availability;
- defaults;
- official exam rules.

Patternly does not:

- copy exam dumps;
- imply affiliation;
- claim provider endorsement;
- reproduce confidential questions;
- claim official scoring;
- claim official pass or fail.

Provider names and trademarks identify subject matter only.

## Explicit failures

Certification preparation or resume fails explicitly for:

- unknown track;
- unknown mode;
- unknown domain, competency, topic, or item;
- unsupported interaction payload;
- invalid practice blueprint;
- invalid recommendation policy;
- insufficient fixed-length content;
- missing active content;
- content-version mismatch;
- missing profile;
- unsupported profile version;
- unresolved official simulation behaviour;
- storage or journal failure.

No failure produces:

- a default topic;
- a default service;
- a generic question;
- a guessed answer;
- a fallback profile;
- a successful-looking empty session.

## Cross-document ownership

The following remain external to this document:

- shared evidence envelope and persisted types → `04-data-model.md`;
- generic content quality and correction → `07-content-guidelines.md`;
- persistence, draft, journal, reset, and recovery mechanics → `08-storage-and-offline.md`;
- security and privacy → `09-security-and-privacy.md`;
- implementation boundaries → `11-implementation-guidelines.md`;
- required verification → `12-testing-strategy.md`;
- complete runtime state transitions → `17-training-runtime-and-interaction-spec.md`.

This document supplies Certification-family semantics to those shared contracts. It does not create a second lifecycle, storage model, or feedback system.
