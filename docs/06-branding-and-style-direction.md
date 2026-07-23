# 06 — Branding and Style Direction

## Brand promise

Patternly is precise, focused practice:

```txt
identify the decision
→ understand the mechanism
→ correct the relevant mistake
→ take the next useful practice action
```

The product is calm, direct, technically credible, and evidence-based.

It is not:

- gamified;
- celebratory without instructional value;
- anxious or punitive;
- motivational theatre;
- officially authoritative;
- positioned as an AI tutor, examiner, or source of guaranteed outcomes.

Patternly describes what the available evidence supports and what action follows from it. It does not convert limited evidence into certainty or judge the learner as a person.

## Voice

Patternly uses concise, concrete language.

Copy should:

- name the relevant decision, mechanism, constraint, or mistake;
- distinguish confirmed state from recommendation;
- explain why an action is recommended;
- state uncertainty when evidence is limited;
- identify whether an action is required, recommended, optional, or unavailable;
- use family-specific technical language where it improves precision.

Copy should not:

- praise routine actions excessively;
- shame mistakes;
- imply that progress is linear;
- treat speed as competence without supporting evidence;
- describe a recommendation as intelligent, personalised by AI, or inherently optimal;
- imply that Patternly knows more than the recorded attempts support.

## Recommendation copy

Recommendations are deterministic, evidence-based, and explained.

Prefer copy such as:

- “Review due: repeated strategy error.”
- “Continue with interval boundaries.”
- “Practice the next contrast.”
- “Return to this mental unit before mixed practice.”
- “Recent attempts show repeated complexity errors.”
- “Evidence is still limited. Continue guided practice.”
- “Recommended because this review is overdue.”
- “Recommended from your recent practice.”

Avoid:

- “AI recommends…”
- “The smartest next step is…”
- “You are ready.”
- “You have mastered this.”
- “Your knowledge retention is 84%.”
- “You are weak at binary search.”
- “You should easily pass.”
- “This guarantees improvement.”

Describe evidence, not identity.

Prefer:

> “Three recent attempts contained the same boundary error.”

Avoid:

> “You are bad at boundaries.”

A valid learner choice may override a recommendation. Copy must not present a recommendation as a lock, requirement, or hidden prerequisite unless the configuration is genuinely unsupported.

## Evidence and metric copy

Visible metrics must answer a concrete training question and support a meaningful action.

Permitted language includes:

- number of relevant attempts;
- correct, partial, incorrect, and unanswered outcomes;
- earned and available points;
- repeated mistake evidence;
- due-review state;
- topic, competency, mental-unit, or skill breakdown;
- explicit evidence limitations.

Do not use:

- confidence collection;
- readiness percentages;
- retention percentages;
- mastery percentages;
- unexplained composite scores;
- decorative ranks;
- status labels that suggest certainty unsupported by evidence.

When evidence is insufficient, say so directly.

Prefer:

- “Not enough attempts to identify a stable pattern.”
- “Evidence is limited to two guided-practice items.”
- “No current review action is supported by the available attempts.”

Do not replace insufficient evidence with an optimistic or pessimistic estimate.

## Instructional feedback copy

Every active instructional item has authored `Reason` and complete `Details`.

### Reason

`Reason` provides concise orientation when the active mode permits feedback.

In practice modes, it appears after durable submission.

In session-end modes, it remains hidden until successful finalization and post-session feedback.

`Reason` should normally:

- identify the decisive signal, requirement, invariant, or constraint;
- connect that signal to the expected decision;
- remain concise enough to read before the next action.

It should not:

- repeat the correct option without explanation;
- provide a full solution dump;
- use generic praise or failure language;
- appear before the mode permits correctness disclosure.

### Details

`Details` provides the complete instructional explanation.

It should form one coherent narrative that, where applicable:

1. explains the mechanism;
2. applies it to the current prompt;
3. corrects the learner’s selected error;
4. identifies the relevant precondition, boundary, trade-off, or invariant;
5. provides a transfer rule, trace, or counterexample.

Use direct technical language. Do not pad the explanation with motivational copy, generic study advice, or redundant diagnostic headings.

Opening `Details` has no scoring, review, timer, persistence, recommendation, or navigation effect.

## Response-state copy

Correctness is communicated by the approved response-state design and accessibility semantics.

Do not add redundant inline labels such as:

- `Correct`;
- `Incorrect`;
- `Wrong answer`;
- `Good job`;
- `Try again`;

when the approved interaction intentionally communicates the submitted state through its visual and accessible control treatment.

Do not add generic headings such as `Feedback` above `Reason`.

For partial results, copy must explain what part of the reasoning or response was preserved and what remained incomplete. It must not describe partial work as fully correct or fully wrong.

Simulation draft state must never use correctness language before finalization.

Use:

- “Saved”
- “Saving…”
- “Couldn’t save this response”
- “Finalizing session…”

Do not use:

- “Correct so far”
- “Likely correct”
- “Answer accepted”

before scoring is permitted.

## Timer copy

Timer language must reflect the actual timer contract.

For ordinary practice, describe elapsed foreground activity as practice time, not total wall-clock session duration.

For a foreground-countdown Algorithms simulation, use the resolved duration and behavior from the canonical contract. Suitable language includes “active work”, “Timer pauses outside the app”, and “Active time remaining”.

Do not call this timer:

- an absolute deadline;
- an exact interview simulation;
- a faithful reproduction of an uninterrupted interview.

Certification `Exam Simulation` uses the absolute deadline defined by the selected track’s `ExamExperienceProfile`.

Use language such as:

- “Time remaining”
- “The exam will be submitted when time expires”
- “This simulation follows the referenced exam profile”

only when the resolved certification profile supports those claims.

## Error and unavailable-state copy

Errors are explicit product states, not exceptional copy to be hidden.

Error copy should state:

1. what operation could not be completed;
2. what is known about persisted state;
3. whether retry is safe;
4. what action is available;
5. what Patternly did not substitute or discard.

Prefer:

- “This content is unavailable.”
- “This session cannot resume because its content version is no longer active.”
- “The certification profile could not be resolved.”
- “The response was not saved. Your last saved draft is unchanged.”
- “Finalization did not complete. The frozen session can be retried safely.”
- “The required simulation plan could not be prepared.”
- “Storage is unavailable. No substitute result was created.”

Avoid:

- “Something went wrong.”
- “Please try again” when retry safety is unknown;
- generic success copy after partial persistence;
- silently navigating to another topic;
- implying that missing content was replaced;
- blaming the learner for a system or content failure.

Errors may be technically precise, but they should not expose internal identifiers, stack traces, or implementation terminology unless shown in a deliberate developer-facing diagnostic surface.

## Certification safety

Certification names and trademarks identify subject matter only.

Patternly must state, where certification context makes it relevant, that it is independent and is not affiliated with, endorsed by, or officially approved by the exam provider.

Patternly does not claim:

- official exam questions;
- official scores;
- official readiness;
- official pass or fail;
- guaranteed certification outcomes;
- exact exam behaviour beyond the resolved profile.

A certification simulation may be described as following its referenced official profile only when:

- the profile is valid;
- the official public source is recorded;
- the relevant behaviour is documented;
- unresolved rules are not inferred.

If an official rule is unresolved, say so directly and do not claim faithful simulation.

An internal practice threshold, if present, is explicitly labelled as Patternly-defined. Its language and visual presentation must not resemble an official certification result.

Prefer:

> “Patternly practice threshold”

Avoid:

> “Exam passed”

## Algorithms simulation safety

Algorithms `Interview Simulation` is Patternly-defined.

It may be described as:

- timed validation;
- active-work simulation;
- mixed algorithmic decision practice;
- a session with finalization-only feedback.

It must not be described as:

- an official interview;
- a complete reproduction of a company interview;
- evidence that the learner will pass an interview;
- a faithful simulation of every real interview condition.

Because its timer pauses outside the foreground, copy must disclose this behaviour wherever the timing contract is introduced.

## Visual direction

Use a focused workbench rather than a game board.

The visual system uses:

- restrained surfaces;
- strong but controlled contrast;
- clear hierarchy;
- stable track accents;
- consistent session chrome;
- unambiguous editable, submitted, frozen, and error states;
- limited motion with functional purpose;
- spacing that supports concentration and touch interaction.

Compact hierarchy means that related information is organised efficiently. It does not mean:

- reducing essential spacing;
- clipping dynamic text;
- shrinking touch targets;
- compressing explanations into unreadable blocks;
- hiding state labels needed by assistive technology.

Track accents support orientation. They do not represent quality, level, readiness, or success.

Response colours communicate local interaction state. They do not become global performance branding.

Avoid:

- points animations;
- confetti;
- streaks;
- badges;
- leagues;
- celebratory score theatre;
- pulsing urgency;
- artificial scarcity;
- decorative progress rings without an actionable meaning;
- visual treatments that make an internal threshold look official.

## Accessibility and tone

Accessibility is part of the brand, not a separate compliance layer.

Copy and visual treatment must remain understandable with:

- screen readers;
- dynamic text;
- reduced motion;
- keyboard or switch navigation;
- colour-vision differences;
- limited attention or cognitive load.

Do not rely on colour alone for a required semantic distinction.

Accessible descriptions may state exact response status even when the normal visual layout intentionally omits correctness text or icons.

Announcements should be concise and factual.

Prefer:

- “Response submitted. Incorrect selection. Correct option also highlighted.”
- “Draft saved.”
- “Timer expired. Session frozen for finalization.”

Avoid celebratory, punitive, or repetitive announcements.

## Brand consistency rule

A new screen, component, mode, metric, or message must use the same vocabulary and evidence rules as the canonical product contract.

Implementation must not introduce:

- alternative mode names;
- `AI-powered` recommendation language;
- synthetic performance terminology;
- unofficial certification claims;
- generic educational fallback copy;
- gamification added as a default engagement mechanism;
- temporary status labels that disguise incomplete content or architecture.

When a required state has no approved copy or visual treatment, the missing design remains a blocker. Codex must not invent a new brand pattern, error tone, metric label, or certification claim as an implementation shortcut.
