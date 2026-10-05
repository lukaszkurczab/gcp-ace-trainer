# Independent correction review: N09-B02 v3

**Verdict: PASS** for the bounded correction. The previously identified correction defects are resolved, and the unchanged prompt/key and prior accepted-meaning evidence remains applicable.

## Bindings

- Current v3 proposal SHA-256: f38fc1f31683304f145fc6f8fa8739b94ac2368aa79f73b9a152616df45fa305.
- Prior reviewed v2 proposal SHA-256: 9765d3cdc2f9f5c2d0ef9425236d9368d880aaaf4d28dfeca3a5e1902cbeb8ab.
- Manifest SHA-256: 0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612.
- Contract SHA-256: 6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27.
- Spec SHA-256: c10ce086ecd3b58d7d776a458cb453d0161ac4519ca2474deba952122ceac8a3.
- Whole-object fingerprints use repository canonicalJson(question) plus SHA-256; answer selection is by answer.optionId.

## Review findings

The v2 defects were the malformed, generated-sounding wrong-option messages across the unit and the second plausible clock construction in i001. In v3, the messages are complete, grammatical and tied to their wrong-option IDs; they explain why each chosen construction policy fails under the item’s facts. In i001, the alternative now explicitly fixes one shared clock to the same instant for both requests. Because the stem requires constructing requests on opposite sides of the deadline, that choice cannot satisfy both cases; the accepted per-instance controllable-clock answer is unique. Its changed alternative has a fresh option ID, while question IDs and the accepted answer ID remain stable.

The matching contract checker/scorer run accepted all 18 items, scored each accepted answer correct and every one of the 72 wrong options incorrect, preserved scoring when option order was reversed, and found exact feedback-target sets. These checks verify structure and option-ID scoring; the content conclusion above is from direct inspection of the correction fields.

## Per-item binding

| Item | Question / accepted answer identity | Changed leaf scope | Before → current canonical whole-object SHA-256 |
|---|---|---|---|
| ood-n09-b02-i001 | SAME_ID / n09b02_i001_explicit_assembly_input | feedback.messages.0.text, feedback.messages.1.text, feedback.messages.2.text, feedback.messages.3.targetId, feedback.messages.3.text, interaction.options.4.optionId, interaction.options.4.text | `38282e5536a478bd9f918ae246a496aec14a0e9a605479d1174720c6c0af0bf3` → `70a2126a1cca2e9f4418c363a45fbd98879e41722d8a23fd53628a08e9539469` |
| ood-n09-b02-i002 | SAME_ID / n09b02_i002_explicit_assembly_input | feedback.messages.0.text, feedback.messages.1.text, feedback.messages.2.text, feedback.messages.3.text | `c9388c636316c635388653d9a3231ded19c2d44d8ca08a2308c23c5a27499946` → `ee57d84372bbeedd4aef7237a5122ebcd73f23c7e46bf7cf449b9fc0dfdf5db6` |
| ood-n09-b02-i003 | SAME_ID / n09b02_i003_explicit_assembly_input | feedback.messages.0.text, feedback.messages.1.text, feedback.messages.2.text, feedback.messages.3.text | `b549560f05449391883969e1bf22f479ef8713fce65651e1459478256804837a` → `03b98063ce583a001cb217dd2421f0d0c1353b2e17e20e4c0a462777f94c13b0` |
| ood-n09-b02-i004 | SAME_ID / n09b02_i004_explicit_assembly_input | feedback.messages.0.text, feedback.messages.1.text, feedback.messages.2.text, feedback.messages.3.text | `567e0e4da502230cd1bb98a7ac7b4e7f64204b611b0a98b20b6cb584e7313050` → `dd99bbdb8e4ce9907354246a4ba4665f25fb2fa0ce947b75b2295d1b32f57101` |
| ood-n09-b02-i005 | SAME_ID / n09b02_i005_explicit_assembly_input | feedback.messages.0.text, feedback.messages.1.text, feedback.messages.2.text, feedback.messages.3.text | `5c70cc92995dc96198690fcad805b3c92733c26434adbc9ffd15e13d3c4581bd` → `18cde841516a546697437ccab78f57b5035ab0274254b6c9357afe872b5e4e66` |
| ood-n09-b02-i006 | SAME_ID / n09b02_i006_explicit_assembly_input | feedback.messages.0.text, feedback.messages.1.text, feedback.messages.2.text, feedback.messages.3.text | `a2a92e429dfcf80791247c20676d8f4720bb07183827d71ec41f8e07158eafa2` → `b582ba9c11519e72c7f12a196bdbf523a1d60fbb5b517c4ba5af071fe1ef6793` |
| ood-n09-b02-i007 | SAME_ID / n09b02_i007_explicit_assembly_input | feedback.messages.0.text, feedback.messages.1.text, feedback.messages.2.text, feedback.messages.3.text | `abf2b73010d97f5149cb5f5ed43b247eac4e09a14d8b70c7be2fae76fdd8e7a6` → `253ce3712793e46e16599648f71ad967be23613d1b72f27bd6aa6eda0537cee6` |
| ood-n09-b02-i008 | SAME_ID / n09b02_i008_explicit_assembly_input | feedback.messages.0.text, feedback.messages.1.text, feedback.messages.2.text, feedback.messages.3.text | `6a76f0ffff2492bfc9c39c673979326ed40f422e2c6ceaa45b83084b0489d375` → `423c9aafd8c552533443577b9487b8b7ddffe69b1a22deed4935cd70516c6e42` |
| ood-n09-b02-i009 | SAME_ID / n09b02_i009_explicit_assembly_input | feedback.messages.0.text, feedback.messages.1.text, feedback.messages.2.text, feedback.messages.3.text | `0e29c66179268562890fe2b57a0afb88a9187b29c9dfb7642924e6b129f3845b` → `0ec14c5a3129e4b74dee1b5d0baab4d4ac49435790ac9f4d3e1b252f225db273` |
| ood-n09-b02-i010 | SAME_ID / n09b02_i010_explicit_assembly_input | feedback.messages.0.text, feedback.messages.1.text, feedback.messages.2.text, feedback.messages.3.text | `bbb79e9f2d63c166b7458f9015c8cf1b7d13ecfd2a34ef13c29d6bdce3c5ebce` → `d5cb208d5ead9dacfd50391a404a28cd45cb1f144c1bcf27079aa6479b488c4b` |
| ood-n09-b02-i011 | SAME_ID / n09b02_i011_explicit_assembly_input | feedback.messages.0.text, feedback.messages.1.text, feedback.messages.2.text, feedback.messages.3.text | `953364d051e8f727caf582494905e591e12a0ef733f48558a49d50e511b5afba` → `a106937f831799523da5b03088c9375e9acfd28d5d789f6bcc514f0bbfcbd3a0` |
| ood-n09-b02-i012 | SAME_ID / n09b02_i012_explicit_assembly_input | feedback.messages.0.text, feedback.messages.1.text, feedback.messages.2.text, feedback.messages.3.text | `b09fa57e6fb9407f401f852ffa3c35f479a3bc998efe34384042a927f68929ad` → `801e33c77e1345bcd236ed7441bdf10de274625a9f687570f21642bfa4a626cb` |
| ood-n09-b02-i013 | SAME_ID / n09b02_i013_explicit_assembly_input | feedback.messages.0.text, feedback.messages.1.text, feedback.messages.2.text, feedback.messages.3.text | `a2c16786fb724e6424933a077010d877a08d4281f0c77106c20f868c2f1e516c` → `bce92654886957a93beb91ca049595ba8ba3f8928daf28c01861f9e811b3974a` |
| ood-n09-b02-i014 | SAME_ID / n09b02_i014_explicit_assembly_input | feedback.messages.0.text, feedback.messages.1.text, feedback.messages.2.text, feedback.messages.3.text | `1234cfe138e52f815144214abb00118ddcd9c7732f45eee891588086621e3a87` → `561a681a1deca05abd730ab8e910b4a1456c139b96c7af5e6a0ea948a8ca2aad` |
| ood-n09-b02-i015 | SAME_ID / n09b02_i015_explicit_assembly_input | feedback.messages.0.text, feedback.messages.1.text, feedback.messages.2.text, feedback.messages.3.text | `3fc83dbe01b6736cb8fa86d76e19d51b2eab8e0cc31eb1da243511b413ffa0ab` → `245ce982b10bd3635601da43eb6524ef40ac89a5f02f55c4a117dbef7ee3e527` |
| ood-n09-b02-i016 | SAME_ID / n09b02_i016_explicit_assembly_input | feedback.messages.0.text, feedback.messages.1.text, feedback.messages.2.text, feedback.messages.3.text | `6382dfd34b425a2d68f50611aafaa81af35364f74a4aafe29ba24be0c4d76567` → `32e04bd3740e7e519bfe9ec9ce31c088cffbc8adef8be1cf52f3aef98dc0cd98` |
| ood-n09-b02-i017 | SAME_ID / n09b02_i017_explicit_assembly_input | feedback.messages.0.text, feedback.messages.1.text, feedback.messages.2.text, feedback.messages.3.text | `a86b7bfbb0f5c2027ec22a5c934c79e9a3c442927c405b4eb90e3b3c87deda90` → `09a0b095433373a7df28d0bf7462322c669ad72e4b7b71f5b6b662a79783cf2d` |
| ood-n09-b02-i018 | SAME_ID / n09b02_i018_explicit_assembly_input | feedback.messages.0.text, feedback.messages.1.text, feedback.messages.2.text, feedback.messages.3.text | `0b55740ad589afa7bb1db57e073c5c24ccf26d7d27daf85542d81e09107a7af1` → `ba8b0af64272fa2c505e97c3aecb28d2d915dfe0283df8c489f6f8f7b32b03de` |

This accepts only the bounded N09-B02 correction and matching unchanged findings; it does not accept the complete N08/N09 map, source/producer activation, runtime/admission, native/Premium, or full BIZQ-01.
