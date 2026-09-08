# ODK-E2E-022 — nazwa Reminders

Status: DONE po rzeczywistym E2E.

## Fakty i zakres

NotificationSettingsScreen, RootNavigator i Settings pokazują Notifications. Goal pokazuje Reminders, ale opis i link używają notification settings. Trzy wejścia mają wspólny ekran. Zgoda systemowa jest zgodą na powiadomienia; jej poprawne copy pozostaje.

Plan: nazwa powierzchni Reminders/Przypomnienia w screen title, navigatorze, Settings i linku Goal. Opis Goal: Configure your practice reminders./Ustaw przypomnienia o ćwiczeniach. Użyć common.Reminders dla navigatora i lokalnych kluczy reminders. Usunąć zastąpione klucze po sprawdzeniu referencji. Zachować techniczne nazwy komponentu, rout i namespace. Bez zmian harmonogramu, modelu ani kontekstu powrotu023.

Sprawdzono NotificationSettingsScreen.tsx, RootNavigator.tsx, SettingsTab.tsx, GoalCadenceScreen.tsx, lokalizacje oraz notificationPresentation.test.ts, settingsPresentation.test.ts i goalCadencePresentation.test.ts.

## Niezależna walidacja

Gpt-5.6-luna / max, tylko brief, bez narzędzi. Zgodność0,95; prostota0,93; ryzyko0,91; utrzymywalność0,94. Minimum0,91, APPROVE. Testy mają potwierdzić wspólną nazwę we wszystkich wejściach oraz zachowane Enable notifications/Notifications allowed dla zgody systemowej. Retest EN/PL z obu ekranów źródłowych. Walidacja poprzedziła implementację i testy. Licznik PO0 dla tego zadania.

## Implementacja

Worker gpt-5.6-luna / max. Zmieniono NotificationSettingsScreen.tsx, SettingsTab.tsx, GoalCadenceScreen.tsx, RootNavigator.tsx i EN/PL common.json, settings.json, notifications.json. Usunięto zastąpione klucze po kontroli referencji. Ujednolicono też loading i błędy odczytu. Zgoda systemowa zachowuje poprawne określenie powiadomień. Routy, model i harmonogram bez zmian.

Rozszerzono istniejące notificationPresentation.test.ts, settingsPresentation.test.ts i goalCadencePresentation.test.ts. Testy: 24/24 PASS. Walidacja JSON, typecheck i diff check PASS. Kontroler sprawdził diff i wskazał brakujące copy loading/error; worker uzupełnił je przed testami.

Osobne023 obejmie dynamiczny kontekst i utratę draft po powrocie. Nie przedstawiamy tej znanej wady jako naprawionej w022.

Pierwszy retest 2026-09-08_044133: FAIL scenariusza. Wiersz przypomnień był pod dolnym paskiem. Tapnięcie trafiło w Practice. Zrzut potwierdza zasłonięcie. Dodano centerElement do przewijania; kod bez zmian. Dalsze wyniki poniżej.

Próba 2026-09-08_044234 potwierdziła Settings i podsumowanie. Zatrzymała się na selektorze opisu formularza: iOS łączy tytuł i opis w jedną etykietę przycisku. Zrzut pokazuje poprawne copy. Dopasowano selektor do rzeczywistej etykiety. Kod bez zmian.

Końcowy Maestro 2026-09-08_044408: 65/65 COMPLETED, exit 0. EN i PL, trzy wejścia i powroty. Obejrzano wszystkie 10 zrzutów. Nazwy i opisy są spójne. Zgoda systemowa nadal używa powiadomień. Przywrócono EN. Znane023,101,102 pozostają osobno. Nie wymuszano błędów odczytu ani zmiany zgody systemowej. Dowody tymczasowe do zakończenia i pushu ścieżki.
