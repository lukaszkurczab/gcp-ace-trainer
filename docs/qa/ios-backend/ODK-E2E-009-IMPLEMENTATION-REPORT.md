# ODK-E2E-009 — ekran oczekiwania na zmianę adresu

Status: `VERIFIED_CLOSED`, 2026-09-08. Commit i push po całej ścieżce 007–012.

## Przyczyna i zmiany

Po wysłaniu linku aplikacja pozostawiała użytkownika na formularzu. Potwierdza to obejrzany screenshot z retestu 008: run 2026-09-07_235052. Kod i bieżące testy były źródłem prawdy.

Sprawdzono rejestr, AGENTS.md, AccountSecurityScreen, AccountSessionProvider.requestEmailChange, FirebaseAuthClient, ROUTES, RootStackParamList, RootNavigator, MeResponseDto, Screen/ScreenHeader/InfoBlock, AppearanceSettingsScreen, locale i testy account/settings.

- Dodano AccountEmailChangePendingScreen oraz accountEmailChangePendingStatus.ts/test.
- Dodano route w constants/routes.ts, navigation/types.ts i RootNavigator.tsx.
- AccountSecurityScreen przechwytuje UID i znormalizowany adres przed żądaniem. Po verificationSent zastępuje formularz nową route. Hasło nie trafia do parametrów.
- Ekran pokazuje waiting, confirmed, refreshError lub unavailable. Sukces wymaga zgodnego UID, adresu i emailVerified w Firebase oraz backendzie. Błąd refresh ma pierwszeństwo przed zapisanymi danymi. Inna sesja nie pokazuje starego adresu.
- Provider czyści stary błąd refresh dopiero po udanym nowym żądaniu i kontroli UID/generacji. Kolejny błąd odświeżania nadal jest widoczny.
- Zmieniono EN/PL Settings i powiązany test accountIdentityComposition. Usunięto zastąpiony formularzowy sukces oraz osierocony emailVerificationSent.

Nie dodano listenera, pollingu, zależności ani persystencji oczekiwania. Ekran korzysta z globalnego odświeżania 008. Powrót prowadzi do Settings.

## Walidacja i QA

Delegowany wykonawca, walidatorzy i QA: **gpt-5.6-luna / max**. Walidacja dotyczyła wyłącznie briefów, bez narzędzi/repo.

| Brief | Zgodność | Prostota | Ryzyko | Utrzymywalność | Minimum |
| --- | --- | --- | --- | --- | --- |
| Ekran oczekiwania | 0,94 | 0,88 | 0,84 | 0,91 | 0,84 — APPROVE |
| Reset starego błędu | 0,95 | 0,91 | 0,87 | 0,92 | 0,87 — APPROVE |

QA wykryło P2: stary błąd refresh przechodził do nowego żądania. Po walidacji kontroler dodał jednowierszowy reset w istniejącej metodzie, po sukcesie i canContinue, bez kolejnego await. Końcowe QA: **PASS**, P2 zamknięte. Przypadek potwierdzono także w E2E.

## Testy finalne

Node: `/opt/homebrew/opt/node@22/bin`.

`node --import tsx --test src/application/account/accountCommandGuards.test.ts src/application/account/accountForegroundRefresh.test.ts src/application/account/accountIdentityComposition.test.ts src/features/account/accountEmailChangePendingStatus.test.ts src/preferences/settingsPresentation.test.ts`: **63/63 pass**, zero skipped. Kontroler powtórzył przebieg po korekcie P2. Niezależne QA account/status: **47/47 pass**. Typecheck i git diff --check: **pass**, także w QA.

Testy statusu obejmują oczekiwanie, pełną zgodność, niezgodność każdej warstwy, każdą flagę emailVerified, inne UID oraz priorytet błędu.

## Retest iOS/Maestro

iPhone 17 / iOS 26.4, EN, dark, standardowy tekst. Izolowane usługi jak w 008. Świeży bundle: 1675 modułów, proces 60164.

| Przepływ | Run 2026-09-08 | Wynik |
| --- | --- | --- |
| 009-old-refresh-error.yaml | 002507 | 5/5, exit 0 |
| 009-request-from-error.yaml | 002546 | request udany; asercję waiting przesłonił systemowy Save Password, exit 1 |
| 009-dismiss-save-password.yaml | 002730 | 7/7, exit 0 |
| 009-still-waiting.yaml | 002808 | 4/4, exit 0 |
| 009-offline.yaml | 002848 | 3/3, exit 0 |
| 009-recovered.yaml | 003157 | 4/4, exit 0 |
| 009-confirmed.yaml | 003253 | 9/9, exit 0 |

Stary błąd był widoczny przed nowym żądaniem. Po udanym wysłaniu linku ekran pokazał waiting bez starego błędu i bez pól formularza. Widoczny systemowy dialog zamknięto po obejrzeniu screenshotu przyciskiem Not Now (32%,62%). Kontynuowano ten sam przebieg. Nie zaliczono przerwanego flow jako samodzielnego pass.

Powrót z Safari bez potwierdzenia zachował waiting. Firebase i backend nadal miały poprzedni adres: **4/4 kontrole**. Kolejna kontrolowana niedostępność backendu pokazała nowy błąd; wznowienie i foreground przywróciły waiting. Następnie otwarto rzeczywisty emulatorowy link w Safari. Powrót pokazał confirmed. Firebase email, identityMappings.email i users.contactEmail były zgodne z path03-waiting@example.com; emailVerified=true: **4/4, exit 0**. Przycisk wrócił do Settings z nowym adresem.

Kontroler obejrzał pełne screenshoty waiting, błędu, confirmed oraz Settings. Dowody w `/private/tmp/patternly-path03`, manifest-009.json. Zachować do pushu ścieżki, potem usunąć nowe dowody.

## Ograniczenia i blokery

E2E używa konta hasłowego i lokalnych emulatorów. Końcowy redirect linku ma ograniczenie lokalnego serwera web opisane w raporcie 008. Nie testowano prawdziwej dostawy poczty ani OAuth Google. Brak otwartego błędu w zakresie 009. PO: brak wymaganej decyzji, licznik 0. VoiceOver pominięty. Pełna brama ścieżki i push pozostają do wykonania.

## Korekta bramy całej ścieżki

Końcowa brama wykryła nieaktualną macierz tras w `src/components/visualShell.test.ts`: 32 zamiast 33. Dodano ACCOUNT_EMAIL_CHANGE_PENDING do listy tras bez natywnego nagłówka i sprawdzono jego ScreenHeader oraz bezpieczne krawędzie. Kod ekranu był poprawny. Niezależna walidacja gpt-5.6-luna / max: zgodność 0,99, prostota 0,97, ryzyko 0,97, utrzymywalność 0,96; minimum 0,96, APPROVE. Test visualShell: 15/15 PASS. Powtórna brama `npm run qa:static`: exit 0, recovery check i typecheck PASS, 875/875 testów PASS, 0 skipped, obie bramy content/runtime privacy PASS.
