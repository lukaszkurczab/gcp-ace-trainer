# I18N-01 — siedem locale

## Wynik

Status odbioru technicznego: **PASS WITH ISSUES**. Niezależny `qa-gate` potwierdził spełnienie kryteriów I18N-01; jedynym zastrzeżeniem pozostaje pięć znanych awarii pełnego suite poza zakresem zadania.

Pakiet obsługuje `en`, `pl`, `de`, `fr`, `es`, `it` i `et` w ośmiu namespace'ach bez runtime fallbacku do EN/PL. Ręczny wybór i tryb systemowy korzystają z jednego typowanego kontraktu preferencji. Granice prawne i API, które świadomie pozostają `en|pl`, nie zostały rozszerzone.

## Zakres zmiany

- dodano komplet locale DE/FR/ES/IT/ET i zarejestrowano je w runtime i18n;
- rozszerzono typy, resolver locale, repozytorium ustawień i provider preferencji;
- podłączono brakujące copy w ekranach konta, celu, postępu, premium, raportów, review i dokumentów prawnych;
- dokumenty Privacy/Terms indeksują bezpośrednio siedem locale: EN/PL są kanoniczne, a jawnie niezatwierdzone drafty DE/FR/ES/IT/ET są widoczne wyłącznie poza release; release pokazuje lokalizowany stan niedostępności bez fallbacku;
- wzmocniono parity/interpolation/plural checks oraz testy trwałości preferencji;
- poprawiono findingi pięciu niezależnych review językowych i wykonano re-review do PASS.

## Evidence

- `npm run typecheck`: PASS.
- Testy celowane locale/preferencji/legal: 58/58 PASS.
- Szerszy pakiet celowany: 59/59 PASS.
- `npm test`: 1289 PASS, 5 FAIL (1294 testy po dodaniu mapy dokumentów). Wszystkie pięć awarii to wcześniej zidentyfikowane, niezależne bramki: dwa historycznie nieaktualne testy PROFILE/powłoki oraz trzy bramki cross-repo wymagające zgodnego SHA/env contentu. Nie są raportowane jako PASS.
- Maestro, istniejący iPhone 17: wszystkie siedem locale przełączone kolejno; nagłówki docelowe widoczne, brak `language-save-error`.
- Tryb `system` przy polskim locale urządzenia wyświetlił polski interfejs. Opis opcji systemowej celowo pozostaje w języku urządzenia, zgodnie z testowanym kontraktem `deviceLocale`.
- Ręcznie wybrane ET przetrwało terminate/launch; po ponownym otwarciu ekranu `language-option-et` miało `selected: true`.
- Screenshoty DE/FR/ES/IT/ET/PL/EN i system-PL sprawdzono wizualnie na 402×874; nie stwierdzono clippingu aktywnej treści. Do czasu końcowego QA są dostępne w `/tmp/patternly-i18n/2026-09-27_002658/I18N-01 seven-locale runtime/takeScreenshot/`; pozostają tymczasowe i nie zastępują dowodu zachowania.
- Po początkowym `FAIL` niezależnego QA usunięto fallback treści Privacy/Terms do EN. Test mapy dokumentów ma 3/3 PASS, pięć języków przeszło świeży re-review, a Maestro wyrenderowało niemiecki dokument (`Datenschutzerklärung von Patternly`) z jawnymi placeholderami `UNAPPROVED TEST ONLY`; screenshot jest w najnowszym przebiegu `/tmp/patternly-i18n-legal/`.
- Końcowy niezależny QA (`gpt-6-luna high`) zweryfikował także resolver w trybie release dla obu dokumentów i pięciu nowych locale: `content: null`, status `unavailable-unapproved`, bez fallbacku do EN.

## Środowisko

- Jedyny użyty symulator: istniejący iPhone 17 (`7F315654-3175-4F3C-BB24-B0263F59360C`).
- Bundle: `com.lkurczab.patternly`; ta sama instalacja została odtworzona po oczyszczeniu uszkodzonego stanu lokalnego.
- Backend: `127.0.0.1:8080`; Firebase Auth: `19099`; Firestore: `18081`; Metro/Expo: `127.0.0.1:8081`.
- Aplikacja komunikowała się z lokalnym backendem, a onboarding profilu gościa zakończył się poprawnie.

## Ograniczenia

Nazwany stash wejściowy `I18N-01 partial seven-locale runtime 2026-09-26` pozostaje zachowany do czasu zakończenia i wypchnięcia zadania; nie jest źródłem runtime po commicie. Pełny `npm test` nie jest zielony z przyczyn wymienionych wyżej, dlatego niezależny QA musi ocenić, czy dowód celowany wystarcza do zamknięcia I18N-01.
