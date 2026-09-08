# Ścieżka ODK-E2E-016–021

Status: PARTIAL_BLOCKED. Baza aplikacji c556ef6, main/origin/main. Do pushu przygotowano zweryfikowane 016, 018 i 019. Zadania 020–021 pozostają aktywne i zablokowane.

| Zadanie | Stan | Wynik |
| --- | --- | --- |
| 016 | DONE po E2E | Wspólny cel z Settings i Progress; 46/46 testów, typecheck PASS; Maestro31COMPLETED+1opcjonalnyWARN, 6 obejrzanych zrzutów; niezależne QA PASS |
| 018 | DONE po E2E | Dni określają liczbę sesji;14/14 testów, typecheck, QA PASS; Maestro43/43+18/18,6obejrzanych zrzutów |
| 019 | DONE po E2E | Goal/Cel w EN/PL;46/46 testów i typecheck PASS;Maestro59/59 oraz63/63 z największym tekstem,16obejrzanych zrzutów |
| 020 | BLOCKED | Trzy warianty i specyfikacja gotowe; pięć próśb bez wyboru PO |
| 021 | BLOCKED | Zależne od nierozstrzygniętej decyzji020; brak implementacji |

Wszystkie walidacje i prace agentów: gpt-5.6-luna / max, zgodnie z AGENTS.md. Oceny minimalne:016=0,91;018=0,84;019=0,90;020=0,84. Raporty zadań opisują fakty i ograniczenia.

Nowe zadanie101: słabo czytelny Active w podsumowaniu Goal. Pozostaje w aktywnym rejestrze. Nie wykonano VoiceOver. Licznik próśb PO020:5/5; pominięto020 i zależne021, zachowując je w aktywnym rejestrze. Dowody ścieżki05 pozostają tymczasowo do zakończenia ścieżki. Materiały020 są potrzebne do wznowienia po decyzji PO. Końcowa brama dla wdrożonego zakresu została wykonana.

Nowe102: angielskie skróty dni w polskim podsumowaniu celu.

Brama po016/018/019: npm run qa:static PASS,884/884,0pominiętych, typecheck/recovery/content boundary/runtime privacy boundary PASS. Wynik nie obejmuje niewdrożonego021.

Nowe 103: łamanie etykiety przypomnień przy największym tekście, potwierdzone w EN i PL. Dwie pierwsze próby dużego tekstu wymagały korekty przewijania scenariusza. Końcowy przebieg przeszedł bez zmian kodu. Przywrócono EN i standardowy tekst.
