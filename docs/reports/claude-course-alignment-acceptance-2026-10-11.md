# CC-03 — dwa źródła w Details

11.10.2026. Źródła i konsument wdrożone lokalnie; publikacja i synchronizacja pakietu aplikacji pozostają CC-05. Reguła pokrycia jednostek pozostaje CC-04.

## Zakres i decyzja

Wszystkie 918 kanonicznych pytań Claude mają `feedback.course`: tytuł właściwego modułu, HTTPS URL, rzeczywiste sekcje i `requiresAccount: true`. Wersjonowany `scripts/content/add-claude-course-links.mjs` odtwarza przypisania z zamrożonej mapy CC-01 oraz nowych pytań CC-02 i wykrywa drift. Test bazowego SHA po usunięciu wyłącznie pola course potwierdza zachowanie pozostałej treści 918 rekordów. Dokumentacja pochodzi z istniejącego `feedback.details.url`; nowe metadane nie zastępują uzasadnienia odpowiedzi. Cowork pozostaje osobnym niedopuszczonym suplementem, partner-only excluded.

Wspólny opcjonalny kontrakt obejmuje JSON Schema, walidator producenta i typ/walidator APP. Details pokazuje kolejno Documentation i Course module, tytuł/sekcję oraz „Requires an Anthropic Partner Academy account” (siedem języków). Praktyka i przegląd odpowiedzi egzaminu używają wspólnego renderera. Pozostałe banki zachowują dotychczasową projekcję bez pustego wiersza kursu. Deduplikacja według roli i URL zachowuje obie role także przy tym samym adresie. Walidacja odrzuca nie-HTTPS i whitespace; błąd otwarcia jest oddzielony od oceny odpowiedzi.

Niezależny design i końcowy przegląd Luna High: PASS. Ocena podejścia: fit 0,92 / simplicity 0,88 / risk 0,84 / maintainability 0,88; minimum 0,84. Jeden kontrakt i istniejący opener, bez mapowania kursu w runtime ani nowego mechanizmu logowania.

## Dowody źródłowe

- CONTENT: 46/46 testów (`claude-course-links`, CC-02, historyczny audyt, shared-contract, packageCompletionTransport), 918/918 exact mapping, validate 918 PASS. Parity schema/JS obejmuje dziewięć tracków.
- APP: końcowy niezależny zestaw 42/42 PASS; typecheck PASS. Role, kolejność, exact URL, brak kursu, błędne dane, otwieranie i błąd otwarcia, projekcje fixture practice/review, dostępność i locale parity.
- Claude build/test PASS. Kandydat `.temp/cc03-dist`: SHA `616c4c815a79b5a4d9cf8b8dcc3e7a6f6e79b2df5ca63a67a5adba7d46c76b48`. Pierwszy build w historycznym `dist` odrzucił niezgodny lock CC-02; zachowano go i zbudowano nową wersję w osobnym output root.
- Wersja źródła: `ccarp-2026.10.11-capacity-v1-bizq02-v2-bizq03-planning-v2-cc02-v1-cc03-v1`. Bundled APP pozostaje historyczny (845 pytań); fixture dodaje dwa przypisania wyłącznie w pamięci, bez zapisów historii ani prób.

## Dostęp do kursu

[Oficjalna ścieżka](https://anthropic-partners.skilljar.com/path/claude-certified-architect-professional) pokazuje Register/FREE oraz Sign In, a [Partner Academy](https://anthropic-partners.skilljar.com/) informuje o dodatkowej walidacji dostępu. Komunikat wymaga konta Partner Academy; nie obiecuje dostępu każdemu kontu. Nie sprawdzano lekcji w uwierzytelnionej sesji zwykłego użytkownika. Przejściowe 403 nie stanowią dowodu zasad dostępu. UI nie zawiera obietnicy ceny.

## Odbiór natywny

Istniejący iPhone 17, iOS 26.4, lokalny podgląd tylko do odczytu. Standardowy scenariusz dwóch modułów PASS (`.temp/cc03-native/2026-10-11_213716`). Jego zrzuty pokazują początek źródeł; pełny obszar wymaga dalszego przewinięcia. Następnie `accessibility-large`: Module 1 pełny tytuł/sekcja/konto czytelne, niezależnie potwierdzone na zrzucie `cc03-native-large/2026-10-11_213924`. Module 2: po oddzielnym przewinięciu do komunikatu konta pełny tytuł, sekcja i konto czytelne na `cc03-native-large-final/2026-10-11_214117/cc03-capture-current/takeScreenshot/cc03-module2-large-details.png`. Duży tekst zawija się i daje przewinąć do końca źródeł. Przywrócono poprzedni rozmiar `large`.

Historia prób zachowana: Fast Refresh podczas edycji zresetował pierwszy podgląd; dwa podejścia nie trafiły przycisku przy dolnej nawigacji (naprawiono centrowaniem). Pierwszy large run nie zdążył przewinąć długiej odpowiedzi w 20 s; wydłużono limit do 60 s. Kolejny large run zatrzymał się na pełnotekstowej asercji tytułu przy krawędzi, więc domknięto odbiór osobnym przewinięciem i oględzinami rzeczywistego zrzutu. Nie oznaczamy pełnego large run jako PASS. Wersjonowany scenariusz sprawdza stabilne ID linków i przewija do konta przed zrzutem; usunięto zależną od pozycji asercję tytułu, którego dokładną wartość weryfikują testy mapowania/projekcji.

Nie zmieniono kont ani danych użytkownika. Otwarcie zewnętrzne i błąd potwierdzone testami kontraktu, bez osobnego natywnego tap-to-browser ani wymuszania awarii systemowego otwierania. Uwierzytelniony dostęp do lekcji i pełny odbiór zsynchronizowanego pakietu pozostają granicą tego etapu. Source/consumer PASS, odbiór wizualny dwóch modułów i dużego tekstu potwierdzony; integracja wydania CC-05 nadal wymagana.

## Odtworzenie

CONTENT: `node scripts/content/add-claude-course-links.mjs`, następnie `node --test tests/claude-course-links.test.mjs tests/claude-cc02-content-coverage.test.mjs tests/claude-content-audit-20261007.test.mjs tests/shared-contract.test.mjs tests/packageCompletionTransport.test.mjs`. Builder: `validate`, `test`, `build --output-root .temp/cc03-dist`, każdy z `--track claude-certified-architect-professional-certification`.

APP native: `maestro test --udid 7F315654-3175-4F3C-BB24-B0263F59360C --test-output-dir .temp/cc03-native .maestro/cc03-course-details.yaml`. Test nie resetuje aplikacji. Odtwarzanie wymaga istniejącego dev client i Metro. Nie uruchamiać równolegle z edycjami źródeł powodującymi Fast Refresh.
