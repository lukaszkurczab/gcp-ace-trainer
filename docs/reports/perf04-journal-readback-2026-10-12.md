# PERF-04 — journal readback, 12.10.2026

## Cel, wymagania i zależności

Zmniejszyć powtarzane odczyty historii podczas pełnego persisted journal materialize→verify→clear. Zachować PERSIST-02/05/06/07: integralność całego namespace (także unrelated corruption), revisions, immutable attempts, wszystkie declared writes/deletions przed clear, profile fences i powtórną weryfikację każdej istniejącej granicy. Reset nadal obejmuje pełny scope. Żadnego trwałego cache, debounce, limitu historii ani resetu danych. Normatywne docs całego projektu pozostają w głównym workspace docs; ten raport jest dowodem pracy z istniejącej kolejki.

## Ustalenia i weryfikacja

W baseline58ef26d5 verifier wykonuje assertTrainingEvidenceIntegrity (pełne S/A/R/results), po czym getTrainingSessions/getTrainingAttempts/getReviewQueueItems ponownie parsują S/A/R. Reviewreader dodatkowo sprawdza unique active-cycle identity; trzeba zachować ten warunek. Commit/recovery wywołują verifier trzykrotnie przed clear; tych granic nie usuwać. Integrity reader używa physicalKeys.includes w pętli indeksu (koszt kwadratowy); najpierw pomiar całego przepływu.

Brakujący fakt: czy syntetyczny, poprawny persisted journal przechodzi rzeczywiste canonical recovery wraz z clear, a następnie jaki jest koszt A100/1k/10k. Mała próba A100 najpierw ujawniła powieloną active-review identity w fixture; poprawiono exact sourceItem identities, bez zmiany runtime guards. Po korekcie persisted journal_durable → materialize → verify → clear oraz drugi idempotentny recovery przeszły. To rzeczywisty kod nad MemoryKeyValueStorage, nie SDK/MMKV/native durability proof.

Narzędzie `scripts/qa/measureMutationRecovery.ts`: spójne synthetic S/A/R, jeden nowy outcome attempt+session w journalu, wszystkie canonical envelopes/indexes; jeden warmup i7samples, counts getString/characters/writes/removals/enumerations, exact input/output hashes oraz no-op drugi replay. Setup/hash/final integrity check poza mierzonym regionem; region obejmuje recoverPendingMutation od journal_durable do clear. Synthetic pins nie twierdzą pokrycia bieżącego banku ani UI latency.

## Hipoteza podejścia po pomiarze, przed implementacją

Najmniejsza korekta: jeden repository-owned validated full evidence snapshot na jedno wywołanie verifiera, użyty także do porównania declared targets. Dotychczasowy assert wrapper deleguje do tego samego canonical readera. Review active identity validator pozostaje jednym współdzielonym warunkiem. Użycie Set dla fizycznej przynależności zachowuje relację index↔key. Nie przechodzimy na pomijanie unrelated records: obecny kontrakt fail-closed pozostaje. To uzasadnione ograniczenie pomysłu targeted-only ze specyfikacji, ponieważ pełna integralność ma pierwszeństwo. Nie twierdzić O(1).

AC: exact input/output hashes i identyczne physical outcomes przed/po, mniej odczytów/znaków; zachowane błędy corruption declared/unrelated/index/result, active-review duplicate, read failure, deletion/fault/replay/profile cutover. Targeted suites, typecheck i wymagane qa:static. Natywna macierz pozostaje PERSIST-13; brak nowej tezy o czasie UI lub odporności na kill. Design/source independent Luna High przed odbiorem.

Ocena root: cel/architektura0,94; prostota0,94; kontrola ryzyka0,90; utrzymywalność0,93; minimum0,90. Powód: reuse aktualnie zwalidowanych wartości usuwa redundantne parsowanie bez zmiany reguły corruption lub granic trwałości. Jeśli pomiar nie potwierdzi kosztu albo review ujawni lukę, skorygować podejście przed implementacją.

Poprawiony baseline n7/warm1 i after zakończone; finalne wyniki poniżej zastępują wstępny pomiar. Jedyną kolejką pozostaje plan, jedynym handoffem WORKING_STATE.

## Decyzja i implementacja

Independent Luna High design **PASS**, fit/architecture0,94, simplicity0,92, risk0,85, maintainability0,90, minimum0,85; review samodzielnie prześledził kontrakty, verifier/readers i trzy verification boundaries. Przyjęto pełny snapshot bez pomijania unrelated corruption.

`readTrainingEvidenceSnapshotStrict` jest canonical pełnym czytnikiem S/A/R wraz z istniejącym full result ownership scan; dotychczasowy assert deleguje do niego. Verifier używa tych wartości zamiast trzech ponownych collection reads. Set physicalkeys zastępuje includes w tej samej regule key↔index, bez zmian walidacji. `validateActiveReviewIdentity` pozostaje jednym walidatorem w review repository, użytym również przez verifier poza integrity-error catch. W każdej granicy odczyt jest świeży; żadnego trwałego cache. Physical-after digest/revision/absence, result point-read, draft/pointer/timer i special goal/account/reset paths zachowane. Nie usunięto żadnego z trzech verify calls.

Nowy test recovery obejmuje7wariantów uszkodzeń niezwiązanych z session-only journal: malformed attempt/session, dangling index, orphan attempt, duplicate active review, orphan result, read failure. Po verified_pending_clear dwa retry odrzucane bez zapisu/clear, raw snapshot niezmieniony. Test przeszedł najpierw na baseline runtime, następnie po optymalizacji; dokumentuje zachowany kontrakt, nie nową regułę. Narrow verifier/recovery/integrity/review63/63PASS. Finalne pomiary poniżej; dalsze gates w toku.

Kontrola typów ujawniła błąd narzędzia: pola reads/writes/removals shadowowały prywatne liczniki MemoryKeyValueStorage, więc wstępne counts były podwójne. Ponadto getAllKeys zwraca readonlyarray; sort wymaga kopii. Poprawiono osobne nazwy liczników i sort kopii. Wstępne counts nie stanowią odbioru; oba pomiary powtórzono identycznym poprawionym narzędziem, baseline na exact58ef26d5 sourcecheckout, after na bieżącym runtime. Ten defekt nie dotyczy produkcyjnej zmiany. Strengthened errorcategory matrix37/37PASS.

## Finalny poprawiony pomiar

[Reprodukowalne wyniki](perf04-journal-readback-2026-10-12.json): Node22.22.3, identyczne poprawione narzędzie, baseline exact58ef26d5 retained sourcecheckout (tymczasowy tool usunięty w finally, Gitclean potwierdzony), after bieżący runtime. Jeden warmup,7samples, bez nakładających się heavychecks. Wszystkie3input/output hashes identyczne przed/po, stabilne liczniki we wszystkich próbkach; drugi replay jest no-op.

| Historia A/S/R | Median przed→po ms | p95 przed→po ms | getString przed→po | Znaki przed→po |
| --- | --- | --- | --- | --- |
| 100/11/10 | 18,10→15,57 | 20,36→16,51 | 934→559 | 994394→611993 |
| 1000/101/100 | 184,95→99,91 | 188,93→103,68 | 8584→4969 | 9362774→5565683 |
| 10000/1001/1000 | 7414,60→1025,88 | 7488,70→1044,82 | 85084→49069 | 93816074→55637183 |

Enumerations14→5 w każdym wariancie, writes6/removal1 bez zmian. A10k median−86,2%, reads−42,3%, chars−40,7%. To poprawa pełnego recovery w określonym synthetic canonical envelope, nie pomiar native latency/heap/durability. Nadal czytamy pełną historię na każdej granicy; nie twierdzimy O(1) ani pomijania unrelated corruption. Sam reuse redukuje scans, a Set usuwa kwadratowy membership scan w canonical readerze. Nie próbowano oddzielnie przypisywać czasu tym dwóm składnikom.

Typecheck po korekcie narzędzia **PASS**. Pełna qa:static z prawidłowymi przypięciami **EXIT0**:2527tests/2522PASS/0FAIL/5SKIP; recovery514sources/379tests/2409cases+boundaries, typecheck, contentboundary i privacyboundary PASS. Log0600 `artifacts/private/perf04-journal-20261012/qa-static-pinned.log`. Dwa testy obcego offline-account source są w localgate, wyłączone z naszego sourcepackage. Final independent Luna High source/AC **PASS**: reviewer samodzielnie porównał diff, runtime wejścia, kontrakty, trzy measurement pairs i source hashes, czysty baseline checkout oraz prywatny final gate receipt. Bez funkcjonalnych blockerów lub brakujących bramek PERF-04. Wskazaną lukę aktualności dokumentacji usunięto: PERF-04 usunięty z kolejki, wybrany full-snapshot kontrakt zapisany w istniejącej specyfikacji.

Pierwsza pełna qa:static:2527tests/2519PASS/3FAIL/5SKIP; wszystkie3FAIL to content cross-repo preconditions (brak PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA i brak historical-root override, przez co test wskazał currentproducer). Recovery/typecheck przeszły, gates po npmtest nie uruchomiły się. Zastany /private/tmp/patternly-content-historical już nie istnieje; zachowany `.qa-private/content-historical-20261011` jest clean i ma exactcc3efca88be7e01137f10ac69a0643f06b61a350. Nie odtwarzano archiwów ani nie zmieniano producenta. Powtórzono pełną bramkę z jawnie wskazanymi actual current58d7e8b i retained historicalcc3efca oraz required expected-current SHA. Bez zmian runtime/test guards/timeouts.
