# ODK-E2E-011 — audyt błędów formularzy

Data: 2026-09-08. Status: `VERIFIED_CLOSED` — zakończony audyt, nie naprawa znalezionych wad.

## Walidacja i zakres

Niezależny walidator **gpt-5.6-luna / max** oceniał tylko brief, bez narzędzi. Zgodność 0,96; prostota 0,87; ryzyko 0,91; utrzymywalność 0,92. Minimum **0,87 — APPROVE**. Niezależna inwentaryzacja i QA kodu: również gpt-5.6-luna / max.

Nie zmieniono produkcji. Zmieniono aktywny rejestr i utworzono ten raport. Zadania 003–006 nie były ponownie testowane. VoiceOver pominięto.

Sprawdzone pliki: AccountSecurityScreen, accountSecurityFieldErrors i test, AccountSessionProvider, accountDataService, AccountEntryScreen, useAccountCommand, SettingsTab, LegalRequestsScreen, LegalInformationScreen, YourDataScreen, PrivacyRequestsScreen, SettingsBottomSheet, ContentReportSheet, contentReportDescription i test, GoalCadenceScreen, PracticeSessionSurface, practiceSessionExitCopy, HomeTab, runtimeSelectors, RootNavigator, i18n.ts, locale EN/PL legal/data/common/settings/account, package.json, istniejące flows Maestro.

## Wyniki

| Formularz / próba | Potwierdzony wynik | Zadanie |
| --- | --- | --- |
| Change password: różne nowe hasła | Górny InfoBlock; brak błędu przy potwierdzeniu hasła. | 089 |
| Change password: nowe hasło 123 | Górny InfoBlock; brak wskazania pola nowego hasła. | 089 |
| Recovery codes: błędne hasło | Górny InfoBlock, zamiast błędu przy haśle. | 089 |
| Legal complaint: pusty opis | Błąd za otwartym formularzem. Widać go dopiero po zamknięciu. | 090 |
| Legal withdrawal, gość: not-an-email | Błąd za otwartym formularzem; potwierdzony na świeżym symulatorze. | 090 |
| Legal | Klucze legalRequests zamiast tekstów. QA potwierdziło ten sam problem lookup w data. | 091 |
| Change email: adres drugiego konta, poprawne hasło | Czerwone pole hasła i błędny komunikat o haśle. Przyczyna: email-already-in-use → invalidCredential → reauthenticationRequired. | 092 |
| Goal: 2026-99-99 | Błąd na końcu formularza, za Preferred days i Reminders. Klawiatura zasłania Save goal. | 093 |
| Sign out po Pause and resume later | Blokada chroni sesję, lecz ogólny komunikat nie wskazuje konieczności jej zakończenia. Retry ujawnia resumeRequired. | 094 |
| ContentReport: example@example.com | Błąd w tym samym formularzu, pod polem i opisami. Brak osobnego modalu błędu. | Bez nowego zadania |

Nowe zadania 089–094 mają kryteria akceptacji i pozostają aktywne. Umieszczono je po dotychczasowych ścieżkach produktu, przed provider gate’ami. 091 obejmuje legal/data i zachowanie literalnych kluczy common z kropkami. Nie dublowano błędu hasła przy usuwaniu konta — obejmuje go 051.

Zakres statyczny: AccountEntry oraz czas powiadomień mają walidację przy polach. Błędy Privacy requests są operacyjne. Nie wykonywano ponownie ukończonych ścieżek logowania/rejestracji. Nie wywoływano końcowego eksportu ani usuwania konta. Nie deklaruje się osobnego E2E każdego trybu reautoryzacji export/privacy. ContentReport maxLength=280 ogranicza wejście UI; gałąź too_long ma test domenowy.

## Testy i dowody

`PATH=/opt/homebrew/opt/node@22/bin:$PATH node --import tsx --test src/domain/contentReportDescription.test.ts src/features/account/accountSecurityFieldErrors.test.ts`: **7/7 PASS**, 0 skipped, exit 0. `git diff --check`: PASS. Brama całej ścieżki po 012.

iPhone 17/iOS 26.4: konto EN/dark na `63EFDD0E-94FE-41F7-A651-4122F00FA402`; gość EN/light na nowym `7CB0DBB6-DEB2-4CAB-93FC-DF71CB7A7F8F`. Lokalne Auth 29199, Firestore 38181, backend 28084, Metro 28083. Bez SMTP i providerów produkcyjnych. Kontroler obejrzał pełne screenshoty wszystkich wyników tabeli.

Najważniejsze dowody: 010500 (niezgodne hasła), 010535 (słabe hasło i recovery), 010643 + 010857 (opis zgłoszenia), 011033 (zajęty email), 011612 (data), 011849 (ContentReport), 012625 + 012730 (blokada synchronizacji), 014049 (gość). Wszystkie runID mają prefiks `2026-09-08_`.

Część pełnych flow zakończyła się błędem nawigacji po poprawnie wykonanej próbie. Nie są raportowane jako pełny PASS. Powody: stan klawiatury, nieaktualny nagłówek w flow, zgrupowana etykieta InfoBlock, systemowy Save Password, powrót do Practice settings zamiast bezpośrednio do zakładek, zamierzona blokada wylogowania przez aktywną sesję. Każdy wynik walidacji potwierdzono późniejszą próbą i screenshotem. Próby wylogowania przed ukończeniem sesji nie były pomyślne.

Liczby poniżej pochodzą z commands.json (obejmują także polecenia przygotowawcze Maestro). Zero FAILED oznacza pełny przebieg bez błędu; pozostałe są dowodami częściowymi.

| Run | Flow | COMPLETED | FAILED |
| --- | --- | ---: | ---: |
| 2026-09-08_010222 | ODK011 security field error inventory | 15 | 1 |
| 2026-09-08_010345 | 011-inspect | 2 | 1 |
| 2026-09-08_010500 | 011-submit-again | 6 | 0 |
| 2026-09-08_010535 | ODK011 weak password and recovery audit | 26 | 0 |
| 2026-09-08_010643 | ODK011 legal required field audit | 12 | 1 |
| 2026-09-08_010800 | ODK011 legal untranslated validation audit | 2 | 1 |
| 2026-09-08_010857 | ODK011 legal untranslated validation audit | 6 | 0 |
| 2026-09-08_010929 | ODK011 existing email error audit | 7 | 1 |
| 2026-09-08_011033 | ODK011 existing email result | 8 | 0 |
| 2026-09-08_011156 | ODK011 goal date validation | 4 | 1 |
| 2026-09-08_011300 | ODK011 goal date validation | 6 | 0 |
| 2026-09-08_011352 | ODK011 invalid target date | 7 | 1 |
| 2026-09-08_011518 | ODK011 target date after keyboard dismiss | 2 | 1 |
| 2026-09-08_011612 | ODK011 target date after keyboard dismiss | 8 | 0 |
| 2026-09-08_011655 | ODK011 content report validation | 22 | 1 |
| 2026-09-08_011849 | ODK011 content report after keyboard dismiss | 9 | 1 |
| 2026-09-08_011939 | ODK011 guest legal audit entry | 2 | 1 |
| 2026-09-08_012108 | ODK011 guest legal audit entry | 7 | 0 |
| 2026-09-08_012201 | ODK011 wait for sign out | 2 | 1 |
| 2026-09-08_012328 | ODK011 signout visible button | 5 | 1 |
| 2026-09-08_012510 | ODK011 signout observed position | 3 | 1 |
| 2026-09-08_012625 | ODK011 signout result inspection | 4 | 0 |
| 2026-09-08_012730 | ODK011 inspect pending sync | 6 | 0 |
| 2026-09-08_013416 | ODK011 complete disposable partial session | 4 | 1 |
| 2026-09-08_013532 | ODK011 complete disposable partial session | 8 | 0 |
| 2026-09-08_013925 | ODK011 fresh guest entry | 5 | 0 |
| 2026-09-08_014049 | ODK011 guest email validation | 18 | 0 |

## Dane testowe i ograniczenia

Nie wysłano poprawnego zgłoszenia prawnego ani zgłoszenia treści. Nie potwierdzono zmiany na adres drugiego konta. Nie zapisano błędnego celu. Sesję rozpoczętą do audytu treści zakończono przez Home → Resume → End and view summary, zachowując częściowy wynik (013532).

Automatyczna kontrola odrzuciła późniejsze wylogowanie ze względu na możliwość usunięcia lokalnych danych konta. Odrzuconej operacji nie wykonano. Bezpieczna alternatywa zakończyła się sukcesem: nowy pusty symulator gościa, ten sam build, rzeczywisty test formularza 014049, exit 0. Nie ma przez to blokera audytu ani wymaganej zgody. Istniejący symulator i jego dane zachowano.

Nie wymaga się decyzji PO. Licznik próśb: 0. Po zakończeniu audytu usunięto 011 z aktywnej tabeli; wady 089–094 pozostają OPEN. Dowody w `/private/tmp/patternly-path03` zachować do ukończenia i pushu ścieżki 007–012, potem usunąć. Raport pozostaje w repozytorium. Push ścieżki jeszcze niewykonany.
