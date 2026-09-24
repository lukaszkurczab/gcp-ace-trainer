# AUD-08/B1b2b3 — sprawy konsumenckie i zgłoszenia treści

**Data:** 24.09.2026  
**Backend:** `patternly-backend/main` `b917b0a`; lokalnie, bez wdrożenia  
**Odbiór:** niezależne QA `PASS WITH ISSUES`.

Sprawa konsumencka z uwierzytelnionym kontem powstaje po sprawdzeniu aktywnego stanu i oczekiwanej generacji w tej samej transakcji. Obejmuje to trasę konta oraz publiczną trasę z dostarczonym poprawnym tokenem. Wysłanie e-maila następuje dopiero po zatwierdzeniu sprawy. Dla zgłoszenia treści kontrola generacji następuje przed sprawdzeniem duplikatu, limitu i zapisem w istniejącej transakcji, także gdy użytkownik podał token, lecz wybrał niełączenie raportu z kontem. Bez tokenu zachowana jest ścieżka Gościa; nieaktualny token nie przechodzi na nią. Konflikt zwraca `409`, nieaktywne konto `401`.

Wykonawca potwierdził typecheck, lint, OpenAPI 57 operacji, `git diff --check` i 7/7 skupionych testów na osobnym emulatorze `19100/18082`. Test runner zakończył się kodem 0; wrapper Firebase zgłaszał błąd podczas sprzątania po zaliczonych testach. Emulator zatrzymano, wspólnego nie czyszczono. Testy sprawdzają obrót po guardzie: brak sprawy, raportu, zmiany limitu i e-maila, także przy ponowieniu duplikatu; udana ścieżka Gościa nadal działa. Niezależne QA uruchomiło typecheck, lint, OpenAPI i diff check oraz przejrzało granice transakcji.

**Luka dowodowa QA:** test wymusza rotację po guardzie przed wejściem do magazynu, lecz nie po odczycie dokumentu przez transakcję. Kod czyta konto i tworzy zapis w jednej transakcji Firestore; tego konkretnego przeplotu nie wykonano niezależnie. Nie wykonano testu urządzeniowego ani wdrożenia.

**Ocena przed zmianą:** cel/architektura 0,91; prostota 0,84; ryzyko 0,82; utrzymywalność 0,86; minimum **0,82**. Implementacja została oceniona przez wykonawcę na minimum 0,87.

Następny slice B1b2b4 obejmuje eksport danych: transakcyjny audyt i limit oraz ponowną kontrolę generacji przed zwróceniem odpowiedzi. `session/revoke` pozostaje do wspólnego slotu operacji z B2.
