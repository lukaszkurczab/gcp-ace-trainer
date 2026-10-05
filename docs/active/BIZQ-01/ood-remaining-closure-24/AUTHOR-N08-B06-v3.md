# N08-B06 v3 author correction

- Previous proposal SHA-256: `5bb9402840b735f3b5516a0abe927266ef266cf5fbb0e7a1c12b7ec9a2b4ca72`.
- Current proposal SHA-256: `d214610eb75d80ac03851bb803f920ff6846091b331c163bd6cf98ed3989a341`.
- Source binding: `../patternly-content/content/object-oriented-design-interview/concurrency_thread_safety_resources_and_failure_handling/OOD-N08-B06.json` SHA-256 `e89dc87ab83957715099a8eee747f07eb435ce4e3fe7d7d1ef04145ff25263bd`.
- Scope: ood-n08-b06-i001, ood-n08-b06-i002, ood-n08-b06-i004, ood-n08-b06-i005, ood-n08-b06-i007, ood-n08-b06-i008, ood-n08-b06-i009, ood-n08-b06-i011, ood-n08-b06-i012, ood-n08-b06-i013, ood-n08-b06-i014, ood-n08-b06-i018.
- Identity: all cases retain their prior question and accepted-option IDs; changed distractor meanings use fresh IDs.
- Purpose: correct the two reported cancellation-boundary ambiguities and replace several short single-error alternatives with complete competing lifecycle policies under the existing visible facts. This is not a character-count target.
- Mechanical validation is recorded separately; no independent semantic acceptance is claimed.

## ood-n08-b06-i001

- Objective: Detach one caller’s wait while preserving the shared job and its completion-owned file.
- Decisive fact: A second caller still needs the approved shipment revision from the same render.
- Nearest alternative: Canceling or closing the shared file at first-wait cancellation would interrupt the remaining consumer.
- Changed condition: The distractor now preserves the other caller’s job but closes its file too early, so it tests resource lifetime rather than restating a single obvious failure.
- Changed fields: `feedback.messages[2].targetId`, `feedback.messages[2].text`, `interaction.options[0].text`, `interaction.options[3].optionId`, `interaction.options[3].text`.
- Before/current whole-object fingerprints: `01bdea13d9ea0ed3f22ea19a9496e7702e4a5759083a8648e952207de0e2d7ce` → `8e6219a12f5d7c58d6ad41553a690c9ce9415f222bf1e96fea3687c481ea8490`.

## ood-n08-b06-i002

- Objective: Release an uncommitted room hold after timeout/cancel, but report a move that already committed.
- Decisive fact: The destination slot is temporary unless the move has committed.
- Nearest alternative: Waiting for coordinator reconnection can strand the slot after a pre-commit timeout.
- Changed condition: The competitor now states a lifecycle policy that differs at the timeout boundary.
- Changed fields: `feedback.messages[2].targetId`, `feedback.messages[2].text`, `interaction.options[0].text`, `interaction.options[3].optionId`, `interaction.options[3].text`.
- Before/current whole-object fingerprints: `959c6e649867c1c446ca25ed4a02e900cc40d62f2c26f16a2c1c49dc70a14ba2` → `ea3691cc5da34f001293548f99a3763eea5170e350ac5c865155d7a469d70771`.

## ood-n08-b06-i004

- Objective: Preserve the old catalog until publication and report the committed progress mapping.
- Decisive fact: Learners must keep seeing the old lesson when cancellation precedes publication.
- Nearest alternative: Hiding and later restoring the old lesson still creates an interval when it is unavailable.
- Changed condition: The distractor is a plausible staged publication policy but fails the visible old-catalog continuity fact.
- Changed fields: `feedback.messages[0].targetId`, `feedback.messages[0].text`, `interaction.options[0].text`, `interaction.options[1].optionId`, `interaction.options[1].text`.
- Before/current whole-object fingerprints: `0dd0f96183f089c19961739f7d0598e6a6b7b0cf4a417864c0777089e9bf055b` → `55922f18a2464e9a172149175a0cbed51d360b6a4da8e6260ad39215503beaf6`.

## ood-n08-b06-i005

- Objective: Cancel export cleanup without blocking continued board editing.
- Decisive fact: Participants must keep editing while canceled export output is closed and removed.
- Nearest alternative: Waiting for cleanup before reopening the board blocks the edits the case requires to continue.
- Changed condition: The alternative now describes a complete cleanup-and-resume policy with the wrong resource boundary.
- Changed fields: `feedback.messages[2].targetId`, `feedback.messages[2].text`, `interaction.options[0].text`, `interaction.options[3].optionId`, `interaction.options[3].text`.
- Before/current whole-object fingerprints: `4c31641042ab598bae92ac09c70df0437e48ebbf60dcc69854277e3e4681406b` → `84eb67e7ac8dab00cfed275fd3548c769e512b53eacc1a1608b0d9a1e01276e7`.

## ood-n08-b06-i007

- Objective: Publish a validated listing only after success; preserve the prior revision on pre-commit cancellation.
- Decisive fact: The candidate stays hidden until validation commits, and the prior revision remains visible when canceled before commit.
- Nearest alternative: Publishing early or deleting the prior revision violates one of those explicit visibility facts.
- Changed condition: The key drops the unsupported discard-candidate obligation, while alternatives state complete lifecycle policies that each violate a prompt fact.
- Changed fields: `feedback.details.scenarioApplication`, `feedback.details.errorCorrection`, `feedback.messages[0].targetId`, `feedback.messages[0].text`, `feedback.messages[1].targetId`, `feedback.messages[1].text`, `feedback.messages[2].targetId`, `feedback.messages[2].text`, `interaction.options[0].text`, `interaction.options[1].optionId`, `interaction.options[1].text`, `interaction.options[2].optionId`, `interaction.options[2].text`, `interaction.options[3].optionId`, `interaction.options[3].text`.
- Before/current whole-object fingerprints: `69f16e8f1a591eaabfe5092df6000d54c4378e10239111f42d06c15413ce039a` → `01e9398a32012cc27d660a066b3823c0920b5bb6b37546b3ddd76088da31ed59`.

## ood-n08-b06-i008

- Objective: Split only after both vendor checks pass; stop remaining checks on pre-commit failure.
- Decisive fact: Either check can fail before acceptance and the parent request must remain unchanged.
- Nearest alternative: Temporarily replacing the parent after only one check passes exposes a partial split.
- Changed condition: The alternative now presents a complete replace-and-restore policy, which the stated unchanged-parent boundary rules out.
- Changed fields: `feedback.messages[1].targetId`, `feedback.messages[1].text`, `interaction.options[0].text`, `interaction.options[2].optionId`, `interaction.options[2].text`.
- Before/current whole-object fingerprints: `23f85ac5b77536a8177ade41b6652415d1dec1cac95011194f66115e2d9265ab` → `0d57e8f45114a71f98dc2d073e10750e45a868aeb6f44dc9b7450b128c9270ab`.

## ood-n08-b06-i009

- Objective: Keep the current member until approval; release only the new transfer hold if canceled earlier.
- Decisive fact: The existing reservation remains with the current member while the transfer is pending.
- Nearest alternative: Releasing both the transfer hold and existing reservation violates that boundary.
- Changed condition: The competing policy is a plausible cleanup action applied to too much state.
- Changed fields: `feedback.messages[1].targetId`, `feedback.messages[1].text`, `interaction.options[0].text`, `interaction.options[2].optionId`, `interaction.options[2].text`.
- Before/current whole-object fingerprints: `2f65d00c28a8bbdfc34391620d59044da80b8c86188a384760868e0423b28216` → `b3a71a4db285b0b814073ad92f9c240c97e503f034bb0628766cb4aed8bf5c8d`.

## ood-n08-b06-i011

- Objective: Release a pending hold on pre-acceptance cancellation while keeping a confirmed reservation valid.
- Decisive fact: A confirmed reservation remains valid after acceptance.
- Nearest alternative: Canceling an already confirmed charger reservation violates that stated outcome.
- Changed condition: The alternative now covers both the pending hold and accepted reservation lifecycle, making its precise state error assessable.
- Changed fields: `feedback.details.errorCorrection`, `feedback.messages[2].targetId`, `feedback.messages[2].text`, `interaction.options[3].optionId`, `interaction.options[3].text`.
- Before/current whole-object fingerprints: `845b19d275783484832b7ca75443a1f7464a2efbc0a67b93b060669e0cc10cef` → `31c511084cfaa96df8d15155397890cafc4dcd34989e37e0442f7f32931ae5cd`.

## ood-n08-b06-i012

- Objective: Publish the candidate only through a successful compare-and-replace; discard if canceled first.
- Decisive fact: The current asset remains unchanged until the new revision is published.
- Nearest alternative: Reporting success when work starts can claim a replacement that has not completed.
- Changed condition: The accepted text was shortened while keeping the publication boundary; other choices remain case-specific failures.
- Changed fields: `interaction.options[0].text`.
- Before/current whole-object fingerprints: `b06f21bdd80dd72d3e2b52f0da03175c472c414e5173417a3cf5c4bba72e2ec4` → `55792e063f3702eb489e44789c5c1a3dba395342c4e5f64a70433892334d92f3`.

## ood-n08-b06-i013

- Objective: Approve only after a successful license result; cancellation before that result leaves the territory unapproved.
- Decisive fact: No approval is visible before the check completes; cancellation before its result leaves it unapproved.
- Nearest alternative: An approval on pre-result cancellation directly violates that boundary.
- Changed condition: The key removes the unrequired cancellation-propagation mechanism, and the third alternative becomes a plausible but explicitly invalid approval policy.
- Changed fields: `feedback.details.scenarioApplication`, `feedback.details.errorCorrection`, `feedback.messages[2].targetId`, `feedback.messages[2].text`, `interaction.options[0].text`, `interaction.options[3].optionId`, `interaction.options[3].text`.
- Before/current whole-object fingerprints: `3ca49a024b362e89c7a1eaf799c92fea104e4b54ddedad1760470c4401d14fa6` → `0ec007fc34c72bf1677e5df19e6750db0517b53be0c8f2120f7fa0630261fcc9`.

## ood-n08-b06-i014

- Objective: Keep the existing aircraft/battery mapping until acceptance; release this operation’s hold if canceled first.
- Decisive fact: The current mapping remains valid until replacement acceptance.
- Nearest alternative: Replacing early or reporting canceled after commit violates the visible lifecycle boundary.
- Changed condition: The key is concise while retaining the two stated states; alternatives remain tied to the case.
- Changed fields: `interaction.options[0].text`.
- Before/current whole-object fingerprints: `3172f3a07171a4a470ec2ff20f7e34d61a687e733f5cfe5627ee6c36373c9f31` → `90ed7a3bae94e5be3273721d273b2947a34a2fbba0864494dd9076ca976bb6bd`.

## ood-n08-b06-i018

- Objective: Keep the old recording until the replacement completes; dispose of the temporary file on cancellation.
- Decisive fact: The temporary file is incomplete until transcoding finishes and must be disposed if canceled.
- Nearest alternative: Keeping it for resumption conflicts with required disposal; publishing it early exposes partial bytes.
- Changed condition: The shortened key preserves the old-pointer and temporary-resource boundaries while the changed alternative is a credible recovery workflow ruled out by disposal.
- Changed fields: `feedback.messages[0].targetId`, `feedback.messages[0].text`, `interaction.options[0].text`, `interaction.options[1].optionId`, `interaction.options[1].text`.
- Before/current whole-object fingerprints: `ec9a6c9100b54b846f72ea88031280e1862612ab891fab9c269434e405ba037c` → `793a4e017ba4ef98bfea57645694d6b5d5e0806ad9ce94c03b3313ba3770da1c`.
