# AUD-08/B1b3d1 — sync podczas promocji transferu

**Data:** 24.09.2026  
**Backend:** `patternly-backend/main` `9bb025a`; lokalnie, bez wdrożenia  
**Odbiór:** niezależne QA `PASS`.

Zwykły sync sprawdza w swojej transakcji, po weryfikacji konta i generacji uprawnień, czy trwa aktywna rezerwacja promocji transferu. Przy aktywnym lease odrzuca zarówno nową partię, jak i replay istniejącej partii przed jakimkolwiek zapisem. API zwraca i loguje `409 progress_generation_conflict`. Generacja uprawnień pozostaje odrębna od generacji postępu.

Wykonawca i niezależne QA uruchomili lokalny fixture emulatorowy: **4/4**. Test obejmuje lease innej i tej samej sesji, brak zmian w rekordach, mutacjach, batchach i rewizji po odmowie, powodzenie po usunięciu lease oraz replay zapisanego batcha: `409` podczas lease i pierwotne `200` po jego zdjęciu bez duplikatów. Typecheck, lint, OpenAPI 57 operacji i `git diff --check` przeszły. Test nie czyścił współdzielonej bazy. Nie wykonano wdrożenia ani testu urządzeniowego.

**Ocena przed zmianą:** cel/architektura 0,94; prostota 0,91; ryzyko 0,86; utrzymywalność 0,90; minimum **0,86**.

B1b3d2 musi zabezpieczyć apply: atomowy zapis docelowej partii z kursorem, kontrolę generacji uprawnień i przypiętej rewizji/generacji postępu w każdej transakcji, wygaśnięcie lease oraz końcową promocję. Wyścig jednoczesnego startu lease i syncu pozostaje testem D2. Sama blokada D1 nie oznacza ukończenia transferu.
