# AUD-08/B1b4a — aktywny cel webhooka RevenueCat

**Data:** 24.09.2026  
**Backend:** `patternly-backend/main` `b077517`; lokalnie, bez wdrożenia  
**Odbiór:** niezależne QA `PASS WITH ISSUES`.

Webhook z własną weryfikacją podpisu sprawdza aktywny stan konta w transakcji przed projekcją uprawnienia, przeniesieniem zakupu, odczytem/ponowieniem potwierdzenia i aktualizacją statusu dostarczenia. Przeniesienie sprawdza aktywność celu i źródeł, których uprawnienie byłoby zmieniane. Brakujące, usuwane lub usunięte konto nie dostaje zapisu podrzędnego ani danych paragonu; zdarzenie może otrzymać terminalny wynik ignorowany. Nie dodano fikcyjnego claimu sesji do webhooka. Tombstone tożsamości Firebase jest kluczowany inaczej niż identyfikator konta RevenueCat, więc webhook opiera się na stanie konta i jego braku po usunięciu.

Wykonawca i niezależne QA potwierdzili typecheck, lint, build, `git diff --check` i **9/9** testów webhooka na izolowanym emulatorze. Testy obejmują nieaktywne konto przy zakupie, ponowienie po rozpoczęciu usuwania, transfer z nieaktywnym źródłem lub celem oraz późną aktualizację statusu paragonu. Skrypt testów przeszedł; wrapper Firebase zgłosił błąd aktualizacji podczas zamykania emulatorów. Wspólnych danych nie czyszczono.

**Pozostała luka QA:** e-mail paragonu jest wysyłany poza transakcją. Gdy usuwanie zacznie się po transakcyjnym claimie paragonu, a przed wywołaniem nadawcy, może dojść do wysyłki już po zmianie stanu konta. Późniejszy zapis statusu zostanie odrzucony, lecz sam e-mail nie jest cofany. Wspólny kontrakt slotu i startu usuwania w B2a/B1b4b musi określić granicę wysyłki oraz test tego wyścigu; B1b4a nie zamyka tego ryzyka. Nie wykonano wdrożenia.

**Ocena przed zmianą:** cel/architektura 0,95; prostota 0,88; ryzyko 0,85; utrzymywalność 0,86; minimum **0,85**.

Następny dostępny slice B2a obejmuje wspólny slot operacji dla cofania sesji i usuwania. B1b4b (delete) zależy od tego slotu. Przegląd admin nie wykazał ścieżki zapisu, która odtwarzałaby dokument użytkownika.
