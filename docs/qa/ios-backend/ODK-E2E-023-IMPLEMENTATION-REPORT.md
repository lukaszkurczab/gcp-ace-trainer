# ODK-E2E-023 — kontekst powrotu z Reminders

Status: DONE po E2E. Retest E2E pozostaje po stronie kontrolera.

## Ustalenia

Sprawdzono NotificationSettingsScreen, GoalCadenceScreen, HomeScreen, typy rout, ScreenHeader oraz testy prezentacji. Reminders ma stały kontekst Settings. Są trzy wejścia: Settings, formularz Goal i podsumowanie Goal. Goal zna trackId i swój returnTo. Jego loader przy każdym focus nadpisuje draft i dateInput. To gubi niezapisane zmiany po powrocie. persistGoal jest wywoływane tylko w GoalCadenceScreen.

## Podejście

Jeden ekran Reminders. Parametry jako discriminated union: settings albo goal z trackId i returnTo. Domyślnie settings. Nagłówek i etykieta powrotu tłumaczą źródło. Przy historii użyć goBack. Bez historii przejść do HOME/settings albo GOAL_CADENCE z kontekstem.

Loader Goal ma działać przy montowaniu i zmianie route.params.trackId. Zachować anulowanie odczytu i obsługę błędów. Usunąć zastąpiony useFocusEffect. Nie zmieniać harmonogramu.

## Walidacja

Niezależny gpt-5.6-luna / max, tylko brief, bez narzędzi. Pierwszy brief: minimum 0,89. Po potwierdzeniu resetu draft: zgodność 0,96; prostota 0,89; ryzyko 0,84; utrzymywalność 0,91. Minimum 0,84, APPROVE.

## Weryfikacja do wykonania

Wąskie testy obu źródeł, braku parametrów, obu fallbacków i loadera. E2E EN/PL z trzech wejść. Zmienić dzień bez zapisu, wejść do Reminders i wrócić do niezmienionego formularza. Wyjść bez zapisu i wejść ponownie z Home; musi wrócić zapisany rekord. To sprawdzi, czy stos nie zachowuje starej trasy.

## Implementacja

`NOTIFICATION_SETTINGS` przyjmuje jawny union `source: "settings"` albo `source: "goal"` z `trackId` i `returnToGoal: GoalCadenceReturnTo`; brak parametrów zachowuje domyślny kontekst Settings. Wejścia z Settings i Goal przekazują odpowiedni wariant. Przy historii ekran używa `goBack()`. Przy braku historii używa `replace()`: do Home z `initialTab: "settings"` dla Settings oraz do Goal z zachowanym `trackId` i `returnToGoal` dla Goal, aby ekran Reminders nie został pod spodem stosu.

Dokładne etykiety przycisku powrotu: EN `Back to Settings` / `Back to Goal`; PL `Wróć do Ustawień` / `Wróć do celu`. Kontekst nagłówka to odpowiednio Settings/Goal. Loader Goal używa `useEffect` przy montowaniu i zmianie `route.params?.trackId`; anulowanie odczytu i obsługa błędów pozostają zachowane, a powrót z Reminders nie resetuje draftu ani `dateInput`.

Korekta fallbacku `replace()` została niezależnie zatwierdzona: zgodność 0,98; prostota 0,96; ryzyko 0,94; utrzymywalność 0,95; minimum 0,94.

## Wykonane sprawdzenia

- `PATH=/opt/homebrew/opt/node@22/bin:$PATH node --import tsx --test src/preferences/notificationPresentation.test.ts src/features/home/goalCadencePresentation.test.ts src/navigation/loadingStateOwnership.test.ts` — 34/34 PASS.
- `PATH=/opt/homebrew/opt/node@22/bin:$PATH npm run typecheck` — PASS.
- `git diff --check` — PASS.
- E2E, Metro i usługi nie były uruchamiane; retest trzech wejść i niezapisanego draftu pozostaje do wykonania przez kontrolera.

PO: 0 próśb, brak blokera.

Niezależne QA kodu: gpt-5.6-luna / max, PASS. Potwierdzono union, trzy wejścia, default Settings, goBack/replace, kontekst i cleanup loadera. Testów nie powtarzano. Brama kontrolera qa:static:885/885 PASS,0skip; recovery/typecheck/content boundary/runtime privacy boundary PASS. Wynik retestu natywnego poniżej.

Retest Maestro2026-09-08_045421: 77/77 COMPLETED, exit0. EN/PL, trzy wejścia, właściwe konteksty i powroty. Dodatkowy wtorek pozostał zaznaczony w draft po powrocie. Po wyjściu bez zapisu i świeżym wejściu wróciło podsumowanie3dni Mon/Wed/Sat. Obejrzano12zrzutów. Przywrócono EN. Brak nowej regresji; znane101/102 pozostają aktywne.

Ograniczenia: fallback bez historii i zmiana trackId w istniejącej trasie sprawdzone statycznie, nie wywołano ich sztucznie na iOS. Runtime E2E objął rzeczywiste trzy wejścia oraz świeże wejście z Home. Nie dodano debugowych dróg wejścia. Nie wykonano VoiceOver.
