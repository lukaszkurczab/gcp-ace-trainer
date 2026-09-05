# Korekta po informacji użytkownika — Progress / Settings

Stan: zakończone; P6/P7 i korekty QA zweryfikowane. Raport końcowy: [followup-report.md](followup-report.md). Wcześniejszy refaktor pozostaje w checkout i nie może zostać nadpisany.

## Cel
Recent activity w Progress = lista wykonanych aktywności/sesji, każda prowadzi do szczegółów dokładnie tej sesji. Settings = czytelny stan gościa/konta, właściwe zarządzanie i dostępne wylogowanie. Udostępnić istniejące funkcje oczekiwane w ustawieniach, bez pustych pozycji i backendowych obietnic.

## Dowody
- progressTabModel.buildActivityItems mapuje pojedyncze trainingAttempts; ProgressTab.ActivitySection pokazuje View bez onPress. To błędna semantyka recent activities mimo poprawnej osobnej Activity.
- application/activityReadModels ma terminal session records; ActivityScreen posiada trasy generic/coding/simulation wyników. To kanoniczne źródło do reuse.
- SettingsTab ma stały Account label/copy, HomeScreen zawsze otwiera ACCOUNT_ENTRY. AccountEntry rozróżnia authenticated synced (istniejący AccountManagementScreen), preview/recovery oraz guest auth. Sam provider ma operację signOut i ochronę pending sync.
- AppPreferencesProvider ma language system/en/pl i setLanguage, bez dostępnego wyboru w Settings.

## Podejście i zakres
P6: ProgressTab/progressTabModel, HomeScreen wiring, Activity model/typed route helper i reader tylko w zakresie realnego reuse; usunąć attempt-based recent projection, zachować evidence/metric calculations. Nie ponawiać tego samego attempts read; błędy explicit.
P7: Settings/account state presentation, istniejący signOut z guardami/busy/error, jasno nazwane logowanie dla gościa i zarządzanie dla konta. Język wykorzystuje istniejący provider i ChoiceRow. Minimalne EN/PL copy, trasy/komponenty/testy wynikające z integracji.

## Kontrakty
SessionId identyfikuje wiersz i wynik; completed z zerem answers nadal aktywność; active nie jest zakończoną aktywnością; ended-early z committed attempt zachowuje dotychczasową semantykę Activity. Wylogowanie nie omija synchronizacji, nie udaje sukcesu. Nie wylogowywać faktycznego konta użytkownika podczas testów. Nie dodawać fikcyjnego eksportu/usuwania/przełączników.

## Ocena wstępna
Architektura .91, prostota .88, bezpieczeństwo .85, utrzymywalność .90; min .85. Reuse istniejących modeli/providerów, ryzyko głównie async/navigation/account lifecycle. Niezależny briefing Cel/Ustalenia/Podejście wysłany Luna/max; wynik przed zmianami produkcji.

## Zadania
- [x] P6 dane sesji, recent UI i exact navigation, narrow tests — 31/31 + 17/17, typecheck PASS; [raport](P6.md)
- [x] P7 account/settings/signout/language, narrow tests — 51/51 + typecheck PASS; [raport](P7.md)
- [x] niezależny code QA i korekty — P6 min .86; P7 recheck min .88 PASS
- [x] qa:static + native Progress→result, guest Settings/account i language, large text — final757/757 PASS
- [x] końcowy zakres, wyniki i ograniczenia — followup-report.md

## Weryfikacja
Narrow tests dobrane do finalnych plików; npm run qa:static; git diff --check. Native istniejący iOS simulator i guest z ukończoną sesją, bez resetowania danych/backendu. Stany authenticated/signout failure/blocked przez istniejące testy providerów i nowe testy prezentacji; nie zakładać native login bez testowego konta.

## Walidacja briefingu — przed kodem
Niezależny Luna/max, wyłącznie Cel/Ustalenia/Podejście, bez narzędzi: .86/.84/.82/.87, min .82. Uwzględniono doprecyzowanie: Home/application owner dostarcza pełne kanoniczne terminal records, a nie wyłącznie attempts; istniejący wynik odczytu attempts ponownie użyty bez drugiego odczytu.

## Macierz Settings
| Stan | Prezentacja i działanie |
|---|---|
| guest/signedOut | jasno nazwane logowanie/rejestracja oraz informacja o lokalnym gościu, bez fikcyjnego Sign out |
| authenticated synced | konto/tożsamość, istniejące zarządzanie (recovery/delete), widoczne Sign out przez provider |
| authenticated pending/error/preview | status i wejście do istniejącego preview/recovery; provider kontroluje Sign out i pokazany jest failure/pending, brak przedwczesnej nawigacji |
| verificationPending/backendUnavailable/revokedSession/guestAccessBlocked | prawdziwy status i wejście do istniejącej ścieżki naprawy/weryfikacji, brak udawania gotowego zarządzania |
| loading/signingOut/deleting/unavailable | busy lub unavailable, zablokowane nieprawidłowe akcje, zachowane dostępne wyjście |

Język: system/en/pl przez setLanguage, synchronizacja etykiet z providerem, synchroniczna blokada zapisu i jawny błąd. Nie zmieniać konta/synchronizacji w celu uproszczenia UI.

## Doprecyzowanie po badaniu P7
Istniejące AccountManagementScreen i AccountRecoveryScreen zapewniają recovery codes, deletion oraz sign-out. Nie tworzymy drugiej implementacji tych funkcji. Błąd management copy wynika z użycia accountDescription przeznaczonego dla logowania; należy wydzielić opis zarządzania i pokazać email, jeżeli jest dostępny. App.tsx zachowuje ten sam application-session key dla guest/authenticated/signingOut/deleting — te przejścia nie resetują same w sobie nawigacji. RootNavigator zachowuje bieżący gate. Brak backendowego API do zmiany email/hasła/providers/subscriptions oznacza brak nowych pustych pozycji. Ocena wykonawcy P7: .93/.88/.84/.90, min .84.

## Native P6 — pierwszy przebieg
Maestro na istniejącym iOS 26.4 / iPhone 17: `flows/followup-progress.yaml` PASS. Progress pokazał jedną sesję Custom Practice z 10 pozycjami (zamiast 10 odpowiedzi); kliknięcie otworzyło `patternly:summary:root:coding-interview-dsa-problem-solving:coding-interview-custom-practice:1`, 5/10 correct, Review answers i Back to practice. Obejrzano oba PNG. Dowody lokalne: `artifacts/screen-refactor-2026-09-05/followup/2026-09-05_114704/Progress recent session opens its result/`. Próba nie zmieniała istniejącej sesji ani konta. Duży tekst i Settings pozostają do finalnego przebiegu po P7.

## Końcowe native — ukończone scenariusze
- `followup-language.yaml`, run 2026-09-05_121126: PASS — pl, powrót do Settings i ponowne otwarcie języka, system, en; obejrzane PNG pl/settings/system przy dark i maksymalnym dużym tekście. Nazwa pierwszego PNG `language-en` w ponowieniu jest historycznym artefaktem skryptu: start tego ponowienia był już w pl; nie traktować nazwy jako dowodu locale.
- `followup-account.yaml`, run 2026-09-05_121646: PASS — guest row ma jawny cel Sign in or create an account, brak Sign out, otwarcie formularza email, powrót przez account-sign-in-guest do Settings. Obejrzany guest Settings PNG. Wcześniejsze próby poprawiono pod scalone etykiety dostępności i prawdziwe wyjście z auth form zamiast nieistniejącego Go back.
- `followup-progress-layout.yaml`, run 2026-09-05_121753: PASS — oba PNG obejrzane: nagłówek/link w osobnych wierszach, cały wpis sesji oraz panel diagnostics z tekstem i przyciskiem bez ściskania wyrazów.
- iOS system przywrócony do large/light, app appearance system i język en. Nie wykonano logowania, wylogowania rzeczywistego konta, resetu danych ani nowej sesji.
- Druga pełna bramka przed korektą provider QA: 754/754 i wszystkie składowe PASS, `followup-final-qa.log`. Po zmianie provider required ponowny zakres account/typecheck i final gates.

## Zamknięcie
Po korekcie provider pełne `npm run qa:static` PASS, 757/757, log followup-release-qa.log; końcowy diff-check PASS. Niezależny recheck account62/62 PASS i min .88. Końcowy guest native run 2026-09-05_122804 PASS, PNG large/light/en obejrzany. Wszystkie zatwierdzone etapy zamknięte; granice dowodu oraz listy plików w followup-report.md.
