# CH-01 independent runtime acceptance — PASS

2026-10-04, independent reviewer gpt-6-luna/high, separate from implementation. Original criteria: [briefing](BRIEFING.md). Design conditions: [review](DESIGN-REVIEW.md). Controller read the actual final TAP and matching source/diff.

From `patternly-content` after evidence closure:

```sh
node --test ../patternly/docs/evidence/CH-01/independent-qa.test.mjs tests/contentReviewConsole.test.mjs tests/bizq01-source-slice.test.mjs
```

Final independent frozen run **23/23**, no failed/cancelled/skipped. [TAP](independent-final.tap), [accepted hashes](ACCEPTED-SOURCE-SHA256.json). Worker focused run15/15; root syntax/diff checks passed. Exact module/test/README/schema/validator/independent-artifact hashes matched before and after. Moving the artifact from active to evidence preserves relative import depth and bytes.

Independent probes: actual copied CLI writes a fixture review under OS temp, a new CLI process reopens it and verifies exact SHA256 of temporary source bytes; a separate Node process writing through a directory symlink receives busy while the live owner's sidecar remains; four parallel real HTTP POSTs commit four distinct identities and a fresh service confirms all. Existing tests cover write/rename failure without memory/file publication, stale instance merging, same-item writes, batch/single with retained committed prefix, private mode, temp collision, foreign lock replacement, missing-parent creation, valid leaf symlink, dangling symlink/hardlink rejection, invalid latest store/schema/date, postcommit warning and blocked next write. Warning is wired before refresh in the local UI; no browser automation claimed. Q14/source-slice regression passes and [Q14 bytes](Q14-PRESERVATION.json) are unchanged.

Discarded setup evidence: lexical macOS `/var`/`/private/var` and `/tmp` aliases prevented some injected faults and lock gates from reaching the intended stage; fixtures now use realpath and explicit fault-hit assertions. Independent CLI expectations were corrected to use the fixture's actual source bytes and top-level projection fields. These were harness corrections, not acceptance passes. No production code changed during the final independent rerun.

Root full canonical gate **PASS168/168**, exit0, no failed/cancelled/skipped, duration149720.729ms. [TAP](canonical-final.tap), [baseline and pins](CANONICAL-BASELINE.json). Initial archive-only run164/168 had four missing-Git-history errors (`git show`/`git log`); private Git metadata/index at the exact baseline resolved the environment, then the complete rerun passed. Shared checkout outputs remain untouched. All three implementation hashes and three app pins matched after completion.

Reproduction: create an OS temporary parent with siblings `patternly-content` and `patternly`; archive content baseline4ab3301dd422ba432705f38d7a1c4bdf5062751f into the first and overlay the three files in CANONICAL-BASELINE.json from this accepted implementation. Create private Git metadata with `git clone --shared --no-checkout` from the content checkout into another temporary directory, move that clone's `.git` into the archived content sibling, then run `git update-ref HEAD <content baseline>` and `git read-tree <content baseline>` there. This uses private refs/index and read-only borrowed objects. Link the sibling app checkout with matching recorded app pins/dependencies; its admission verifier and deterministic test are read-only. Run `npm run test:canonical` inside the temporary content sibling. Generated dist/evidence remain in that snapshot. Do not run this output-producing gate concurrently in BIZQ's shared checkout.

Boundaries: local real FS/Node HTTP/process/CLI, no actual repo outcome, source activation, service/device or external effect. Same-directory rename is tested; no fsync/power-loss guarantee. Stale sidecar requires operator verification/recovery, never automatic age/PID removal. Reads keep their existing local committed snapshot; subsequent writes reread validated latest disk. SEC06 remains separate.
