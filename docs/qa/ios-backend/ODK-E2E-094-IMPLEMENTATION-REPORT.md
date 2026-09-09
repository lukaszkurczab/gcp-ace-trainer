# ODK-E2E-094 — wskazanie niedokończonej sesji przy wylogowaniu

Data: 2026-09-09. Status: `VERIFIED_CLOSED`.

## Cel i zakres

Po wstrzymaniu sesji wylogowanie nie może sugerować, że wystarczy ponowić synchronizację. Użytkownik musi zobaczyć, że sesja i odpowiedzi są zapisane na urządzeniu. Dane lokalne, konto i blokada bezpiecznego wylogowania pozostają bez zmian.

Nie zmieniono synchronizacji, providera, backendu, pakietów treści ani późniejszych zadań. VoiceOver pominięto. Provider/release gate’y ODK-E2E-082–088 i 099 pozostają osobną kolejką.

## Brief i walidacja przed zmianą

Brief miał dokładnie sekcje `Cel`, `Ustalenia` i `Podejście`. Niezależny walidator gpt-5.6-luna / max, bez narzędzi, zaakceptował go:

| Kryterium | Wynik |
| --- | ---: |
| Zgodność celu i architektury | 0,93 |
| Prostota | 0,95 |
| Ryzyko | 0,86 |
| Utrzymywalność | 0,89 |
| Minimum | 0,86 |

Wynik: `APPROVE`.

## Ustalenia

`AccountSessionProvider` zachowuje stan uwierzytelnienia po nieudanym przygotowaniu wylogowania. `AccountEntryScreen` już pokazuje kanoniczny stan `resumeRequired`. Problem dotyczył wyłącznie lokalnego komunikatu w `SettingsTab`: błąd `pendingSyncRequiresNetwork` zasłaniał przyczynę `resumeRequired`.

## Implementacja

Zmiana obejmuje dwa pliki:

- `src/features/home/tabs/SettingsTab.tsx` mapuje tylko parę `pendingSyncRequiresNetwork` + `accountDataStatus === resumeRequired` na istniejące klucze `resumeRequired` i `resumeRequiredDescription`.
- `src/features/home/tabs/settingsAccountPresentation.test.ts` sprawdza mapowanie, fallback, testID oraz zgodność kluczy i treści EN/PL.

Pozostałe błędy zachowują dotychczasowy jawny komunikat. Nie dodano atrap, fałszywego sukcesu ani ukrytego fallbacku.

## Ocena po implementacji

Niezależne QA gpt-5.6-luna / max, w trybie tylko do odczytu, dało wynik `PASS` bez P0/P1/P2:

| Kryterium | Wynik |
| --- | ---: |
| Zgodność celu i architektury | 0,99 |
| Prostota | 0,98 |
| Ryzyko | 0,98 |
| Utrzymywalność | 0,95 |
| Minimum | 0,95 |

## Weryfikacja

- `node --import tsx --test src/features/home/tabs/settingsAccountPresentation.test.ts` — 5/5 PASS.
- `npm run typecheck` — PASS.
- `git diff --check` — PASS.
- `npm run qa:static` — PASS: inwentaryzacja recovery, typecheck, pełny `npm test` 1056/1056, content boundary i runtime privacy boundary.
- Maestro — PASS, run `2026-09-09_202308`. Scenariusz potwierdził przycisk wylogowania, komunikat `Sesja zapisana na tym urządzeniu`, brak `settings-sign-out-error` oraz otwarcie `account-sync-resume-required`.

## Retest wizualny

Urządzenie: `Patternly_QA_Guest_20260908`, iOS 26.4, iPhone 17 simulator, PL/light. Konto: `path03-waiting@example.com`. Sesja: track `coding-interview-dsa-problem-solving`, tryb `coding-interview-guided-practice`, id `3`; odpowiedziano na `alg-complexity-amortized-001`, następnie wybrano `Przerwij i wróć później`.

Pakiet screenshotów znajduje się tymczasowo w:

`artifacts/maestro-screen-capture/odk-e2e-094/2026-09-09-2025/`

Najważniejsze dowody:

- `screenshots/odk-e2e-094__session__010__pause-confirmation__light__ios-iphone-17.png`
- `screenshots/odk-e2e-094__settings__040__resume-required__light__ios-iphone-17.png`
- `screenshots/odk-e2e-094__account__050__resume-required__light__ios-iphone-17.png`

Lokalne Auth, Firestore, API i Metro działały na emulatorach. Nie użyto prawdziwych providerów.

## Wynik

Kryteria ODK-E2E-094 są spełnione. Po błędzie wylogowania użytkownik widzi przyczynę `resumeRequired`, pozostaje zalogowany, zachowuje odpowiedzi i może wrócić do ekranu odzyskiwania sesji. Raport i dowody są tymczasowe i zostaną usunięte dopiero po udanym pushu.
