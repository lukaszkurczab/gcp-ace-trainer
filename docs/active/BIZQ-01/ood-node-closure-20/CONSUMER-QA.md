# Independent consumer QA — package 20

**Verdict: PASS for the bounded source-to-app consumer package.** The app test binds the nine reviewed N04 payloads to current source and bundled runtime, verifies stable-ID answer/scoring/feedback behavior, and confirms the ordinary N01 pools remain unchanged. This does not accept native behavior, full BIZQ-01, or external publication.

The reviewed app test is `src/content/bizq01OodNodeClosure20.test.ts`, SHA-256 `46522652e7956bc627863c14cd37d795179c9662f7512296cca36f27cd7f2d3f`. The exact regenerated OOD artifact is SHA-256 `fa015cbcdb5b4a0865c39ce7958a4832a08e8b10811dd7f396dc12cc79c6de82`; the generated content-lock file is `81696237c0f1f87d17bd7d0f56b24a8b70cf89670d306831f55fa0666f74efd4`. The artifact identifies OOD content version `object-oriented-design-interview-authoring-v2026.10.04-bizq01-20`, with 1,413 questions. The synced content source HEAD is `141efee6dee5e59b5e746fe410a15334693db0f5`.

The test checks all 162 items against frozen proposal hashes and current source hashes. It verifies 144 new identities and 18 retained B05 identities, excludes all retired IDs from current source/runtime, runs every option through the real scorer in original and reversed order, checks stable-ID feedback and exact pre-answer projection, and compares all three normal N01 pools to the accepted 136-item N01 node. It also retains the 152-item N02 and 162-item N03 counts without admitting N04 to those N01 pools.

I ran the new test together with the matching existing N01/N02/N03 consumer tests:

- `node --import tsx --test src/content/bizq01OodNodeClosure20.test.ts src/content/bizq01OodSourceReplacement.test.ts src/content/bizq01OodSourceReplacement12.test.ts src/content/bizq01OodUnitCohort13.test.ts` — **24/24 passed**.
- `npm run check:content-release` — **passed**, reporting source HEAD `141efee6dee5e59b5e746fe410a15334693db0f5` and inventory `9/117/943/16077`.
- Root’s complete app static gate passed **1,853/1,853 executed tests**, with 4 existing dedicated skips, plus recovery, typecheck, content-boundary and runtime-privacy-boundary checks (`ROOT-APP-STATIC.log`).

The content producer receipt and local admission are separate evidence: the producer remains bounded to the nine N04 arrays, and the app lock/runtime pin is bound to the exact synced artifact. The same-ID B05 entries are checked for current source/runtime parity; existing consumers retain content-version/artifact identity checks for historical attempts. The app test itself does not claim that old attempts can be rescored against the new artifact.

The generated lock/runtime and exact local verified-artifact admission are within the already authorized local boundary. No external publishing or deployment was performed. Native runner acceptance, Premium entitlement/UI claims, pool expansion, and full BIZQ-01 closure remain outside this packet.
