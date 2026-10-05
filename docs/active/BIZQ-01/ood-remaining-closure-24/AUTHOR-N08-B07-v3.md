# N08-B07 v3 author correction

- Previous proposal SHA-256: `d656e287a7063d06aebf2dc42fc5f18ba4fba40d2cad08f96da06f75afab3318`.
- Current proposal SHA-256: `0b1a94aa9b8f8eb81d1c270ff8a63dd585a6c85700f5c968a2509ae2920610a6`.
- Source binding: `../patternly-content/content/object-oriented-design-interview/concurrency_thread_safety_resources_and_failure_handling/OOD-N08-B07.json` SHA-256 `b535b0f1672a873e59c5f61c53fd9164f5bab43499801804990ff4134fdddf20`.
- Scope: ood-n08-b07-i001, ood-n08-b07-i003, ood-n08-b07-i007, ood-n08-b07-i008, ood-n08-b07-i009, ood-n08-b07-i010, ood-n08-b07-i011, ood-n08-b07-i013, ood-n08-b07-i014, ood-n08-b07-i015, ood-n08-b07-i017, ood-n08-b07-i018.
- Accepted question and answer IDs remain unchanged; rewritten distractors have fresh IDs.
- Aim: replace short isolated-error alternatives with recognizable competing lifecycle policies that fail the exact prompt boundary. No answer-length or option-count target is used.
- The mechanical validator/scorer results are separate from independent semantic acceptance.

## ood-n08-b07-i001

- Decision: Close both job-owned resources and publish only the completed render.
- Visible fact: The failed run must close its dataset handle and remove its temporary file.
- Nearest alternative: Keeping resources in a registry delegates cleanup to a later job after this owner has failed.
- Changed condition: The revised competing policy preserves the surrounding lifecycle steps but fails the specific owner/close/commit boundary stated in the prompt.
- Changed fields: `feedback.messages[2].targetId`, `feedback.messages[2].text`, `interaction.options[3].optionId`, `interaction.options[3].text`.
- Whole-object SHA-256: `dac1ff05258bc620292499ca2ea2c4b056abf41e61a1876d68b40bb7c232ad31` → `12c3eb98b5e7732179921d68ffecec32930baa33f3e750a96ab44d0e44ec7140`.

## ood-n08-b07-i003

- Decision: Close each upload attempt’s stream before retry while retaining the inspection draft.
- Visible fact: A retryable failure ends that upload attempt, but the inspection draft remains available.
- Nearest alternative: Reusing the open stream crosses the stated per-attempt lifetime.
- Changed condition: The revised competing policy preserves the surrounding lifecycle steps but fails the specific owner/close/commit boundary stated in the prompt.
- Changed fields: `feedback.messages[0].targetId`, `feedback.messages[0].text`, `interaction.options[1].optionId`, `interaction.options[1].text`.
- Whole-object SHA-256: `2e770dd1e05a966b2bd4b0914684eec8b54fda48c1ad9c0da12762b51942909b` → `2dea0f0b44e593ce6a86975d110a3ca643db1c2db426f4590163552cd0b4bd33`.

## ood-n08-b07-i007

- Decision: Release a temporary room hold on denial or cancellation; transfer it to the booking only on commit.
- Visible fact: Denial ends the move operation and releases its hold.
- Nearest alternative: Caching a denied hold for another request keeps a resource past its operation’s end.
- Changed condition: The revised competing policy preserves the surrounding lifecycle steps but fails the specific owner/close/commit boundary stated in the prompt.
- Changed fields: `feedback.messages[0].targetId`, `feedback.messages[0].text`, `interaction.options[1].optionId`, `interaction.options[1].text`.
- Whole-object SHA-256: `21a012dc7e99a53f8297d860d591d73cb688bc37474bb06d19307dab4897da8c` → `ea4e71cc2ebeffe872190a4e5ba37f8ce0c92c161066ca778f63f7180caced0b`.

## ood-n08-b07-i008

- Decision: Close each command’s hardware session on completion or failure; keep exhibit mode with the controller.
- Visible fact: The command owns the session; the controller owns mode state.
- Nearest alternative: Passing the failed command’s open session to another command crosses that ownership boundary.
- Changed condition: The revised competing policy preserves the surrounding lifecycle steps but fails the specific owner/close/commit boundary stated in the prompt.
- Changed fields: `feedback.messages[0].targetId`, `feedback.messages[0].text`, `interaction.options[1].optionId`, `interaction.options[1].text`.
- Whole-object SHA-256: `6961086bec69a7718b379982ca41b540c1de464aa05b9564694750c7efbb249c` → `6d42bb03100ca5e86b49df617fdc01567f06d5702c5c9d110ae49bf9f0352a69`.

## ood-n08-b07-i009

- Decision: Close the cursor after the scan while preserving the stable progress records.
- Visible fact: The scan owns the cursor only while it reads; closing it does not delete or re-key progress.
- Nearest alternative: Returning the scan’s live cursor to learner clients gives them ownership after the scan ends.
- Changed condition: The revised competing policy preserves the surrounding lifecycle steps but fails the specific owner/close/commit boundary stated in the prompt.
- Changed fields: `feedback.messages[2].targetId`, `feedback.messages[2].text`, `interaction.options[3].optionId`, `interaction.options[3].text`.
- Whole-object SHA-256: `acd5855b75c45dd1cc465e0815452cfc1b544bc1080401119db03bc01d3fcce8` → `db6a1bd067dcde1bf99042096be72f7425b2681e4ff556c6ba2c7d8bafe71794`.

## ood-n08-b07-i010

- Decision: Close the export cursor and file on cancellation while the live board remains open.
- Visible fact: Cancellation closes both resources owned by export, but the board continues accepting strokes.
- Nearest alternative: Keeping export resources open for a later run extends them past the canceled operation.
- Changed condition: The revised competing policy preserves the surrounding lifecycle steps but fails the specific owner/close/commit boundary stated in the prompt.
- Changed fields: `feedback.messages[2].targetId`, `feedback.messages[2].text`, `interaction.options[3].optionId`, `interaction.options[3].text`.
- Whole-object SHA-256: `44d8f6358eb66dc3f0f1a46eaf3cc6b227375731b15a9f91453ae710c77d1117` → `4d30c457793c0b409c19006e24a824d9b1c8bd8e19dc47ffb5219078188ba9c1`.

## ood-n08-b07-i011

- Decision: Cancel the attempt’s timer on success and return retryable failure with no timer running.
- Visible fact: A failed attempt must leave no timer active when it returns.
- Nearest alternative: A later cleanup guess does not guarantee the timer is gone at return.
- Changed condition: The revised competing policy preserves the surrounding lifecycle steps but fails the specific owner/close/commit boundary stated in the prompt.
- Changed fields: `feedback.messages[2].targetId`, `feedback.messages[2].text`, `interaction.options[3].optionId`, `interaction.options[3].text`.
- Whole-object SHA-256: `1cf30347f677e49e86cb3f9ba0b80e80fce4c60c7da0b5abb773bc16eac2bf25` → `1c5963f3d4fd89bc46fa2b70c1c5dbb6640575b89ab319bebafcdc0ab1e756e7`.

## ood-n08-b07-i013

- Decision: Close opened streams and cancel remaining checks before leaving the parent unchanged on failure.
- Visible fact: If either vendor check fails, the split is not accepted and its parent stays unchanged.
- Nearest alternative: Publishing one child while retrying the other exposes a partial split.
- Changed condition: The revised competing policy preserves the surrounding lifecycle steps but fails the specific owner/close/commit boundary stated in the prompt.
- Changed fields: `feedback.messages[1].targetId`, `feedback.messages[1].text`, `interaction.options[2].optionId`, `interaction.options[2].text`.
- Whole-object SHA-256: `cb8d3bc8896c30ba52ebeee1fd60132522d9539818cfca90d46a0e69438fb874` → `5726189b6110451cd2bbd4e4b987aa6ce9ff334f46989a893b0999eb669bb228`.

## ood-n08-b07-i014

- Decision: Release the temporary token on denial/cancel and transfer its reservation at commit.
- Visible fact: The transfer operation owns the token through commit or denial.
- Nearest alternative: Delegating token release to a screen can release it after commit, when the booking owns the reservation.
- Changed condition: The revised competing policy preserves the surrounding lifecycle steps but fails the specific owner/close/commit boundary stated in the prompt.
- Changed fields: `feedback.messages[2].targetId`, `feedback.messages[2].text`, `interaction.options[3].optionId`, `interaction.options[3].text`.
- Whole-object SHA-256: `4d20dc7215588573ac308481c9f752d70a54dc0fc23666f53440c739a5feb53b` → `f7bbba58efde2735ee9a46d4bd846cfa57fa28fc671e31905b24c3c5f8e62bae`.

## ood-n08-b07-i015

- Decision: Publish only a validated package; the build closes its streams and discards its temp file on failure.
- Visible fact: The build owns its component streams and temporary output through validation.
- Nearest alternative: A shared stream cache lets resources outlive the build that opened them.
- Changed condition: The revised competing policy preserves the surrounding lifecycle steps but fails the specific owner/close/commit boundary stated in the prompt.
- Changed fields: `feedback.messages[2].targetId`, `feedback.messages[2].text`, `interaction.options[3].optionId`, `interaction.options[3].text`.
- Whole-object SHA-256: `36e3a90aa59520480fed172edfc3c0cfd952a4a8e1a448a4a59218a9a117c411` → `3109c441baccaa771d687cea9d2a2c57a72039dfc739e17e1f641df451b40825`.

## ood-n08-b07-i017

- Decision: On conflict or cancellation release both locks and discard the temporary record without changing the asset.
- Visible fact: The merge operation owns both locks and its temporary record until success or failure.
- Nearest alternative: Returning these resources to another job can publish or retain them after the merge reports conflict.
- Changed condition: The revised competing policy preserves the surrounding lifecycle steps but fails the specific owner/close/commit boundary stated in the prompt.
- Changed fields: `feedback.messages[2].targetId`, `feedback.messages[2].text`, `interaction.options[3].optionId`, `interaction.options[3].text`.
- Whole-object SHA-256: `acb4efc6bd76ca515affccda07a661895c78e30863bc15e6e24d68ab59823f52` → `30b34f30b10000724798fa7fdaa189a5225e3ec8ca819b9d94cf0e254266a007`.

## ood-n08-b07-i018

- Decision: Close the response stream on every exit and approve only after successful clearance.
- Visible fact: The clearance operation owns the stream until it has read the result.
- Nearest alternative: Returning the unread stream while clearance still consumes it splits ownership.
- Changed condition: The revised competing policy preserves the surrounding lifecycle steps but fails the specific owner/close/commit boundary stated in the prompt.
- Changed fields: `feedback.messages[2].targetId`, `feedback.messages[2].text`, `interaction.options[3].optionId`, `interaction.options[3].text`.
- Whole-object SHA-256: `716229249faebbe34e82b1ad7b9fb6467740c051d808cc79524da3a586ab5589` → `7e6569211f73b7879ef60f2a030d0268a1018a7484f4d9ca677a70afbd5bc206`.
