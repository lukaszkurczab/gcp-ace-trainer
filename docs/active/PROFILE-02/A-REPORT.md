# PROFILE-02/A — ponowny wybór bieżącego Gościa

**Data:** 24.09.2026
**Status:** `done` dla jednego znanego Gościa; obsługa kilku historycznych, nieaktywnych Gości pozostaje w `PROFILE-02/B` i czeka na decyzję PO.
**Niezależne QA:** `gpt-6-luna/high`, **PASS WITH GAPS**. Kod i testy spełniają kontrakt A, ale dowód urządzeniowy nie identyfikuje profilu Gościa ani nie porównuje jego danych sprzed restartu i po nim.

## Przyczyna i zmiana

Bezpośredni `profileStorageRouter.selectGuest()` tworzył nowy profil przy każdym wywołaniu. Teraz ponownie używa wybranego Gościa, w razie potrzeby wybiera jedynego już zapisanego Gościa, a nowy profil tworzy tylko wtedy, gdy nie ma żadnego. Przy kilku Gościach i wybranym koncie zgłasza typowany błąd wyboru przed zapisem; nie wybiera arbitralnie ani nie usuwa żadnych danych. Zachowano dotychczasowy rejestr z podwójnym zapisem, weryfikację znaczników i mapowanie starych zakresów.

Historyczny test, który oczekiwał dopisania drugiego Gościa, został zastąpiony testem ponownego użycia ID. Dodano test Guest→konto A→Guest→konto B→Guest oraz restartu z osobnymi wartościami w trzech zakresach, a także odmowę przy uszkodzonym znaczniku i wielu Gościach. Produkcyjna ścieżka wyboru konta według backendowego ID oraz zakresy `legacy_guest`/`legacy_owner` pozostały.

## Weryfikacja

- Przed zadaniem: API `/ready` (database/authentication/providerReader), Auth, Firestore, Metro, Maestro i istniejący iPhone 17 działały; repozytorium po `PROFILE-01/D` było czyste.
- Niezależne QA przeczytało diff i uruchomiło testy routera/MMKV/koordynacji **56/56 PASS**. Worker uruchomił celowane testy router/MMKV/oracle **44/44 PASS**. `npm run typecheck`, `validate:content-boundary`, `validate:runtime-privacy-boundary` i `git diff --check`: **PASS**.
- Pełny `npm test`: **1177/1181 PASS**. Te same cztery wcześniejsze błędy pozostały: launch readiness, dowód `ODK-E2E-041` i dwa testy `accountLocalReset`.
- [Maestro Guest restart](evidence/A/guest-restart.yaml) na tym samym iPhonie 17: **PASS** dla Home i `patternly:content:ready` po `stopApp`/`launchApp` bez `clearState`; [zrzut po restarcie](evidence/A/guest-after-restart.png). Nie tworzono dodatkowego symulatora ani nowego Gościa na urządzeniu.

## Granica dowodu i następny krok

Urządzeniowy przebieg A potwierdza osiągnięcie Home po restarcie, ale nie dowodzi, że jest to ten sam Gość z tym samym postępem; przed `stopApp` sprawdza wyłącznie gotowość treści. Ciągłość ID i danych Gościa oraz rozdzielność kont A/B są w tym slice potwierdzone testami routera, nie logowaniami na urządzeniu. Pełne E2E należy do `PROFILE-06`. Stare instalacje z kilkoma profilami Gościa pozostają bezpiecznie zablokowane przy niejawnym wyborze, dopóki `PROFILE-02/B` nie dostarczy jawnej ścieżki odzyskania zgodnej z decyzją PO. Żaden historyczny zakres nie jest kasowany.

**Ocena przed zmianami:** zgodność/architektura 0,91; prostota 0,87; ryzyko 0,84; utrzymywalność 0,88; minimum **0,84**. Walidator `gpt-6-luna/high` zaakceptował briefing `Cel / Ustalenia / Podejście`: 0,93 / 0,88 / 0,84 / 0,90; minimum **0,84**.
