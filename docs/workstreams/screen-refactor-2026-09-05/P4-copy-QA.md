# P4 — korekta informacji po native QA
Kontroler, mała bezpośrednia korekta dwóch locale po sprawdzeniu accountDataService preview/confirm i istniejącej ścieżki gościa. Ocena przed zmianą: architektura .95, prostota .95, bezpieczeństwo .90, utrzymywalność .92; min .90.

Zrzut ujawnił sprzeczność „Not collected / No account, cloud history” z opcjonalnym kontem. Zmieniono EN/PL na konto opcjonalne do lokalnej nauki, zachowano osobny podgląd i potwierdzenie synchronizacji. Usunięto techniczny opis Firebase/App Check z UI oraz powtórzone zdanie o przywracaniu. Bez zmiany danych, allowlist, obietnic prawnych i persystencji. Weryfikacja locale/settings i niezależny przegląd w toku.

Native klawiatura: reminder-invalid-output/2026-09-05_093555 potwierdza zasłonięte Save i przewinięty Close. Mała korekta shared sheet: KeyboardAvoidingView zmniejsza przestrzeń panelu przy klawiaturze; usunięto konkurencyjne automatyczne insets. Ocena przed zmianą: spójność .90, prostota .92, bezpieczeństwo .84, utrzymywalność .90; min .84. Android wymaga osobnego native sprawdzenia.
