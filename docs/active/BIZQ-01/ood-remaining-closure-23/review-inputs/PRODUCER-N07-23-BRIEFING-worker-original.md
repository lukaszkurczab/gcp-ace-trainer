# BIZQ-01 / N07 source producer design: v23

**Status:** Provisional fixed design, pending independent producer-design review. The prepared source map and proof bind the final reviewed 144-object N07 input; this briefing does not activate source, integrate a candidate, or grant admission/release authority.

## Cel

Dodanie nowej, zamkniętej wersji N07 na istniejącym OOD pipeline, z exact fixed identity map i możliwością odtworzenia poprzedniej v22 bez modyfikowania wcześniejszych proofów ani walidatorów. Pozostałe 1269 pytań OOD, accepted N01–N06 (945 items), osiem innych track artifact bytes i zwykłe pule N01 (136) pozostają poza mapą.

## Ustalenia

- Aktualna baza źródłowa: content commit `5a8e895379bb0abcbb5d7a1dc89fcf02167a823e`, version `object-oriented-design-interview-authoring-v2026.10.04-bizq01-22`, 1,413 pytań / 79 plików, QSet `c6cf903178b823fb71ac29040f3c5fa5f72c619d3adbb525fc7791756654ac3e`. Manifest N07: `07b9663946f5de9587434e9a3bd5836f71fa70dec772bfced94524ab3fc4fc01`; osiem wcześniejszych source arrays jest byte-exact compact JSON bez końcowego newline.
- Propozycja v23: `object-oriented-design-interview-authoring-v2026.10.05-bizq01-23`, pełny 1,413-item QSet `cdb6b644d1029b0ffc5d1a09cbaed2aecb3f7785d718bb056c5d6a0cbd5eeefa`; osiem source files / 144 question objects.
- Zamrożony map: `ROOT-N07-PRODUCER-MAP.json` SHA `f64e82bdf4a997d28a30c44774cd1280beec303620bda3e758150638b2ba9414`, freeze receipt `505ef849d7c259e42fa82857e67e161af6116c627e88289e57efb3d1cac6b274`, prepared proof SHA `f1f69a22382dd3acac3e1b0ec8122693265e31a21e2997e467b22985b3831d76`. Bieżąca rekonstrukcja obejmuje 34 replacements (16 w B05, 18 w B08) i 110 same-ID corrections (B01–B04: 72; B05: 2; B06–B07: 36). Replacements to dokładne actiony z accepted identity map, nie target liczbowy ani reguła dla innych zmian.
- Dla każdej pozycji map zapisuje w JSON briefing source path, node/unit, stary i nowy QID, identity action/reason, accepted option ID, źródła oraz SHA-256 całych before/current objects. To jest skrót wiążący do dokładnych plików map/proof; pełne obiekty pozostają w zamrożonym proofie.
- Current candidate source bytes w mapie są hashami UTF-8 `JSON.stringify(items sorted by questionId)`, bez końcowego newline. Dla actual v22 source każdy before raw SHA zgadza się z manifestem i rzeczywistymi bytes. Pełny proposed track został złożony z 79 plików, posortowany według istniejącego `compareStrings(questionId)`, i hash zgadza się z proofem.
- Root map wiąże per-unit semantic review oraz final cross-unit disposition; exact proof fixture pozostaje nieaktywny. Producer design and implementation acceptance is still pending.

## Podejście

 Dodać dokładnie jeden stały descriptor v23 i prywatny validator/dispatch w `patternly-content/scripts/content/verify-migration.mjs`. Descriptor wiąże scope/version, commit wejściowy, przed/po QSet, 8 source file before/current raw SHA i dokładny SHA bytes proofu. Nie ma dynamicznego map override, publicznego waiver, globalnej unikalności option ID ani nowego archiwum. Zachować wszystkie 13 istniejących literal descriptors i pięć private guards wymienionych w `ROOT-PRIOR-GUARD-BASELINE.json` (SHA `0e6aecc3ad8a3ddd8dc34f6a470c1544c36748693929f4909059a12df57528d3`) byte-exact.

Proof v23 używa istniejącego root schema `patternly-bizq-semantic-replacement-v1` i tych samych zamkniętych root/source/item key sets co v22. Ma 8 source rows, 34 replacement rows i 110 same-ID rows. Proof rows zawierają pełne `beforeQuestion`/`currentQuestion`; descriptor pozostaje literalnym fixed mapą hashy, ID-actionów, taxonomy, defects/source refs i accepted answer IDs plus dokładnym proof-byte SHA, bez drugiej kopii pytań w descriptor. Walidator porównuje proof membership i canonical whole-object hashes z tym descriptorem oraz actual source/canonical content.

Dla odtworzenia poprzednika: weź current source array dla każdego N07 pliku, zamień każdy zreviewowany current object na związany before object, posortuj po questionId i sprawdź compact UTF-8 `JSON.stringify(array)` (bez newline) z `beforeSourceSha256`. Zrekonstruuj 1,413-item v22 QSet i poprzednią katalogową wersję; następnie wywołaj istniejący fixed v22 guard. Łańcuch v22→v21→v20→v19a→v19→v17→v16→v13→v12→v11 działa bez zmian. Sumy historyczne wynikające z accepted v22 evidence plus v23 map: 16,077 całkowitych, 16,041 historycznych, 628 replacements, 461 same-ID corrections i 25 reason amendments; implementacyjne testy muszą potwierdzić rzeczywisty return value.

Weryfikacja zostaje na istniejących ścieżkach: nowy producer test `tests/bizq01-ood-node-closure-23.test.mjs` sprawdzi proof/źródła/whole objects/action map, scoring wszystkich rzeczywistych opcji w oryginalnej i odwróconej kolejności, feedback target IDs i przewidziane negatywy. Rejestracja testu w `package.json:test:canonical` raz. Targetowane history tests zachowują stare v22 assertions. `tests/ood-cohort16-historical-fixture.mjs` dostanie jeden izolowany v23→v22 restore, potem istniejące v22→v21→starsze restoration helpers. V22 proof należy skopiować dokładnie do fixture v22, a v23 proof z tego fixture usunąć, aby wybrał się właściwy fixed branch. Nie przepinać dawnych map/ID/counts.

Current pin scope jest wąski: content builder test i ODK097 design-session matrix wskazują v23 jako current catalog identity, zachowując historyczny candidate manifest i N01 136-node/hash. App `bizq01OodNodeClosure21.test.ts`/`22.test.ts` zachowują swoje mapy/proofy; tylko assertiony live runtime version/QSet przechodzą na current v23. Root-owned `bizq01OodNodeClosure23.test.ts` sprawdza nowy current map/source/runtime, a runtime admission candidate ID wiąże się dopiero z rzeczywiście wygenerowanym kandydatem. Lock/artifact sync i admission są po stronie root.

Przed synchronizacją root zapisał rzeczywisty test 23 RED: `ROOT-CONSUMER-PRE-SYNC-RED.log` SHA `2d4cd96fd74b00232b4b7508ebef08a10cd558644e266dc3d38357eb8a3644f6`; brakuje proof23 i live runtime nadal v22 (2/4 subtestów fail); scoring/reversal/feedback/pre-answer oraz N01–N06/pools subtests przechodzą. Po sync trzeba uruchomić current23 consumer i zachować osobne bounds dla native/Premium; test source nie ustanawia ich.

## Zakres plików po niezależnym producer-design review

- Content producer: `patternly-content/scripts/content/verify-migration.mjs`, nowy `patternly-content/tests/bizq01-ood-node-closure-23.test.mjs`, `patternly-content/package.json`, `patternly-content/tests/ood-cohort16-historical-fixture.mjs` i konieczna izolacja `patternly-content/tests/bizq01-ood-node-closure-22.test.mjs`.
- Current producer catalog pins: `patternly-content/tests/content-builder.test.mjs` i `patternly-content/tests/odk097-design-session-matrix.test.mjs`.
- Consumer/current artifact/lock/candidate/admission integration pozostaje root-owned: `src/content/bizq01OodNodeClosure21.test.ts`, `src/content/bizq01OodNodeClosure22.test.ts`, root-owned new `src/content/bizq01OodNodeClosure23.test.ts`, `src/domain/tracks/runtimeAdmissionLaunchTracks.test.ts`, generated content artifact/content lock/release lock oraz istniejący delegated admission. Ta część nie jest wykonywana przez to briefing-only zadanie.

## Required checks after implementation

1. W content repo: `node --test tests/bizq01-ood-node-closure-23.test.mjs tests/bizq01-ood-node-closure-22.test.mjs`; oba testy muszą korzystać z właściwej v23/v22 generacji.
2. Uruchomić fixture consumers używające `ood-cohort16-historical-fixture.mjs`: source/producer tests 21, 20, 19, 17, 16, 13, 12, 11. Zachować exact previous proof copies and assertions.
3. Uruchomić `npm run verify:migration`, `npm run content:validate`, canonical build w prywatnym output root i jeden wymagany `npm run test:canonical` po stabilnym diffie. Zachować istniejące `dist` i foreign output.
4. Po root sync: app current 23 consumer, aktualne pin checks, source/candidate/readiness, exact artifact/lock preservation and existing admission. Local build/readiness is not admission or release.

## Ograniczenia i ocena

Brak zmian source/proof/catalogue/admission w tym etapie. Przygotowany proof i map nie aktywują source; brief wymaga niezależnego exact producer-design review przed implementacją/source activation. Nie tworzy eligibility, native/Premium/full-bank/full-BIZQ acceptance, release gate ani publication authority.

Fit 0.95 — kompletny istniejący N07 node dostaje fixed versioned chain update, a 1,269 innych OOD objects zostaje związanych. Simplicity 0.86 — jeden additive validator i jeden historical ingress reuse istniejącej architektury. Risk 0.86 — dokładny reviewed map/proof, hashes i before-byte reconstruction redukują identity/history risk. Maintainability 0.85 — closed proof, immutable old chain i brak arbitrary override/second pipeline. Minimum 0.85.
