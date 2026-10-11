# PERSIST-07/05/06 — exact replay i weryfikacja przed clear

Stan: **niezależny source/logical PASS WITH ISSUES; pełny lokalny gate PASS; dostarczenie i hosted CI w toku**. Jedyna kolejka: [plan](../PATTERNLY-WORKING-PLAN.md); jedyny bieżący stan: [WORKING_STATE](../../.agent/WORKING_STATE.md). Kryteria wynikają z [persistence.md](../specs/engineering/persistence.md) oraz workspace docs04/08/11/17. Pełna natywna macierz PERSIST-13 jest osobnym zakresem.

## Cel i zakres

Recovery odtwarza dokładny trwały plan bez zmiany już zastosowanych envelopes i bez nadpisania konfliktu. Usunięcie journalu wymaga aktualnego potwierdzenia wszystkich postconditions. Review materialization dotyka wyłącznie zadeklarowanych rekordów i koniecznego indeksu. Nie zmienia polityki powtórek, scoringu ani danych profili.

Źródłowy punkt odniesienia: `a8eac121feac215dd7ea8c81abf29d12597d7201`, retained checkout `.qa-private/persist0408-exact/patternly`; sibling CONTENT `3b0a3e8bb4560235fdcc9c8230e654412c95020b`, BACKEND `4d8efbd6cab8f8fc31d39970fd8e6abb1a0c45eb`. Primary APP pozostaje dirty na `07881c44`, bez stash/reset/FF. Końcowe lokalne dokumenty odbioru04/08 zachowane.

## Projekt i niezależny review

Root: zgodność0,94/architektura0,88/prostota0,82/ryzyko0,84/utrzymanie0,85, minimum0,82. Niezależny `persist_design`, Luna High, read-only: zaakceptować warunkowo bez design-blockera; zgodność0,94/architektura0,91/prostota0,82/ryzyko0,84/utrzymanie0,82, minimum0,82. Review propozycji nie jest odbiorem implementacji.

Warunki: zamknięte wyprowadzenie fizycznych operacji z typed writes; fingerprint nie zastępuje authority. Walidacja odrzuca dodatkowe, brakujące, powielone i przestawione operacje również po przeliczeniu fingerprintu. Codec pozostaje jedyną granicą MMKV; istniejące attempt/review repositories posiadają batch writes. Pary goal/plan i account-sync zachowują własne authorities. Ordinary account mark pozostaje osobnym idempotentnym skutkiem po verification. Legacy J bez authority kończy się jawną blokadą, bez retrofit.

## Kryteria odbioru

1. Każdy fizyczny target ma exact prior envelope digest/revision albo absence i exact after envelope/revision albo absence, wyprowadzone i walidowane względem typed planu.
2. Replay akceptuje tylko legalny uporządkowany prefix. Exact-after jest no-op bez podbicia rewizji. Third state, również identyczny payload z inną rewizją, blokuje przed dalszym zapisem; J i bytes pozostają.
3. Po przerwaniu na każdej właściwej fizycznej granicy nowe instancje i dwa recovery dają identyczny canonical final state albo ten sam jawny conflict. Porównanie obejmuje pełne envelopes, indeksy i wymagane absence.
4. Trace co najmniej trzech A: rekordy w kolejności J, jeden final index równoważny sequential prepend. Trace co najmniej trzech R: update środkowego zachowuje unrelated envelopes, put/update poprzedza jeden final index, deletes następują po nim; bez zapisu unchanged index.
5. `verified_pending_clear` wykonuje świeże kompletne read-only verify przed account mark i clear; missing/changed A/R/result/S/index/pointer/D/T oraz read failure zachowują J. Exact state pozwala na clear bez canonical rewrites.
6. Standalone `remove_review_entry` wymaga matching sourceSessionId; outcome update historycznego review pozostaje legalny. Istniejące authorities i profile fences są zachowane.
7. Niezależny QA gotowego pakietu i rzeczywiste CI dokładnego dostarczonego commitu; bez utożsamiania source/logical acceptance z pełnym native13 lub gotowością wydania.

## Zmiany i aktualny odbiór

Jedyny writer `persist_writer`, Luna High; niezależny design i QA `persist_design`, Luna High; bez dalszych subagentów. Closed physical plan przechowuje exact prior raw digest/revision/payloadDigest/absence i exact after envelope/digest/absence. Indeksy i warunkowe ownership targets zachowują prior envelope potrzebny do czystego wyprowadzenia after. Walidacja target-set/order i derive-after jest oddzielna od fingerprintu; SHA nie jest auth. Live prior proof sprawdza także digest parsowanego payloadu. Legal ordered prefix jest sprawdzany przed pierwszym zapisem; exact-after jest no-op.

Zmiany source: `canonicalRecordCodec`, `mutationJournalRepository`, builder/materializer/verifier/commit/recovery; owner batch APIs w attempt/review, typed steps w S/result/D/T oraz repo dispatcher `mutationPhysicalWriteRepository`. Świeże verify przed account mark i ponownie przed clear. Standalone review removal wymaga matching sourceSessionId; foreign timer blokuje bez usunięcia. Pary goal/plan/account-sync i reset zachowują istniejące authorities. Legacy J bez physical plan jest explicit unavailable, bez retrofit. Zastąpione zero-reference journal entrypoints materializeTrainingAttempt/materializeTrainingSession/materializeReviewQueueRemoval/materializeActiveTrainingSessionDraft usunięte po ref scan; zwykłe używane APIs zachowane.

P07 historyczny full-queue rewrite nie występował już w baseline ownerze: pierwszy real trace seed3R/update middle i suite10/10PASS wykazał wyłącznie middleRwrite, unrelated envelopes/index byte-identical. Pakiet domyka batch index order i exact envelope replay, bez zmiany BIZQ-04.

Niezależny QA: **PASS WITH ISSUES — bounded source/logical07/05/06**, bez pozostałego defektu scope. Static review potwierdził kryteria1–6; własna suite112 miała111PASS/1FAIL composition fault-offset. Root baseline clean a8eac121/sameNode22/fullfile5/5PASS wykazał wpływ pakietu. Rzeczywisty trace ustalił przesunięcie injekcji przez dodatkowe fresh verify: fault trafiał w timer checkpoint. Test-only correction zachowuje intended prewrite rawDunchanged/retry oraz post-set readback uncertainty/exact newD/receipt isolation/reconcile, offsety+4/+6. Niezależny rerun composition/Certification/Design10/10PASS; nie powtarzano niezmienionych pozostałych111cases. To regresja fixture pakietu, nie ponowne otwarcie04/08.

QA wykrył i ponownie sprawdził naprawę before.payloadDigest forgery pozwalającą na changedpayload/samerevision: live prior guard i mutableR forged-fingerprint test odmawiają przedJ, bytes preserved. Directcodec execution/import w application zastąpiono owner APIs; stale expected override i exact physical snapshot są odrębnymi pre-J checks, zachowana typed stale review classification i graded attempt. Foreigntimer failclosed, bez autorepair.

## Rzeczywista weryfikacja

Writer targeted PASS: bootstrap14/14 (A-record-before-index przez produkcyjny bootstrap), materializer17/17, recovery36/36, finalization13/13, journalrepo9/9, verifier10/10, reviewqueue10/10, draft11/11, canonicalRepositories9/9, storageCodec4/4, ownerbatch2/2. Testy obejmują forged add/missing/duplicate/reordered targets, finalindex usuwający unrelated priorID, mutableR payloadDigest forgery, malformed standalone cross-session removal, foreignT preservation, wszystkie zmienione physical boundaries/recovery, wrongrevision/retainedrawJ, reappearingD i zmiany po verified_pending_clear. Pierwszy TC2errors naprawiony, końcowy TCexit0; diffcheckclean.

Root uruchomił pełny qa:static na frozen source z czystym currentCONTENT3b0a3e8b, historicalCONTENTcc3efca88be7e01137f10ac69a0643f06b61a350 i BACKEND4d8efbd6. Pierwszy fullgate:2373total/2365PASS/4FAIL/4SKIP. Trzy failures miały przyczynę w niepełnej konfiguracji root-run (backend symlink root zamiast realroot i brak EXPECTED_CURRENT_SHA); poprawione środowisko potwierdzone narrow runner/content7/7PASS. Czwarty był starym oczekiwaniem pointerwrite dla exact-after; zastąpiono je jawnym raw/revision/payload/write/remove no-op testem przy pełnym A/R/J success. Niezależny rerun mutationJournal15/15PASS; brak zmian produkcyjnych. Powtórny pełny qa:static exit0:2374total/2370PASS/0FAIL/4SKIP, recovery487sources/358tests/2260cases, TC i content/privacy boundaries PASS. Poprawne exact env potwierdzone także narrow runner/content7/7PASS. Logi tymczasowe `/private/tmp/patternly-persist0507-qa.log`, `patternly-persist0507-envprobe.log`, `patternly-persist0507-qa-final.log`. Nie jest to jeszcze hosted CI ani commit/push.

## Granice

Pełny native PERSIST-13, PremiumUI/finalizer, provider/device/release pozostają osobno. Ten pakiet dowodzi logicznego exact replay na istniejącym memory adapterze i produkcyjnego bootstrap wiring; nie przedstawia memory faults jako nativekill/tornwrite. Profile12/Guest, obce zmiany i stashe oraz procesy użytkownika nietknięte. Pozostałe kryterium7: rzeczywiste hosted CI dokładnego commitu. Bez GO.
