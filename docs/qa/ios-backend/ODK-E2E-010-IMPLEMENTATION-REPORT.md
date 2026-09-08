# ODK-E2E-010 — błędy przy polach zmiany adresu

Status: `VERIFIED_CLOSED`, 2026-09-08. Commit i push po całej ścieżce 007–012.

## Przyczyna i zmiany

AccountSecurityScreen wyświetlał błędy pól w górnym InfoBlock. To nie był natywny modal, ale nadal nie spełniało wymagania walidacji inline.

Sprawdzono rejestr, AGENTS.md, AccountSecurityScreen, requestEmailChange i classifyAccountFailure w AccountSessionProvider, FirebaseAuthClient, istniejące błędy inline w AccountEntryScreen, theme oraz locale i testy.

Zmieniono AccountSecurityScreen i Settings EN/PL. Dodano accountSecurityFieldErrors.ts/test. Tylko w mode=email błędny adres wskazuje pole emaila. Błąd autoryzacji wskazuje hasło wyłącznie na koncie hasłowym. Pole ma czerwone obramowanie i tekst pod nim, bez duplikatu u góry. Edycja właściwego pola czyści błąd, edycja innego go zachowuje.

Błędy ogólne i inne tryby zachowują dotychczasowy InfoBlock. Wspólne klucze account pozostają potrzebne na innych ekranach. Nie zmieniono globalnej klasyfikacji Firebase ani nawigacji 009. Nie dodano zależności.

## Walidacja i QA

Niezależny walidator **gpt-5.6-luna / max**, wyłącznie brief bez repo/narzędzi: zgodność 0,95; prostota 0,92; ryzyko 0,88; utrzymywalność 0,91; minimum **0,88 — APPROVE**.

Kontroler wykonał małą lokalną zmianę mapowania i prezentacji. Niezależne QA **gpt-5.6-luna / max**: **PASS**, bez findings. Sprawdzono zakres trybu email, konta bez pola hasła, brak duplikatu banera i czyszczenie właściwego pola.

## Testy

Node: `/opt/homebrew/opt/node@22/bin`.

`node --import tsx --test src/features/account/accountSecurityFieldErrors.test.ts src/features/account/accountEmailChangePendingStatus.test.ts src/application/account/accountCommandGuards.test.ts src/application/account/accountIdentityComposition.test.ts src/preferences/settingsPresentation.test.ts`: **65/65 pass**.

Niezależne QA: **95/95 testów account pass**. Typecheck i git diff --check: **pass**. Pierwszy typecheck wykrył typ string[] zamiast tuple w nowym teście. Doprecyzowano tablicę przez as const i ponowiono kontrolę z wynikiem pass. Kod produkcyjny nie zmienił się po rozpoczęciu retestu.

## Retest iOS/Maestro

iPhone 17 / iOS 26.4, EN, dark, standardowy tekst. Świeży bundle: 1676 modułów, proces 61618. Własne lokalne usługi opisane w raporcie 008.

Flow 010-inline-errors.yaml, run **2026-09-08_003845**:

- błędny email: tekst i obramowanie pod właściwym polem, bez górnego banera;
- edycja hasła zachowała błąd emaila;
- poprawny format emaila usunął jego błąd;
- błędne hasło: tekst i obramowanie pod hasłem, bez górnego banera;
- edycja emaila zachowała błąd hasła;
- poprawne hasło usunęło błąd i żądanie otworzyło ekran oczekiwania.

Końcową asercję waiting przesłonił systemowy Save Password: flow exit 1. Po obejrzeniu zrzutu zamknięto Not Now (32%,62%). Kontynuacja 010-finish.yaml, run **2026-09-08_004213**: **7/7, exit 0**. Waiting widoczne, oba pola formularza nieobecne, powrót do Settings poprawny. Nie zaliczono przerwanego flow jako samodzielnego pass.

Przy drugiej edycji testowy eraseText pozostawił końcówkę com; końcowy syntaktycznie poprawny adres miał domenę example.comcom. Nie potwierdzano tego adresu i nie zmieniono tożsamości konta. Przebieg dowodzi korekty błędów i udanego wysłania żądania, nie dostawy poczty. Screenshot błędu hasła pokazuje wcześniejszy poprawny adres path03-inline@example.com.

Kontroler obejrzał pełne screenshoty obu błędów i przejścia do waiting. Dowody: `/private/tmp/patternly-path03`, manifest-010.json. Zachować do pushu ścieżki, potem usunąć nowe dowody.

## Ograniczenia i blokery

Brak otwartego błędu w zakresie 010. Inne formularze obejmie audyt 011. Testowano konto hasłowe na emulatorach; Google/Apple są pokryte mapowaniem i QA, bez provider E2E. PO: brak wymaganej decyzji, licznik 0. VoiceOver pominięty. Brama ścieżki i push pozostają do wykonania.
