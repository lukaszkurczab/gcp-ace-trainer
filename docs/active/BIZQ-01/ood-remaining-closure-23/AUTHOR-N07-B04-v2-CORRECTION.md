# N07 B04 v2 bounded author correction

**Status: ready for independent re-review; not semantic acceptance.** The frozen B04 v1 review identified one issue: all 18 accepted options used a complete sequence while alternatives often named only a partial or misordered action. This revision addresses that form cue without changing the unit’s operation-scoped identity and unit-of-work decision.

I preserved all question IDs and accepted `owner_preserves_contract` option IDs. Each accepted choice is now a concise, case-specific action. One competing option per case describes a complete alternative approach and its corresponding diagnostic explains the concrete failure in that scenario. The remaining options retain their existing meanings. The revisions preserve each case’s local save boundary and after-commit effects; they do not imply that a local database unit atomically commits an external notification, payment, print, or export provider.

The existing B04 checker passes 18 whole objects and 90 original/reversed option-scoring cases, including feedback-target binding. This verifies structure and scoring only. No option-count or word-length rule was added; revised option specificity varies with the case.

The immutable v1 review remains bound to its original proposal. Exact input and result hashes and per-item changed alternative IDs are in [the correction receipt](AUTHOR-N07-B04-v2-CORRECTION.json). Independent whole-object review is still required.
