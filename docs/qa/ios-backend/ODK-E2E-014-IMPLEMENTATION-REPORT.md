# ODK-E2E-014 — usunięcie Practice Settings

Status: DONE — E2E zweryfikowane.

Zakres sprawdzony: SettingsTab.tsx, HomeScreen.tsx, settings.json EN/PL, settingsPresentation.test.ts, loadingStateOwnership.test.ts, PracticeHubScreen.tsx. Jedyny callback onOpenPracticeSettings należy do zbędnego wiersza głównego Settings. Custom Practice ma osobne wejście.

Plan: usunąć wiersz, prop, callback oraz dwa nieużywane klucze tłumaczeń. Dopasować skeleton Learning z 3 do 2 wierszy. Zachować konfigurację i nawigację Custom Practice. Uaktualnić istniejące testy zamiast dodawać równoległe implementacje.

Niezależna walidacja briefu: gpt-5.6-luna / max, bez narzędzi. Zgodność 0,99; prostota 0,98; ryzyko 0,96; utrzymywalność 0,98. Minimum 0,96, APPROVE.

Weryfikacja planowana: wąskie testy Settings, loading i Practice; typecheck; iOS Settings bez wpisu oraz działający Custom Practice. Testów po zmianie jeszcze nie wykonano. Brak blokera PO, licznik 0.


Wdrożenie: usunięto wiersz, prop i callback oraz po dwa klucze EN/PL. Skeleton Learning ma 2 wiersze. Wyszukiwanie nie znalazło pozostawionych referencji poza asercją braku wpisu. Nie zmieniono samego Practice Setup ani jego trasy.

Testy Settings, loading, Practice route guards i config: końcowo 53/53 PASS, 0 skipped, exit 0. Pierwszy przebieg 51/53: edycja testu usunęła dwa nadal potrzebne odczyty tłumaczeń w innych przypadkach. Przywrócono te odczyty; pozostałe asercje zachowano.

Maestro 2026-09-08_032818: 14 COMPLETED, 0 FAILED. Obejrzano oba screenshoty. Settings pokazuje Learning z Premium i Notifications, bez Practice Settings. Practice → Custom Practice otwiera właściwą konfigurację z 10/20/40 i przyciskiem startu. Powrót do Settings działa. Nie rozpoczęto kolejnej sesji.

Usunięto014 z aktywnej tabeli po E2E. Brak regresji produkcyjnej i blokera PO; licznik0. Pełna brama i push po015. Dowody pozostają tymczasowe do pushu ścieżki.
