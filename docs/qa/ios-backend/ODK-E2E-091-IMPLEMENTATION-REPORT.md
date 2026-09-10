# ODK-E2E-091 — raport implementacji i weryfikacji

Status: `VERIFIED_CLOSED`
Data: 2026-09-10

## Brief

### Cel

Przywrócić prawidłowy odczyt zagnieżdżonych tłumaczeń `legal` i `data` w EN/PL, bez naruszenia istniejącego kontraktu płaskich kluczy zawierających kropki lub dwukropki w pozostałych namespace.

### Ustalenia

Globalne `keySeparator: false` jest wymagane przez płaskie zasoby, między innymi pełne zdania w `common` i klucze pluralizacji w `learningPlan`. Jednocześnie `legal.json` i `data.json` są obiektami zagnieżdżonymi, a runtime odwołuje się do nich ścieżkami z kropkami, dlatego i18next zwracał surowe klucze. Pierwsza hipoteza — globalne włączenie separatora `.` — naprawiła legal/data, ale pełna brama wykazała regresje płaskiego klucza z dwukropkiem i mutowalnego klucza pluralizacji. Nie ma osobnej aktywnej ścieżki i18n, którą należałoby utrzymać.

### Podejście

Pozostawić globalne `keySeparator: false`, a wyłącznie zasoby `legal` i `data` normalizować przy inicjalizacji do jednej płaskiej mapy kluczy. Traktować stringi i tablice jako liście oraz odrzucać deterministycznie i atomowo kolizje klucza zagnieżdżonego z literalnym. Pokryć testami EN/PL, interpolację, tablice, literalne kropki i dwukropki, mutowalne plurale oraz oba porządki kolizji; następnie wykonać pełną bramę i retest ekranów, formularza i błędu na iOS.

Ocena kontrolera: zgodność **0,98**, prostota **0,99**, ryzyko **0,94**, utrzymywalność **0,98**; minimum **0,94**.

## Niezależna walidacja briefu

- Pierwszy brief: `gpt-5.6-luna`, reasoning effort `max`, wyłącznie trzy sekcje briefu; zgodność **0,98**, prostota **0,97**, ryzyko **0,86**, utrzymywalność **0,95**; `APPROVE`.
- Po wykrytej regresji przeprowadzono obowiązkowe przeprojektowanie. Walidator: `gpt-5.6-luna`, reasoning effort `max`, wyłącznie przeprojektowany brief; zgodność **0,97**, prostota **0,94**, ryzyko **0,88**, utrzymywalność **0,95**; `APPROVE`.

## Przyczyna i zakres

Przyczyną była niezgodność formatu dwóch namespace z globalnym kontraktem lookup: zagnieżdżone obiekty `legal`/`data` przy `keySeparator: false` nie mogły być odczytane ścieżkami z kropkami.

Zmienione ścieżki:

- `src/i18n.ts` — lokalna normalizacja namespace `legal` i `data`, walidacja liści oraz deterministyczne wykrywanie kolizji.
- `src/preferences/appPreferences.test.ts` — testy kontraktu lookup i ochrony płaskich kluczy.

Usunięte ścieżki: brak; nie znaleziono zastąpionego runtime ani nieużywanego wariantu do usunięcia. Repozytorium `patternly-content` pozostało bez zmian. Nie dodano fallbacków ani filtrów maskujących braki.

## Kryteria akceptacji

- `legal` i `data` pokazują treści zamiast surowych kluczy — spełnione.
- EN i PL — spełnione.
- Your data, szczegóły danych, Privacy requests, formularz zgłoszenia i błąd walidacji — spełnione.
- Interpolacje oraz tablica sekcji dokumentu prawnego — spełnione.
- Literalne klucze zdań z kropkami, etykiety z dwukropkami i płaskie plurale pozostają zgodne — spełnione.

## Weryfikacja

- Pierwsza hipoteza, test celowany: **7/7 PASS**.
- Pierwsza hipoteza, `npm run qa:static`: **1069/1071 PASS**, **2 FAIL**; wykryte regresje `trackPresentation` oraz `targetDateGuidance`. Hipotezę wycofano i przeprojektowano.
- Końcowe testy relewantne: początkowo **26/26 PASS**; finalne ponowienie rozszerzonego zestawu `appPreferences`, `targetDateGuidance`, `targetDateGuidancePresentation` i `canonicalRegistry`: **28/28 PASS**.
- Końcowe `npm run qa:static`: **PASS** — **1074/1074** testów oraz recovery inventory, typecheck, content boundary i runtime privacy boundary.
- Dodatkowy skan zasobów w niezależnym QA: **2674/2674** wpisów; `legal` **77/77**, `data` **83/83**, parytet EN/PL — **PASS**.
- Maestro na iOS Simulator 26.4: **86/86** poleceń `COMPLETED`; **10/10** zrzutów sprawdzonych wizualnie — **PASS**.

## Dowody

- Flow: `.maestro/screenshot-capture/odk-e2e-091/10-i18n-guest-en-pl.yaml`.
- Finalny pakiet: `artifacts/maestro-screen-capture/odk-e2e-091/2026-09-10-130000/`.
- Pakiet zawiera `commands.json`, `logs/maestro.log`, `manifest.json`, macierz pokrycia, manifest zrzutów, środowisko i raport przebiegu.

## Niezależne QA implementacji

- Recenzent: `gpt-5.6-luna`, reasoning effort `max`, bez edycji.
- Przed E2E: brak P0–P3; oceny zgodność **0,96**, prostota **0,90**, ryzyko **0,93**, utrzymywalność **0,91**; `PASS WITH GAPS` wyłącznie z powodu brakującego wtedy retestu.
- Po E2E: brak P0–P3; niezależnie wykonane `appPreferences` **10/10**, zestaw i18n/preferencji/prezentacji **86/86**, typecheck i `git diff --check` — **PASS**. Wszystkie 10 obrazów oraz manifest i komendy Maestro zostały sprawdzone.
- Oceny końcowe: zgodność **0,97**, prostota **0,91**, ryzyko **0,93**, utrzymywalność **0,90**; minimum **0,90**.
- Werdykt końcowy: `PASS`.

## Regresje, ograniczenia i ryzyka

- Regresji w rozwiązaniu końcowym nie wykryto. Regresje pierwszej hipotezy zostały wykryte przez pełną bramę i usunięte przez przeprojektowanie.
- Retest obejmuje gościa; stan zalogowany namespace `data` pozostaje szerszym, osobnym kryterium ODK-E2E-104 i nie jest maskowany tym zamknięciem.
- Dowód pochodzi z lokalnego development clienta na symulatorze, nie z finalnego archiwum App Store ani urządzenia fizycznego.
- Recenzent nie powtarzał pełnego `qa:static` ani Maestro; wykonał niezależne kontrole wąskie i zweryfikował finalne artefakty. Cztery przejściowe ostrzeżenia wyszukiwania elementu podczas przewijania zakończyły się skutecznym retry i nie zmieniły wyniku 86/86.
