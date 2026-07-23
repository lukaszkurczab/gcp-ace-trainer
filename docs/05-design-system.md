# 05 — Design System

This document provides design-system context for the behavior defined by `canonical-product-contract.yaml`; it cannot override that contract.

## Purpose

Patternly uses a calm, accessible focus-lab interface.

The design system makes the following information clear without decorative performance claims:

- the current track and mode;
- the next available training action;
- the current session position;
- timer behaviour;
- editable versus submitted response state;
- correctness only when the mode permits its disclosure;
- review due state;
- explicit unavailable and failure states.

Visual components render application and family-runtime states. They do not calculate scores, infer correctness, select content, construct recommendations, or fabricate educational feedback.

## Primary navigation

The primary tab navigation contains:

1. `Home`
2. `Practice`
3. `Progress`
4. `Settings`

Track selection, session setup, session runner, summary, review, and topic or competency details are nested routes.

Track identity remains visible wherever it changes content, progress, recommendation, review, or session behaviour.

Track accents remain stable across navigation, setup, session, summary, and progress surfaces. They support orientation and do not encode readiness, mastery, or status.

## Track and mode cards

Track and mode cards use only canonical user-facing labels.

Algorithms modes are:

- `Learn Approach`
- `Guided Practice`
- `Custom Practice`
- `Recognize Patterns`
- `Contrast Practice`
- `Weak Area Review`
- `Independent Practice`
- `Interview Simulation`

Certification modes are:

- `Diagnostic Baseline`
- `Focus Practice`
- `Scenario Practice`
- `Weak Area Review`
- `Mixed Practice`
- `Quick Review`
- `Exam Simulation`

Cards may show an explained recommendation, evidence limitation, due-review state, or relevant session configuration. They must not display confidence, synthetic readiness, retention, or mastery percentages.

A recommendation is visually distinct from availability. A non-recommended but supported mode remains selectable.

## Session setup

Session setup shows the resolved configuration before start.

For an ordinary session whose requested and actual lengths are equal, the setup may show the actual session length without repeating the same value twice.

When a mode permits shortening and the compatible pool is smaller than requested, setup shows:

- requested length;
- actual length;
- a concise reason for the reduction.

The interface must not imply that the session was filled with unrelated, duplicated, default, or generic content.

A fixed-length simulation does not shorten. Failure to prepare its required content produces an explicit preparation error.

Setup discloses timer semantics before start:

- practice uses elapsed foreground time;
- Algorithms `Interview Simulation` uses a 45-minute active-foreground countdown that pauses outside the app;
- certification `Exam Simulation` uses the absolute deadline defined by its profile.

The Algorithms timer is labelled as active work time, not as a deadline or exact reproduction of an uninterrupted external interview.

## Session shell

The shared session shell owns common session presentation:

- top bar;
- timer;
- question counter;
- progress through the session plan;
- scroll container;
- bottom action area;
- loading and preparation state;
- exit handling;
- submit, advance, and finish state;
- explicit persistence and finalization failures.

The shell does not import concrete item payloads or calculate family-specific state.

### Session top bar

For standard Algorithms practice and simulation screens:

- the timer appears on the left;
- the question counter appears on the right;
- the counter uses the form `x of y`;
- the counter does not include the word `Item`;
- the Patternly wordmark or logo does not appear in the top bar;
- no dedicated close button is shown.

System or navigation exit behaviour follows the applicable session contract and requests confirmation where required.

A different certification-exam chrome may be rendered only when required by an approved profile-driven design.

## Timer components

The design system provides three timer variants:

1. elapsed-foreground count-up;
2. foreground countdown;
3. absolute-deadline countdown.

Every timer exposes an accessible label containing:

- timer type;
- elapsed or remaining time;
- whether it measures active foreground time or absolute time;
- expired state where applicable.

Foreground timers use the canonical runtime timer state. UI does not maintain an independent authoritative clock.

The following timer states require defined presentation:

- running;
- paused by application background where that distinction is visible or needs disclosure;
- resumed;
- exhausted;
- frozen for finalization;
- persistence or recovery failure.

The Algorithms foreground countdown is never labelled, described, or implemented as an absolute deadline.

## Practice response controls

Practice response controls distinguish ephemeral selection from submitted outcome.

Before submit, an option may be:

- available and unselected;
- selected;
- disabled by the interaction contract;
- unavailable because the response is being durably submitted.

No correctness is shown before durable submission.

After durable submission, option-level states may include:

- selected and correct;
- selected and incorrect;
- correct but not selected;
- selected as part of a partial result;
- correct but missing from a partial response;
- neutral and not selected.

When a learner selects an incorrect answer:

- the selected incorrect option is visibly marked;
- the correct option or options are also visibly marked;
- no separate correctness sentence or icon is added beside the option.

For a correct response, only the selected correct state is required.

For a partial response, selected correct options and omitted correct options remain distinguishable.

The visual state must not add `Correct`, `Incorrect`, checkmark, cross, or equivalent inline status labels unless a later approved design explicitly changes this contract.

### Accessibility of response states

Correctness states use restrained colour as the primary visual treatment, but they must not depend on colour alone.

Without adding correctness text or icons to the normal layout, controls also use a consistent non-colour structural distinction such as:

- outline treatment;
- border weight;
- inset treatment;
- surface pattern or shape treatment.

Assistive technology receives the exact semantic state through accessible name, role, state, and description.

Focus, selected, submitted, correct, partial, incorrect, and disabled states must remain distinguishable at supported contrast and text-size settings.

## Simulation response controls

Before finalization, simulation controls show only editable draft state.

They may expose:

- unanswered;
- answered;
- currently selected draft response;
- response being saved;
- durable response saved;
- response-save failure;
- frozen response after finalization begins.

They do not use correct, partial, or incorrect styling before finalization.

A persisted draft response is visually distinct from an ephemeral interaction that has not yet been durably saved.

The learner must not be told that a draft change is saved until its canonical draft revision is durable.

Once finalization begins:

- answer controls become non-editable;
- navigation mutations are disabled;
- correctness remains hidden until the finalized result becomes available;
- the UI shows a defined frozen or finalizing state.

## Choice interactions

Single-choice and multiple-choice controls use the same base state vocabulary but render selection appropriate to the interaction.

Multiple-choice controls must make clear that more than one option may be selected without revealing how many answers are correct.

Option order follows the persisted occurrence-specific order. UI does not reshuffle options during resume or rerender.

## Ordering interactions

Ordering controls provide:

- visible current order;
- accessible move-up and move-down controls or an equivalent approved keyboard and assistive-technology interaction;
- touch interaction where supported;
- clear focus and grabbed or moving state;
- submitted and frozen states.

Feedback represents preserved canonical adjacent relations.

It must not imply exact-position scoring when the domain result was calculated from adjacent relations.

The accessible explanation identifies which relations were preserved or broken when authored feedback exposes that information.

## Complexity interactions

Complexity controls render only the contract declared by the active content item:

- checked dimensions;
- available answer values;
- labels and controls required for those dimensions;
- an approved shared preset where declared.

The UI must not assume that both time and space dimensions exist.

Time-only, space-only, and other explicitly supported dimension sets are valid.

Accepted answers and normalized aliases are scoring inputs. They are not rendered, exposed in accessibility metadata, or otherwise disclosed before the applicable feedback point.

After feedback becomes available, the UI may show the learner’s response and authored explanation of the relevant dimension error. It must not generate its own complexity rule.

## Feedback

Every instructional item has authored `Reason` and complete `Details`.

Feedback becomes visible only when the active mode permits it:

- practice: after durable item submission;
- session-end simulation: after successful finalization.

Before that point, the UI does not reveal:

- correctness;
- `Reason`;
- `Details`;
- distractor explanations;
- accepted answers.

When feedback becomes available:

- `Reason` is immediately visible;
- there is no generic `Feedback` heading;
- `Details` is collapsed by default;
- expanding or collapsing `Details` has no scoring, review, timer, persistence, navigation, or other domain side effect;
- opening `Details` is not required before `Next`, `Finish`, or post-session navigation.

The UI renders the complete family-composed authored narrative rather than a stack of redundant diagnostic cards.

For choice items, the selected wrong-option explanation may be composed into `Details` by stable option ID. UI never fabricates an explanation from option text, IDs, result enums, or generic templates.

## Algorithms Interview Simulation navigator

Algorithms `Interview Simulation` requires an approved free-navigation component for exactly 40 occurrences.

The navigator distinguishes at least:

- current;
- answered and durably saved;
- unanswered;
- frozen during finalization.

Correctness is not shown before finalization.

The navigator must not render flagged state unless the Algorithms simulation profile explicitly introduces and permits flagging.

Required surrounding states include:

- initial draft loading;
- response save in progress;
- response save failure;
- resume from durable draft;
- foreground timer exhausted;
- session frozen;
- finalization in progress;
- finalization failure with idempotent retry;
- finalized result available.

## Certification simulation controls

Certification simulation controls are rendered only when the selected track’s exact `ExamExperienceProfile` permits them.

This includes:

- previous and next navigation;
- free navigation;
- answer changes;
- flagging;
- answered, unanswered, and flagged navigator states;
- section controls;
- completed-section return;
- manual-finish warning;
- absolute-deadline timeout behaviour.

The interface must not render a capability because another certification profile supports it.

An unresolved or unsupported profile produces an explicit preparation error rather than a generic exam layout.

## Summary and progress

Summary and progress surfaces use canonical completed-session and evidence queries.

They may show:

- answered and unanswered counts;
- correct, partial, and incorrect counts;
- earned and maximum points;
- repeated mistake evidence;
- review due state;
- competency, topic, mental-unit, or skill breakdown;
- an explained next action.

A visible metric must:

1. answer a concrete training question;
2. have sufficient supporting evidence;
3. lead to a meaningful training decision.

The presentation must not convert sparse or mixed evidence into decorative certainty.

Do not show:

- confidence collection;
- synthetic readiness percentages;
- synthetic retention percentages;
- synthetic mastery percentages;
- official-looking pass/fail outcomes.

Any Patternly-defined practice threshold is explicitly labelled as internal and visually distinct from an official certification decision.

## Error and unavailable states

The design system includes explicit states for:

- missing content;
- unsupported payload;
- unknown ID;
- missing required route parameter;
- content-version mismatch;
- unresolved certification profile;
- insufficient fixed-length simulation content;
- active-session preparation failure;
- draft persistence failure;
- practice-submit failure;
- journal recovery;
- materialization failure;
- timer recovery failure;
- finalization failure;
- repository or storage failure.

An error state renders only recovery actions provided by the application contract.

It does not invent a generic retry when retry is unsafe, substitute a default item, navigate silently to another topic, discard a draft without confirmation, or display an apparently successful result.

## Accessibility baseline

All required components support:

- screen-reader names, roles, states, and descriptions;
- logical focus order;
- visible keyboard or switch focus;
- dynamic text sizing without clipped essential content;
- supported contrast requirements;
- touch targets appropriate for mobile interaction;
- reduced-motion preferences;
- semantic announcements for durable submit, draft-save failure, timer exhaustion, finalization, and explicit errors.

Animations must not be the only indication of state and must not delay a required action.

## Missing design dependency

Approved visual and interaction design must exist before implementing every required state, including:

- response-state treatments;
- ordering movement;
- content-defined complexity controls;
- foreground-countdown disclosure;
- Algorithms simulation navigator;
- draft saving and save failure;
- timer exhaustion and frozen state;
- certification navigator and sections;
- unanswered warning;
- finalization progress and recovery;
- review disclosure;
- explicit content and storage failures.

Missing design is an implementation blocker.

It is not permission for Codex to invent:

- an alternative interaction;
- a generic modal;
- a fallback navigator;
- a new correctness indicator;
- an extra status card;
- a hidden substitute state.
