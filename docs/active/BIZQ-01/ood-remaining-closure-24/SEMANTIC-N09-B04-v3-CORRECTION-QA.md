# Independent correction review: N09-B04 v3

**Verdict: PASS** for the bounded correction. The previously identified correction defects are resolved, and the unchanged prompt/key and prior accepted-meaning evidence remains applicable.

## Bindings

- Current v3 proposal SHA-256: 0e20cea69df7dc17306c7180c5a064f2c170fab66a2901a49eaa34f3551e7d8c.
- Prior reviewed v2 proposal SHA-256: 4d5a76202d6cd470c2de5516b03fa35c3c4ee6aaed3fb2ae52770afa12cfbf8c.
- Manifest SHA-256: 0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612.
- Contract SHA-256: 6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27.
- Spec SHA-256: c10ce086ecd3b58d7d776a458cb453d0161ac4519ca2474deba952122ceac8a3.
- Whole-object fingerprints use repository canonicalJson(question) plus SHA-256; answer selection is by answer.optionId.

## Review findings

The v2 defect affected only five path-target messages: i008, i009, i012, i014 and i018. Each v3 message now describes the actual selected wrong option rather than a stub. For example, i008 explains that taking the first list item can select a withdrawn request; i009 explains why a canned close result cannot test saved provenance; i012 names the missing two-row/history verification; i014 explains the identity change; and i018 explains the mismatch between a stubbed sorted result and stored positions. The other 13 items retain the already reviewed meaning and aligned diagnostics.

The matching contract checker/scorer run accepted all 18 items, scored each accepted answer correct and every one of the 72 wrong options incorrect, preserved scoring when option order was reversed, and found exact feedback-target sets. These checks verify structure and option-ID scoring; the content conclusion above is from direct inspection of the correction fields.

## Per-item binding

| Item | Question / accepted answer identity | Changed leaf scope | Before → current canonical whole-object SHA-256 |
|---|---|---|---|
| ood-n09-b04-i001 | SAME_ID / n09b04_i001_contract_assertion | none | `8b0cf56000b7ab4af41a02d57c4dd1fc52c2841f95c499acdaaa9f306878acb6` → `177fed3133a007e1d86a4cb60a9054dd6f67d2e3dd56f1213d0c518ba1b343f4` |
| ood-n09-b04-i002 | SAME_ID / n09b04_i002_contract_assertion | none | `edccd651968fb8ab64e29ce3cc2036d4c8a280fc09e4620f4adae5477b086217` → `671e65a1612f9cdb3840b16ecf48b42495fdcc1d9a1488e637da49410a1d7fb9` |
| ood-n09-b04-i003 | SAME_ID / n09b04_i003_contract_assertion | none | `0280c3f972b005c2c314416b24e692be94eebd0c920729fe9fe74a43001aa32b` → `2a91313278f9b13b27cbb1900dc8142d116b48e370595a963716ddac81a46757` |
| ood-n09-b04-i004 | SAME_ID / n09b04_i004_contract_assertion | none | `5975036f6ea54f53ecf7e321f6826b5e1a661444268e47efaf01313f95f2f879` → `63efe2847eb0490f7a57b8b276df11945b888a01a781ba4f7fe9b94480ce1ce0` |
| ood-n09-b04-i005 | SAME_ID / n09b04_i005_contract_assertion | none | `2ef86a0e1e9a6fbd11bb8f354e4d475ebda7d7cf3ce1dba6d5ba17fc0ca12f8a` → `68ddd71fe906ca2ea937ba6ad42f2a3cf6a4df150ecd092773316b7fa9b4d37d` |
| ood-n09-b04-i006 | SAME_ID / n09b04_i006_contract_assertion | none | `d601063dbfeeb134e3c4fa37d41070f3a28875e679721f300b0fbac2e54423a7` → `f5713acd3dd1bf870a382ef6a3c3b4c7aa7847fa182d4a39028531b4c70a0f07` |
| ood-n09-b04-i007 | SAME_ID / n09b04_i007_contract_assertion | none | `0c32f36dcd8c5c4614ffc68bfc0d896330af436586e54d7b6760cc2de8bf3160` → `2dde0b753fbaf70e2445d0340e06dd9697f4482e9b386595818256badb826850` |
| ood-n09-b04-i008 | SAME_ID / n09b04_i008_contract_assertion | feedback.messages.1.text | `dc575764b45aee4afa60971491cdfd85f1c64cd2819e4f6aabcd6727772346fb` → `b92f82855aa79080c48041ec301b6ef29381f6c41c0ce341ffbd6bf9a7751612` |
| ood-n09-b04-i009 | SAME_ID / n09b04_i009_contract_assertion | feedback.messages.1.text | `9202771bd3db0d29ba7f7ba036953d2e4cc01ca00183bd57fcc33026b6704378` → `a1b52ae2e7dffbb5dac8f8b29fc28f0cfa2f762cc3aeefc09f8ab91c083f1716` |
| ood-n09-b04-i010 | SAME_ID / n09b04_i010_contract_assertion | none | `50ec5882a003ad92ac0d47c3bba7360aa6fb184445480a366909e9dbcf6d661d` → `dac77ae000e4038921ae999cf6613bbfc6557d9ed4a05c8a9e04d53e2d9a8115` |
| ood-n09-b04-i011 | SAME_ID / n09b04_i011_contract_assertion | none | `e264ef848b70de8be9b526b03d7ab886f29161dbecfe1d6507873dd82e44796d` → `ce89f9a88517ae813bd1167899765db66375a88b68004c9f37adc755d22e3b50` |
| ood-n09-b04-i012 | SAME_ID / n09b04_i012_contract_assertion | feedback.messages.1.text | `095a108dcbae34fc8931da3eaf4fedfb3ebf940c97f7c490cec035a0b52c8cfa` → `c727339003cd9afee9ebe5f0ecd5e7bc33f406a8b045a482d732da456ecef3cf` |
| ood-n09-b04-i013 | SAME_ID / n09b04_i013_contract_assertion | none | `228d758eba24d723c1eff222c8d835e894207ccf50108bc7fade6d3e36407c47` → `eb24d8047c8d7a1d2c25babd218c30081668e799e519f46fb3b1549d65a623d3` |
| ood-n09-b04-i014 | SAME_ID / n09b04_i014_contract_assertion | feedback.messages.1.text | `ffe41bca0a7d8edd72b09230fabbad52c66b53e39298b887085ae76c4c47f503` → `4ff31ccdf8ef245847d7d16f3cba5e6324e5cc8121b4c5fad57557812e68ce0a` |
| ood-n09-b04-i015 | SAME_ID / n09b04_i015_contract_assertion | none | `178df614cdf6d0c686a0505fc1286475003f7ebcdc825bd2ad5ac3c14e3afe0f` → `2f3e2eed3620c4d80f678a0a5a2b5a5a6877713c6e9ddf30342e73b0aaaee7fd` |
| ood-n09-b04-i016 | SAME_ID / n09b04_i016_contract_assertion | none | `1d57f7eccaf773ece9ab9911a8f5d3a016191d8dd8697201b7faf9e5e5d99d23` → `c363278e8b3325bf69611e03558b2810a78076499e1012cbbc2d8ae098227644` |
| ood-n09-b04-i017 | SAME_ID / n09b04_i017_contract_assertion | none | `c5139aada5f2685ba8baef98a5d1fbfce0c230e50a4fbf64c89db23c832661b5` → `44f67e60ad723defb0b5c4d7599ee982c5a1c3aa08b6458ec3129e106d74cc40` |
| ood-n09-b04-i018 | SAME_ID / n09b04_i018_contract_assertion | feedback.messages.1.text | `bdd6559ffed42d55d6366d5c3b2d4c8da81f8fedd31861b2edcb9d505ce74804` → `72340133e0fac976a43222cc6250da6da7e10037336834e47b5c90d573cb47f6` |

This accepts only the bounded N09-B04 correction and matching unchanged findings; it does not accept the complete N08/N09 map, source/producer activation, runtime/admission, native/Premium, or full BIZQ-01.
