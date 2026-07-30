# Moderator guide — first Algorithms cohort

## Purpose and moderator rules

This 45–60 minute session separates six questions:

1. Does the participant understand Patternly's value and difference from a code
   runner?
2. Can they choose a relevant track and practice path?
3. Can they complete a representative session without guidance?
4. Does authored feedback help them explain and change a later decision?
5. Can they understand summary, progress, and the next action?
6. Would they return, what do they use instead, and what outcome might be worth
   paying for?

Do not teach the interaction, identify a correct answer, praise correctness,
translate learning content, or describe Patternly's intended value before the
participant has answered the relevant probe. Use neutral prompts such as “What
are you looking for?”, “What did you expect?”, and “What would you do next?”

Keep the English product locale. Moderation may be Polish or English. Record
every intervention using the levels in the observation form.

## Preflight — before the participant joins

- Record participant code, build identity, platform/device, locale, moderator
  language, date, moderator, and note-taker.
- For this solo study, record the product owner in both the moderator and
  note-taker roles. During the task, capture short timestamped observations;
  complete the case summary immediately after the session. Do not reconstruct
  an exact quote from memory when only a paraphrase was recorded.
- Start from the clean first-use state bound in
  [pre-recruitment acceptance](pre-recruitment-acceptance.md).
- Confirm the participant can reach:
  `Algorithms → Independent Practice → Hash map and set`.
- Confirm that starting this path yields the exact ordered IDs in the
  [representative-content manifest](representative-content-manifest.md).
- Confirm summary/progress is reachable after completing the 10 items.
- Confirm that screen, audio and video recording are off. PO-013 A permits only
  pseudonymous written notes for the first cohort.
- Keep the content manifest hidden from the participant.
- If any check fails, do not improvise another session. Stop and mark the
  session operationally invalid.

## Timeline

### 0:00–0:04 — consent and framing

Read the consent text from
[participant screener and consent](participant-screener-and-consent.md).

Then say:

> I am testing the product, not you. Please say what you notice, expect, and
> decide. I may stay quiet while you work. If you become stuck, tell me what you
> are looking for.

Do not explain the product.

### 0:04–0:08 — current behavior and alternatives

Ask:

- “Tell me about the last time you prepared for a technical interview.”
- “What was difficult about deciding how to practise?”
- “What tools or methods did you use?”
- “What did each one help with, and what remained unresolved?”

Probe concrete recent behavior before opinions. Do not mention Patternly
features or prices.

### 0:08–0:13 — value comprehension and track choice

Hand over the device on the first product screen.

Task:

> Take a minute to look around. Without starting a question yet, tell me what
> you think this product is for, who it is for, and what you would expect it to
> help you do.

Then ask:

- “How is this different from a place where you submit code?”
- “What evidence on the screen led you to that interpretation?”
- “Which available track would you choose for your current goal? Please choose
  it as you normally would.”

Do not ask whether the positioning is “clear” or whether they “like” the brand.

### 0:13–0:17 — choose a practice path

Task:

> You want to work without hints and decide the strategy yourself. Set up a
> practice session in a topic that seems relevant to using hash-based lookup.

Expected product path for observation, not for prompting:
`Independent Practice → Hash map and set`. The current scope-selection path
starts the mode-owned 10-item session; it does not expose a length choice.

After the participant commits to a path, ask:

- “What do you expect this mode to do?”
- “What do you expect to see after an answer?”
- “What do you expect the product to remember or recommend later?”

If the participant chooses a different valid path, first record the choice and
reason. Use one level-2 task restatement to request “practice without hints,
where you choose the approach yourself, about hash-based lookup.” If the intended path still cannot be
reached, stop the content portion and record task failure; do not navigate for
them.

### 0:17–0:39 — representative session

Ask the participant to complete the 10-item session and think aloud about:

- the decision they believe each question tests;
- uncertainty or missing assumptions;
- what they expect before submitting;
- what the feedback changes, if anything.

Do not interrupt after every answer and do not ask a mechanism question before
item 8. Such a probe can teach the intended relation and make later behavior
impossible to attribute to the authored feedback.

After item 8 (`alg-hms-complement-transfer-directed-difference`), ask:

- “Walk me through what you considered.”
- “Did anything earlier in this session influence that decision? If so, what?”

After item 10 (`alg-hms-complexity-expected-versus-worst`), ask the same two
questions. Do not name the expected mechanism, an earlier item, or the feedback
unless the participant names it first.

For each item, note whether the participant opens full Details, whether the
feedback addresses their actual misunderstanding, and whether they can express
the mechanism in their own words. Correctness alone is not a transfer signal.

If the session reaches 39:00 before completion, let the participant finish the
current item. Record an incomplete journey and continue only to the states the
real product makes available. Say: “We will pause the task here. Please use
what is currently on screen to tell me what happened and what you would do
next.” Do not claim the session is complete, create a completed state, or load
a substitute session.

### 0:39–0:47 — summary, progress, and next action

Only if the real completed-session state is visible, say:

> The session is complete. Use the product as you normally would to understand
> what happened and decide what to do next.

Ask:

- “What does this summary tell you?”
- “What does it not tell you?”
- “What do you think the product has learned about you?”
- “What would you do next, and why?”
- “Which statement here feels like evidence, which feels like a
  recommendation, and which feels like a promise?”

Do not describe progress as readiness, mastery, or predicted interview
performance. Record any participant inference that does so.

### 0:47–0:56 — return intent, alternatives, and paid outcome

Ask in this order:

- “In what situation, if any, would you use this again?”
- “How often would that situation occur in the next month?”
- “What would you use instead?”
- “What would Patternly have to do better than that alternative?”
- “What result would make a product like this worth paying for?”
- “What evidence would you need before paying?”
- “What would make you stop using it?”

Do not show a price, ask “would you pay?”, suggest a subscription, or name a
purchase model. A hypothetical paid outcome is not willingness-to-pay evidence.

### 0:56–1:00 — final open probe and close

Ask:

- “What is the most important thing I did not ask?”
- “If you could change one thing before using this again, what would it be?”

Thank the participant, restate when participant-level notes will be deleted,
and confirm the research contact supplied by the owner. Do not promise a
feature or release date.

## Intervention protocol

Wait through productive struggle. If the participant explicitly asks for help:

1. Level 1: neutral probe — “What are you trying to do?” or “What would you
   expect to happen?”
2. Level 2: restate the task without product terms not already used.
3. Level 3: direct navigation or explanation, used only to preserve the rest of
   the session.

Once level 3 is used, the affected task is not an independent completion. Keep
observing; do not erase the failure.
