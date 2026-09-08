# ODK-E2E-016 — wejście do celu z Settings

Status: DONE po reteście E2E, 2026-09-08.

## Cel i sprawdzone fakty

Settings nie ma wejścia do wspólnego Goal and cadence. Progress otwiera GoalCadenceScreen z aktywnym trackiem. Kontekst loading i gotowego ekranu jest na stałe ustawiony na Progress. Zapis przez persistGoal pozostawia użytkownika na ekranie celu.

Sprawdzono HomeScreen.tsx, SettingsTab.tsx, GoalCadenceScreen.tsx, navigation/types.ts, runtimeSelectors.ts, goalCadencePresentation.test.ts, settingsPresentation.test.ts, loadingStateOwnership.test.ts i lokalizacje EN/PL.

## Zatwierdzony brief

Dodać jeden wiersz Learning i użyć wspólnego ekranu. Parametr returnTo przyjmuje progress albo settings, domyślnie progress. Oba wejścia podają swój kontekst. Wspólny handler cofa po istniejącej historii; przy jej braku otwiera HOME z właściwą zakładką. Kontekst loading i gotowego ekranu jest tłumaczony. Skeleton Learning ma trzy wiersze. Model i zapis celu pozostają wspólne.

Niezależna walidacja: gpt-5.6-luna / max, tylko brief, bez narzędzi. Zgodność 0,98; prostota 0,94; ryzyko 0,91; utrzymywalność 0,96. Minimum 0,91, APPROVE. Zakres C2/R1; model pracownika zgodny z repozytoryjnym AGENTS.md: gpt-5.6-luna / max.

## Plan weryfikacji

Wąskie testy nawigacji, prezentacji i loadingu, typecheck oraz iOS: otwarcie, zapis i powrót z Settings i Progress. Raport zostanie uzupełniony wynikami po wykonaniu. Brak blokera PO. Licznik próśb: 0.

## Wyniki wykonane

Pracownik gpt-5.6-luna / max zmienił dokładnie dziewięć plików opisanych w zakresie: ekran celu, Home, Settings, typy nawigacji, dwie lokalizacje i trzy istniejące testy. Wąskie testy 46/46 PASS; typecheck i diff check PASS.

Maestro 2026-09-08_034842: 31 poleceń COMPLETED, jedno WARNED. Ostrzeżenie dotyczy opcjonalnego Edit goal przy pierwszym otwarciu: cel jeszcze nie istniał, więc formularz był już gotowy do utworzenia. Zapis nowego celu, ponowne otwarcie z Progress, zapis edycji i oba powroty PASS. Obejrzano sześć zrzutów. Powroty i kontekst poprawne, bez obcięcia nowego wiersza.

Retest EN, ciemny motyw, standardowy tekst, Coding Interview. Fallback bez historii i loading sprawdzono kodem oraz testami; nie wymuszano tych stanów na symulatorze. Lokalizacje sprawdzono testami, pełny retest PL nastąpi z końcem ścieżki.

Potwierdzono wcześniejszą wadę kolorów Active: zielony tekst na zielonym tle. Zapisano osobne ODK-E2E-101 z kryteriami retestu. Brak regresji nawigacji. Niezależne QA kodu gpt-5.6-luna / max: PASS. Nie powtarzano testów bez potrzeby. Dowody pozostają do końca i pushu ścieżki 016–021.
