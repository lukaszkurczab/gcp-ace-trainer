# CC-05 — skoordynowana publikacja 12.10.2026

Status: zakończone — główne gałęzie opublikowane, wszystkie trzy bramki hosted CI SUCCESS.

Właściciel zatwierdził użycie Backend z 11.10 i Claude z 918 pytaniami oraz scalenie gałęzi z bieżącej sesji pracy (11.10, przed północą). Zakres publikacji obejmuje Git i pakiet treści aplikacji; nie obejmuje wysłania binarnego wydania do sklepu.

## Kontrakt i kolejność

CONTENT dostarcza kanoniczne źródła i dziewięć artefaktów. APP przypina identyczne bajty, wersje i historię następców; readiness nie udziela admission. Nowy kandydat wymaga nowej decyzji i rzeczywistego testu runtime związanego z commitem APP. Historyczne zatwierdzenia pozostają w historii Git i nie zatwierdzają nowego banku.

Kolejność implementacji: commit źródeł CONTENT → nowy kandydat i readiness → integracja najnowszego APP → synchronizacja wszystkich banków → testy i commit APP → admission CONTENT → niezależny odbiór. Kolejność publikacji: udostępnienie dokładnego commitu APP na gałęzi integracyjnej, CONTENT master, następnie APP main. Pozwala to workflow CONTENT pobrać zatwierdzony APP i workflow APP pobrać aktualny CONTENT. Po obu aktualizacjach wymagane hosted CI i ręcznie uruchamiany real content release gate.

W razie regresji: revert konkretnych commitów wydania; bez resetowania publicznej historii. Niezapisane oryginalne checkouty zachowane; przygotowanie odbywa się w osobnych worktree. Prywatne kopie patchy i manifesty zachowania zapisano w /private/tmp/patternly-publish-20261012/preservation.

## Przegląd

Niezależny projekt: dopasowanie 0,94, prostota 0,84, ryzyko 0,82, utrzymanie 0,84; minimum 0,82. Istniejący protokół wydania pozostaje kanoniczny. Jawne identyfikatory CC-05/CANDIDATE i CC-05/ADMISSION dodano do ścisłych dozwolonych zakresów; pozostałe wymagania hashy, dziewięciu banków i rozdzielenia readiness/admission pozostają obowiązujące.

Formalna synchronizacja: niezależny przegląd korekty liczby pytań — dopasowanie 0,95, prostota 0,93, ryzyko 0,84, utrzymanie 0,90; minimum 0,84. Zmiana liczby wymaga jawnego zweryfikowanego kandydata i nowego exact pinu. Zwykły sync nadal odrzuca niezatwierdzoną zmianę. Historia odpowiedzi pozostaje zapisana, bez przeniesienia zaliczenia między pinami.

Dowód migracji CC: utrzymuje niezmienne checkpointy 300 i 845 pytań; osobny ścisły następnik 918 wiąże wersję, pełny hash, baseline bez metadata kursu, dokładne 73 dodatki i sześć poprawionych rekordów. Rekonstrukcja musi odtworzyć zatwierdzony bank 845. Niezależny przegląd projektu potwierdził ten zakres; ocena podejścia: dopasowanie 0,95, prostota 0,88, ryzyko 0,85, utrzymanie 0,88 (minimum 0,85). Porządkowanie trzech tablic źródłowych nie zmienia pytań ani odpowiedzi; tożsamość finalnego artefaktu zostanie sprawdzona rzeczywistym buildem.

## Historia gałęzi

APP: fix/fesd-n08-20261011, codex/besd-n02-repairs-20261011, agent/saa-20261011 i fix/claude-content-20261011 są już przodkami origin/main 98ab5b48.
CONTENT: fix/fesd-n08-20261011, fix/claude-targeted-20261011 i reconcile/saa-claude-20261011 są już przodkami origin/master 3b0a3e8. Snapshot codex/besd-saa-approved-snapshot wymaga dołączenia historii; symulacja merge daje dokładnie obecne drzewo master, bez podmiany nowszych plików.

## Weryfikacja i wynik

Źródła CC: `80278c1b32772a97708a9ea2e2e07ea151af1f20`. Merge snapshotu: `7f50074`, bez zmiany drzewa źródeł. Kod APP: `9c1e3421`, na aktualnym `98ab5b48`, bez niezwiązanych zmian PERSIST.

Nowy draft: `9a1ae78ad702612f33d523ab5581e7e5fe5bd6fd2bd42a7a94d892a0b907deda`; release `patternly-candidate-80278c1b3277`, SHA `c53d430a1510186a44ead29f8bcba43c2aeecdf2c9278047ebb2481ba1f55799`. Draft sam nie udziela readiness ani admission.

| Bank | Pytania | SHA artefaktu |
|---|---:|---|
| Backend 11.10 / BIZQ01-15 | 1569 | `b583803be9ac81c4e0e4b0b115086177867bad0aaab3b519a01bbbed3261b421` |
| Claude 918 / 53 jednostki / V3 | 918 | `12e6c8637b112af9e48ca870bb80d89f9db6ad7d1949c51efceb37572a6cd0bd` |
| Frontend System Design 11.10 / N08 | 1766 | `48b295c98c7d7ff18df35e26a30690704d0cb4cdd74989cedc887cdcb62def37` |

Frontend obejmuje wcześniej zatwierdzone i opublikowane 162 poprawki; obecny spójny kandydat przenosi je również do APP. Pozostałe siedem artefaktów kandydata, w tym Backend, są identyczne z poprzednim aktywnym kandydatem. Źródłowe porządkowanie trzech tablic Claude nie zmienia finalnego SHA artefaktu.

Formalny sync i zapis release lock wykonano. Wszystkie dziewięć artefaktów odpowiada kandydatowi; zmieniły się dokładne piny Claude i Frontend, pozostałe siedem zachowano. Niezależna kontrola potwierdziła zgodność hashy, liczby pytań i historii następców.

Weryfikacja źródeł: scoring wszystkich dziewięciu banków PASS, migration PASS, tamper5/5 PASS. Pierwszy pełny test CONTENT: 252 PASS, 7 FAIL, 1 opcjonalny skip; poprawiono nieaktualne oczekiwania wersji/inwentarza i odświeżono rzeczywistą proweniencję primary-strata bez podnoszenia deklaracji jakości. Powtórne pełne pliki testów: 45/45 oraz primary-strata10/10 PASS. Dodatkowy pełny lokalny przebieg przerwano przy ograniczonej przestrzeni dyskowej i obciążeniu fixture migracji; nie jest PASS. Pełny przebieg wymaga wyniku hosted CI.

APP: typecheck i sync28/28 PASS. Pełna diagnostyka nowej paczki: 2410 PASS, 16 FAIL, 5 skip. Wynik nie jest deklarowany jako odbiór. Wykryte różnice obejmują stare admission, lokalny symlink backendu, nieaktualne oczekiwania V2/inwentarza/fixtures oraz kontrakty selektorów i ekranów Practice; wymagają korekt i ponownego sprawdzenia. Backend recovery4/4 PASS przy wskazaniu fizycznego checkoutu. Brak zgody na osłabienie bramek lub zmianę admission w testach.

Końcowe korekty APP: `f5fd2466`. Typecheck i content boundary PASS; quality6/6, parserV3/selektory26/26, practice copy4/4, locale parity PASS. Wcześniej błędne przypadki projection przeszły: oba tryby celu, P01 oraz zgodność aktualnego producenta. Test P01 sprawdza najpierw deficyt pokrycia jednostek, a dopiero bez niego tekst pozostałych prób. Niezależny przegląd źródeł PASS.

Końcowe lokalne bramki: nowe admission na rzeczywistym runtime, release gate i niezmienny readiness PASS; admitted export/readiness2/2, crossrepo3/3 i sync9/117/958/16695 PASS. Te wyniki nie zastępują pełnego hosted CI. Historyczny lokalny kandydat z11.10 pozostaje niezmieniony.

Korekta ścieżki walidatora: `producerValidationModules` wskazywał katalog o jeden poziom za wysoko i wczytywał starszy kontrakt. Domyślna ścieżka została zrównana z istniejącą ścieżką synchronizacji; jawny override zachowano. Niezależny przegląd zaakceptował korektę path-only, ocena fit0,94/simplicity0,95/risk0,90/maintainability0,92. Rzeczywista paczka918/V3 przeszła content boundary; runtime privacy boundary również PASS.

## Scalenie i publikacja

W trakcie publikacji `origin/main` wzrósł do `81ec9aa0` (PERSIST12). Zachowano tę pracę w merge `4e018fd10d62a60a26fa17581ec1d61f3f2989d2`; konflikty tylko w bieżącym stanie i siedmiu plikach common.json rozwiązano zachowując obie grupy zmian. Testy copy/parity8/8 PASS. Niezależne porównanie base/rodzice/merge14localeJSON: brak utraconych lub nierozwiązanych zmienionych kluczy.

Dopuszczenie ponownie wygenerowano rzeczywistym testem runtime dla merge4e018fd1. CONTENT `e57f32a743f8b8afbdf7fbddb215322239bceffa` wiąże ten exact commit; wcześniejszy dowód f5fd2466 zachowano historycznie. Niezależny przegląd wszystkich dziewięciu artifactSHA, locka, ledger, readiness/admission i runtime-evidence PASS; granica `local_verified_artifacts_no_deployment`.

Push: APP gałąź integracyjna4e018fd1 → CONTENT master e57f32a → APP main4e018fd1. Pierwsza próba push gałęzi została odrzucona bez szczegółowego powodu; po sprawdzeniu stanu zdalnego, zachowaniu równoległej aktualizacji i merge ponowny zwykły push przeszedł. Bez force push.

Każda lokalna i zdalna gałąź sesji20261011 w APP i CONTENT jest przodkiem opublikowanej integracji. Snapshot Backend/SAA dołączono bez zmiany drzewa; nie cofnięto nowszych źródeł. Oryginalne dirty checkouty zachowano, nie resetowano lokalnych main/master.

Bramki hosted dla dokładnych commitów publikacji:
- [APP QA4e018fd1](https://github.com/lukaszkurczab/gcp-ace-trainer/actions/runs/38183098775) — SUCCESS:2445total/2440PASS/0FAIL/5SKIP; qa:staticexit0, recovery486source/363files/2331cases, typecheck/platform/content/privacyPASS; crossrepo3/3.
- [CONTENT publishing e57f32a](https://github.com/lukaszkurczab/patternly-content/actions/runs/38183087512) — SUCCESS:260total/259PASS/0FAIL/1optionalSKIP; build/scoring9banków, identyczny draft9a1/source802, readiness/no-diff i bundledFreePASS.
- [Real content release e57f32a](https://github.com/lukaszkurczab/patternly-content/actions/runs/38183098499) — SUCCESS:260total/259PASS/0FAIL/1optionalSKIP; migration, exact draft, readiness/no-diff i RELEASE_READY PASS.

Nie wykonano publikacji sklepowej ani OTA. Nie deklarowano pełnego semantycznego audytu wszystkich pytań. Cowork pozostaje dodatkowym materiałem poza runtime; partner-only wyłączony. Wcześniejsze odpowiedzi są zachowane, bez automatycznego zaliczenia wymagań nowego pinu.

APP full gate sprawdził formalny bundled artefakt918, V3,7rozdziałów/53jednostki, linki documentation/course i account flag dla każdego pytania oraz przygotowanie/wznowienie sesji każdej jednostki. Pięć skipów: cztery opcjonalne real-HTTP recovery oraz dodatkowy probe `.temp/cc04-final-dist`; wymagane sprawdzenie formalnej paczki wykonało się. CONTENT jeden skip: opcjonalny test warunkowany PATTERNLY_FRONTEND_ROOT; APP crossrepo/runtime wykonały się oddzielnie.

Końcowy zapis dokumentacji zmienia wyłącznie raport, plan i bieżący stan. Kod/runtime, paczki, zależności, konfiguracja i locki pozostają identyczne z odebranym4e018fd1; obowiązuje dowód full CI tego commitu, a admission nadal wskazuje dokładny wykonany runtime. Nowy commit dokumentacji nie jest nowym wydaniem banku.

Końcowy niezależny odbiór trzech pełnych logów hosted: PASS, bez blokujących ustaleń; exact commity/piny, transparentne skipy i granica bez deployment/store potwierdzone.
