# PERSIST-01/14 — initial timer w journalu startu

Stan: **niezależny source/local full-gate PASS; commit/push/hostedCI w toku**. Jedyna kolejka i stan: [plan](../PATTERNLY-WORKING-PLAN.md) / [WORKING_STATE](../../.agent/WORKING_STATE.md). Spec: [persistence](../specs/engineering/persistence.md), workspace04/08/11/17. Baseline APP e74298fe2b9abb2b534fc82d2d197dfc0a9f0d96, clean sibling CONTENT3b0a3e8b/historicalcc3efca, BACKEND4d8efbd6. Jeden retained writer checkout; persist_writer LunaHigh, niezależny design/QA persist_design LunaHigh; bez dalszych subagentów.

## Cel i ustalenia

Start foreground-timed session obejmuje S, wymagany D, active pointer i initial T w jednym istniejącym J. Obecny start pomija T; trzy fasady dopiero po commicie wołają initialize, które tworzy T. Resume bez T poprawnie blokuje, więc crashwindow po clear zostawia sesję bez możliwości odzyskania timera. P01 kolejność recovery przed strict active/content reads jest już wdrożona; nie implementować ponownie.

Typed start T wyprowadzony z registry i S: schema/timer1, właściwa family/session/track, accumulated=S.activeForegroundMs, checkpointRevision1, lastCheckpointAt=S.startedAt, runningfalse. Physical order S/index/pointer/optionalD/T. Exact absence T przy build i ponownie przed J; każdy existingT blokuje bez zapisów. Closed start validator niezależnie wyprowadza T; forged/missing/extra T odrzucane także po przeliczeniu fingerprint. initialize adopt-only bez tworzenia, resetu i revbump; legalny już checkpointed timer pozostaje legalny. Initial exact proof należy do J. Absolute-deadline bez T; missingT poza J nadal explicit recoveryfailure. Bez nowego journal/store/heurystyki.

Root i independent P14 objective0,96/architecture0,93/simplicity0,85/risk0,86/maintainability0,86,min0,85. P01 independent0,95/0,94/0,93/0,90/0,92,min0,90. Independent design **PASS warunkowo**, warunek exact-absence został przyjęty. Briefing nie jest runtime acceptance.

## Kryteria odbioru

1. Coding practice/simulation, Certification practice i Design practice otrzymują family/config-correct initial T w startJ; Certification Exam i Design Simulation absoluteDeadline bez T.
2. Closed typed shape, target/order i exact-after guards odrzucają forged family/time/elapsed/revision/running/extra/missingT także po recomputedfingerprint. Existing same/foreign/staleT przy build oraz race przedJ failclosed, bytes/J zachowane.
3. Cuts przed/po S/index/pointer/D/T oraz phaseupdate/clear, w tym failT, tworzą nowe instancje i przechodzą production bootstrap2×. Exact envelopes/revisions S/D/T i indices/pointer identyczne; jedenT; brak verifiedstart bez requiredT. Thirdstate retainedblock.
4. initialize adopt-only: zero save/revisionbump dla initial i legalnego checkpointedT; brakT poza J nadal typedblock, wrongscope/corruptT nie jest naprawiany.
5. P01 productionbootstrap recover przed strictread dla complete/finalize/abandon/unavailable+J; doublebootstrap exactstate, malformedJ/brakcontentu jawnyblock. Istniejąca poprawna kolejność bezredo.
6. Niezależny QA gotowych źródeł, narrowactualtests/TC i pełny localgate; coherentcommit/normalpush/exacthostedCI. Native kill pointerclear/startclear beforeitem należy do odrębnegoP13; memory nie dowodzi native.

## Zmiany

10 source/testfiles, bez filedeletions. Produkcja: commitTrainingSessionStart; mutationVerifier; ForegroundSessionTimerFacade; domain foregroundTimerState; foregroundTimerRepository; mutationJournalRepository; mutationPhysicalWriteRepository. Testy: applicationBootstrap, foregroundSessionTimerFacade, mutationJournalRepository.

Wspólne wyprowadzenie initialT jest czystą funkcją learningkernel, przyjmującą opaque TrackFamilyId. Builder, closed journal guard i timer owner samodzielnie resolve’ują authoritative registry family poza kernelem. Brak nowego store/owner, allowlist lub osłabienia gate. Usunięto gałąź createWhenAbsent oraz post-commit timer save; używane restore/checkpoint/terminalclear pozostają. T jest nowym typed start write z exact absence przy build i live pre-J recheck. Guard wymaga też exact typed start order; derived physical plan/fingerprint nie uprawnia do zmiany kolejności. Weryfikacja obejmuje exactT przed clear. initialize przejmuje legalny istniejący timer, bez tworzenia/resetu/checkpointuT.

P01 production order bez zmian. Nowe testy używają fresh composeTrainingLifecycleUseCases jako prepareLifecycle przy każdym bootstrapie; legalpracticecompletion i countdownfinalization. Matrix obejmuje S/index/pointer/D/T/materialized/verified_pending_clear/clear, unavailable-active+pendingreviewJ, malformedJ/missingcontent i abandonment2×wholeRawSnapshot.

## Historia wykrytych problemów i napraw

1. Root review wykazał, że early bootstrap15/17 wywoływały 2-argumentowy headless branch. Nie uznaje się ich za proof production lifecycle. Zmieniono na fresh real composition; bootstrap18/18PASS, bez production bootstrap refaktoru.
2. Niezależny QA **FAIL**: typedT-before-S/D z ponownie wyprowadzonym physicalplan i fingerprint przechodził guard. Regresja przed fixem zwróciła [true,true]. Minimalny exact typed order S/optionalD/optionalT; writer i reviewer journal13/13PASS, bootstrap18/18PASS, TCexit0; blocker zamknięty, pozostałe source bez zmian.
3. Pierwszy pełny qa:static **FAIL przed TC/tests**: helper w learningkernel importował forbidden trackRegistry. Wspólna derivation pozostaje pure z przekazaną familyId; registry resolutions w existing callers, guard independently authoritative. Gate/allowlist niezmienione. Writer i reviewer recovery probes bez jawnego currentCONTENTroot miały wyłącznie environmentpathFAIL; exactroot reruns PASS. Niezależny dependency review potwierdził brak forbidden imports i forged-family protection.

## Rzeczywista weryfikacja

Writer sequential PASS: bootstrap18/18, timerfacade31/31, journalrepo13/13, materializer17/17, verifier10/10, recovery36/36, draft11/11, codec4/4. Final TCexit0, diffcheckclean. Independent sequential PASS: journalrepo13/13, bootstrap18/18, timerfacade31/31, materializer17/17, verifier10/10, recovery36/36, journalcore15/15. Reuse wcześniejszych checks dotyczy wyłącznie niezmienionych ścieżek; correction order i kernel sprawdzono ponownie. Independent inventory487sources/358tests/2269cases+Stage1PASS.

Końcowy bounded independent verdict: **PASS source/local narrow**. Root powtórny pełny qa:static exit0 na exact env:2383total/2379PASS/0FAIL/4SKIP, recovery487/358/2269,TC/content/privacyPASS. Niezależny persist_design LunaHigh potwierdził cały log i końcowy bounded source+local full-gate PASS. Log /private/tmp/patternly-persist0114-qa-final2.log. Pierwszy log /private/tmp/patternly-persist0114-qa-final.log zachowuje architectureFAIL. Nie ma jeszcze commit/push ani hostedCI14.

## Granice

P01 native pointer-clear i P14 native start-clear/beforeitem należą do PERSIST13. Memory prefix/readback nie jest native kill/tornwrite ani PremiumUI/finalizer proof. Profile12/Guest, cudze źródła/stashe/procesy/symulator nietknięte. Bez GO. Po dostarczeniu local scope w kolejce pozostanie tylko rzeczywisty residualnative tych zadań, do końcowej13.
