# N07 B05 v3 semantic review

**Verdict: PASS for this proposal unit.** Frozen input `review-inputs/N07-B05-v3.json` SHA-256 `29555ebae14dd0a5df967178939d0c7c46bbd22996f8eeaf7a3b43618af113b7`. The v2 review was REVISE only because i019’s versioned-message adapter could also satisfy the prompt.

## Bounded correction: i019

The v3 distractor `n07b05_i019_renumber_settlement_fields` proposes renumbering existing settlement fields and sending that payload directly to unchanged workers. The prompt requires those older workers to keep settling records written by the new service. Since those workers still read the old field tags, moving the values leaves the expected settlement fields absent. The replacement therefore fails a visible requirement, unlike the former adapter option, which could have translated for old workers. The option’s new ID correctly reflects the materially different misconception.

The corrected wrong-option feedback and ErrorCorrection Details both identify the old-tag/new-tag mismatch. The feedback’s final sentence about a new message version adds context not needed for this option, but the first sentence states the decisive failure clearly; it does not make the diagnosis inaccurate. The official [Proto3 language guide](https://protobuf.dev/programming-guides/proto3/) confirms that field numbers identify wire fields and that renumbering existing fields is wire-incompatible.

The accepted answer remains “Add the memo at a fresh tag, with absence retaining the existing empty-memo meaning.” The prompt states that absence has the same meaning as empty memo, and the remaining visible constraints preserve old workers. Thus the fresh-tag answer has one supported compatibility path. The accepted QID and option ID remain unchanged; the new wrong choice uses a distinct ID.

## Reused evidence and limits

The correction receipt binds exactly one changed whole object and 17 unchanged objects. I independently reviewed the changed i019 option and its target feedback/Details. The other 17 objects are exact canonical-JSON matches to v2 and reuse their item-level PASS findings, identity decisions, and cohort-level option-presentation assessment from [the v2 review](SEMANTIC-N07-B05-v2-QA.md). The mechanical receipt reports 18 objects and 90 original/reversed scoring cases PASS; that is structural/scoring evidence, not the basis of this semantic verdict.

This accepts B05 v3 at proposal level. Final N07 cross-unit review against the other current units and accepted N01–N06 remains pending. No source, producer, consumer, admission, runtime, native, Premium, or full-BIZQ acceptance is claimed.
