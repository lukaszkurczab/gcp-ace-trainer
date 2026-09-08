# ODK-E2E-019 — nazwa Goal

Status: DONE po reteście E2E. Implementacja po zamknięciu 018.

## Zakres

Sprawdzono nagłówek GoalCadenceScreen, options.title w RootNavigator, wiersz Settings, wspólny klucz common.Goal, lokalizacje EN/PL oraz asercje prezentacji. Przed zmianą nagłówek i navigator używały Goal & cadence. Settings opisywał weekly practice rhythm.

Plan: istniejący common.Goal w obu tytułach. Settings: Goal/Cel, opis Set your learning goal and preferred practice days./Ustaw cel nauki i dni ćwiczeń. Opis formularza: Set your learning goal for this track./Ustaw cel nauki dla tej ścieżki. Usunąć zastąpione klucze po sprawdzeniu referencji. Lokalne klucze Settings zmienić na goal/goalDetail. Zachować techniczne nazwy rout i plików, model oraz layout. Hierarchia nagłówka pozostaje w osobnym 020.

## Walidacja

Niezależny gpt-5.6-luna / max, tylko brief, bez narzędzi. Zgodność celu i architektury 0,97; prostota 0,94; ryzyko 0,90; utrzymywalność 0,93. Minimum 0,90, APPROVE.

Przed usunięciem kluczy sprawdzić wszystkie referencje i asercje. Weryfikacja ma objąć EN/PL, oba wejścia, tytuły, zapis i podsumowanie. Brief zatwierdzono przed implementacją. Brak blokera PO; licznik 0.

## Wykonane zmiany

Kontroler wykonał małą zmianę copy zgodnie z zatwierdzonym briefem. Zmieniono GoalCadenceScreen.tsx, RootNavigator.tsx, SettingsTab.tsx, common.json i settings.json w EN/PL oraz istniejące goalCadencePresentation.test.ts i settingsPresentation.test.ts. Zachowano techniczne nazwy rout/plików.

Sprawdzenie referencji nie znalazło starego produktowego Goal & cadence, Goal and cadence, weekly practice rhythm ani starego opisu w src. Usunięto zastąpione klucze lokalizacji. Wąskie testy46/46 PASS; po dodaniu asercji obu tytułów ponownie46/46 PASS. Typecheck i diff check PASS. Retest EN/PL zakończony.

## Retest

Maestro2026-09-08_040955:59/59 COMPLETED. EN i PL, wejścia Settings i Progress, zapis edycji i powroty. Obejrzano8zrzutów: nowe nazwy, opisy i konteksty poprawne, tekst zawija się bez obcięcia. Przywrócono EN.

W polskim podsumowaniu potwierdzono angielskie skróty Mon/Wed/Sat. To osobne102 w aktywnym rejestrze; dotyczy etykiet dni, nie nazwy ekranu. Znana wada kolorów pozostaje w101. Brak regresji zapisu i nawigacji. Dowody do pushu ścieżki. Licznik PO0.

Dodatkowy retest największego tekstu2026-09-08_042351 zatrzymał się po tapnięciu Edit goal przy dolnej krawędzi. Zrzut pokazał nadal podsumowanie. Scenariusz poprawiono przez centerElement dla akcji edycji; ponowny przebieg wykonano. Nie zmieniono kodu aplikacji.

Druga próba 2026-09-08_042531 zatrzymała się na wierszu Settings poza widokiem po powrocie. Dodano przewinięcie w scenariuszu. Końcowy retest 2026-09-08_042741: 63/63 COMPLETED, exit 0. EN/PL, największy tekst, oba wejścia, edycja, zapis i powroty. Obejrzano wszystkie 8 zrzutów. Przywrócono EN i standardowy rozmiar large. Potwierdzono osobne 103: łamanie etykiety Przypomnienia/Reminders w podsumowaniu. Nie zmieniano kodu między tymi próbami.
