# AWS-02/ADMISSION — lokalne publishing/runtime admission i app lock

**Status:** done — niezależne QA **PASS WITH ISSUES**  
**Zakres:** wyłącznie lokalny, bez publikacji zewnętrznej i bez wdrożenia

## Wynik

- Aktywny app lock schema v3 wiąże dokładnie candidate `11d56baa…`, release `patternly-candidate-79060003a301`, checksum manifestu oraz dziewięć hashy artefaktów już osadzonych w aplikacji.
- Poprzedni lock `patternly-app-content-0024` zachowano bez zmian jako historyczny dowód; nie jest używany jako admission nowego kandydata.
- Dowód runtime wiąże commit aplikacji `1a375c99…`, app lock, bundled content lock, plik testu i pełny zestaw dziewięciu tracków. Test uruchamia rzeczywisty `loadCanonicalRuntimeCatalog`, rozwiązuje każdy track, tryb i niepusty pool.
- Publishing admission oznacza wyłącznie zweryfikowane lokalne bajty kandydata (`local_verified_artifacts_no_deployment`). Nie twierdzi, że artefakty trafiły do storage, backendu lub użytkowników.
- Release gate konsumuje osobny admission v3. Readiness v2 pozostaje niezmiennym dowodem wcześniejszego etapu z granicą `not_granted`; nie został przepisany tak, aby udawać późniejsze uprawnienie.
- Generator manifestu wydania oraz lokalny readiness gate przestały zależeć od historycznego ACC-02 i weryfikują bieżący candidate/readiness/admission.

## Weryfikacja

- app candidate-lock tests: 2/2 PASS;
- app runtime admission: 1/1 PASS;
- app release manifest + readiness gate: 28/28 PASS;
- app typecheck: PASS;
- pełny app suite: 1259/1262 PASS; trzy testy cross-repo poprawnie odmówiły pracy bez osobnego historycznego checkoutu i `PATTERNLY_CONTENT_EXPECTED_CURRENT_SHA`. Te same kontrakty uruchomione z kontrolowanymi fixture’ami w zestawie release manifest/readiness przeszły 28/28;
- content admission: 2/2 PASS;
- content release gate: 5/5 PASS i `RELEASE_READY` dla exact candidate;
- pełny content suite: 70/70 PASS;
- migration verifier: 9 tracków, 117 nodes, 943 mental units, 16 077 pytań;
- `git diff --check`: PASS.

## Granice

Nie wykonano deployu, uploadu do cloud storage ani publikacji aplikacji. Lokalne `RELEASE_READY` dotyczy wyłącznie content candidate/admission; nie zastępuje FREEZE, GO, provider/store evidence ani fizycznego device matrix.

Pierwsze QA wydało FAIL, ponieważ walidator sprawdzał tylko format per-track `artifactSha256`. Po poprawce każdy hash admission jest porównywany z dokładnym artefaktem release; negatywny test z prawidłowo sformatowanym, lecz obcym hashem kończy się błędem. Re-QA: PASS WITH ISSUES. Jedyna uwaga dotyczyła dwóch historycznych etykiet „ACC-02” w tekście/nazwie testu; zostały usunięte przed zamknięciem.
