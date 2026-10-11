# Claude Professional — celowany zakres 37 P1 + 1 P2

Właściciel autoryzował wykonanie i publikację teraz, przed iOS (11.10.2026). Wyjątek dotyczy wyłącznie tego zakresu; Q13 i cudze zmiany pozostają poza nim. Bieżący status: **P2 opublikowane na CONTENT master i APP main; niezależne QA, admission, release gate oraz hosted CI PASS**.

Źródło CONTENT w preflight `0f4e6912d7d0cdb1a1c41b9d7885d7e867f80f34` ma identyczne osiem plików Claude jak wskazany w załączniku SHA `2aae062abf997ca148ee15a391c32bbde34f6d7f`. Wszystkie 37 obecnych kluczy są semantycznie poprawne: raport przypisał poprawnym tekstom litery pozycji zamiast ich faktycznych stable `optionId`. Dlatego tych kluczy nie zmieniono; proponowane w raporcie ID są distractorami. Początkowa deklaracja „37 odtworzonych błędów” opierała się na tym błędnym mapowaniu i została wycofana.

Niezależny reviewer gpt-6-luna high najpierw otrzymał prompt, opcje i constraints bez kluczy/Reason/feedbacku i zapisał wybór dla wszystkich 38 pytań. Następnie potwierdził zgodność kluczy, Reason/Details i wszystkich distractorów. Wynik 38/38; potrzebna jest wyłącznie korekta P2. Rzeczywisty scorer i projekcja feedbacku aplikacji: 3648/3648 kombinacji (38 pytań × 24 kolejności × 4 odpowiedzi) PASS. To nie jest odbiór semantyczny całych 845 pytań.

P2 `CCARP-D02-O04-expansion-14`: zmieniono tylko tekst opcji `a`, Reason i `Details.boundaryOrTradeoff`, zachowując wszystkie ID i klucz. Zapisano zakaz cichego usunięcia obowiązkowego kontekstu, zachowanie rezerwy, recount oraz jawny capacity failure lub zatwierdzoną alternatywę. Pozostałe 844 pytania bez zmian. Source commit `63b1f8a388d72cd620026d3a3cc24ee059c6a39b`. Nowa wersja `ccarp-2026.10.11-capacity-v1-bizq02-v2-bizq03-planning-v2`; current bank SHA-256 `73f561c4d64a272f8b6f055a321414303620c54dba7dfb4d0283d75ea74bfe6d`. Stary hash845 jest odtwarzany w teście przez cofnięcie wyłącznie trzech pól P2; frozen300 i historyczne approvals zachowane.

[Dowody źródłowe, pełne before→after, pointery i hashe](https://github.com/lukaszkurczab/patternly-content/blob/7ea9da23aa3aba6d84f6a1c0a5bb01fdba489a59/docs/evidence/content-audits/2026-10-11-claude-targeted-repairs.md) wiążą source commit i kandydat w izolowanej gałęzi CONTENT `fix/claude-targeted-20261011`. Główne checkouty pozostają przy pracy innych właścicieli. `content:validate` 845, `content:test` 845, audit test12/12, track build i `verify:migration` PASS. Pełne npm test: 224/229; po aktualizacji wymaganych current provenance/version pins oba dotknięte pliki PASS 42/42. Candidate regression PASS 13/13. APP tooling PASS 53/53, references/presentation PASS 24/24, typecheck i content boundary PASS, faktyczny bundle matrix PASS 3648/3648. Synchronizacja i lock check PASS. APP oracle/runtime/catalog/presentation: 26/26; runtime-admission test po zakończeniu zapisu locka PASS 1/1 (wcześniejszy odczyt starego locka przy równoległym uruchomieniu jest zapisany w evidence). Niezależne końcowe QA PASS (9/9 actual canonical/runtime); candidate admission v3 i release gate PASS. Kandydat `d6e2f2f202790bec0d14614c855e87a5a7e40ddb1bfe7ca5346a1bbbd3b78b09` wiąże APP implementation/bundle commit `9d6e664ef3814a22c431af4f917f2191f2938bb0`. Granica: `local_verified_artifacts_no_deployment`. Publikacja Git odbywa się po tych bramkach; hosted CI i App Store nie są zastępowane lokalnym PASS. Runtime capacity simulation i VoiceOver NOT RUN — nie zmieniano gateway ani renderera.

Pierwsze hosted CI ujawniło dwa nieaktualne fixture’y CONTENT i trzy APP, zakładające, że bieżące admission nadal jest historyczne. Testy odrzucenia korzystają teraz z zamrożonych historycznych dowodów. Eksporter demo wymagał ponadto małej korekty: weryfikuje aktualne receipts względem surowej tożsamości pakietu v2, zamiast projekcji treningowej v1; kontrola rodziny, źródła, Free pool i historyczny eksport pozostają. Nie zapisano ani nie opublikowano demo WEB. Ocena korekty: objective/architecture fit 0.90, simplicity 0.90, risk 0.85, maintainability 0.90; minimum 0.85. Powód: istniejący konsument musi czytać tę samą tożsamość co zatwierdzony lock, przy zachowaniu wszystkich bramek. Końcowe niezależne QA: PASS (gpt-6-luna high); reviewer sam uruchomił eksport test 5/5. Dotknięte testy: exporter 5/5, release gate 2/2, release manifest 1/1; recovery/content/privacy boundaries i diff-check PASS. Hosted CI zakończone: CONTENT 229/229, APP 2312 passed / 0 failed / 4 skipped; multi-track 3/3. [CONTENT architecture](https://github.com/lukaszkurczab/patternly-content/actions/runs/38155658678), [CONTENT release gate](https://github.com/lukaszkurczab/patternly-content/actions/runs/38155678064), [APP QA](https://github.com/lukaszkurczab/gcp-ace-trainer/actions/runs/38156278420). Zweryfikowane SHA: CONTENT `cac1836e9094c115e3ad104cd42ac8059b9c051a`, APP `3143bf494f56d3f3dd62cab626c9fccd46d7e969`. Końcowe commity dokumentacyjne nie zmieniają zweryfikowanego kodu, danych, zależności ani konfiguracji; dowody pozostają właściwe. Dowody admission dla APP `9d6e664e` pozostają właściwe: późniejsze zmiany dotyczą dokumentacji, fixture’ów i eksportera CLI, bez zmiany przyjętego bundle’a, runtime ani locków.

## Rozstrzygnięte exact IDs

| questionId | Poprawny stable ID przed→po | Proponowany w raporcie distractor | Decyzja |
|---|---|---|---|
| `CCARP-D01-O02-expansion-01` | `a→a` | `b` | P1: poprawny klucz zachowany |
| `CCARP-D01-O02-expansion-02` | `c→c` | `a` | P1: poprawny klucz zachowany |
| `CCARP-D01-O02-expansion-04` | `b→b` | `c` | P1: poprawny klucz zachowany |
| `CCARP-D01-O02-expansion-05` | `d→d` | `b` | P1: poprawny klucz zachowany |
| `CCARP-D01-O02-expansion-06` | `b→b` | `a` | P1: poprawny klucz zachowany |
| `CCARP-D01-O02-expansion-07` | `b→b` | `d` | P1: poprawny klucz zachowany |
| `CCARP-D01-O04-expansion-03` | `c→c` | `d` | P1: poprawny klucz zachowany |
| `CCARP-D01-O04-expansion-04` | `b→b` | `c` | P1: poprawny klucz zachowany |
| `CCARP-D01-O04-expansion-06` | `b→b` | `a` | P1: poprawny klucz zachowany |
| `CCARP-D01-O04-expansion-08` | `b→b` | `c` | P1: poprawny klucz zachowany |
| `CCARP-D01-O04-expansion-09` | `b→b` | `d` | P1: poprawny klucz zachowany |
| `CCARP-D01-O04-expansion-10` | `b→b` | `a` | P1: poprawny klucz zachowany |
| `CCARP-D01-O04-expansion-12` | `b→b` | `c` | P1: poprawny klucz zachowany |
| `CCARP-D01-O04-expansion-13` | `b→b` | `d` | P1: poprawny klucz zachowany |
| `CCARP-D01-O04-expansion-14` | `b→b` | `a` | P1: poprawny klucz zachowany |
| `CCARP-D02-O01-expansion-02` | `c→c` | `a` | P1: poprawny klucz zachowany |
| `CCARP-D02-O01-expansion-03` | `b→b` | `d` | P1: poprawny klucz zachowany |
| `CCARP-D02-O01-expansion-04` | `b→b` | `d` | P1: poprawny klucz zachowany |
| `CCARP-D01-O03-expansion-01` | `d→d` | `b` | P1: poprawny klucz zachowany |
| `CCARP-D01-O03-expansion-02` | `c→c` | `a` | P1: poprawny klucz zachowany |
| `CCARP-D01-O03-expansion-03` | `b→b` | `d` | P1: poprawny klucz zachowany |
| `CCARP-D01-O03-expansion-05` | `c→c` | `b` | P1: poprawny klucz zachowany |
| `CCARP-D01-O03-expansion-07` | `a→a` | `d` | P1: poprawny klucz zachowany |
| `CCARP-D01-O06-expansion-01` | `a→a` | `b` | P1: poprawny klucz zachowany |
| `CCARP-D01-O06-expansion-02` | `b→b` | `a` | P1: poprawny klucz zachowany |
| `CCARP-D01-O06-expansion-03` | `b→b` | `d` | P1: poprawny klucz zachowany |
| `CCARP-D01-O06-expansion-04` | `b→b` | `c` | P1: poprawny klucz zachowany |
| `CCARP-D01-O06-expansion-06` | `b→b` | `a` | P1: poprawny klucz zachowany |
| `CCARP-D01-O05-expansion-01` | `a→a` | `b` | P1: poprawny klucz zachowany |
| `CCARP-D01-O05-expansion-02` | `b→b` | `a` | P1: poprawny klucz zachowany |
| `CCARP-D01-O05-expansion-03` | `b→b` | `d` | P1: poprawny klucz zachowany |
| `CCARP-D01-O05-expansion-04` | `b→b` | `c` | P1: poprawny klucz zachowany |
| `CCARP-D01-O05-expansion-06` | `b→b` | `c` | P1: poprawny klucz zachowany |
| `CCARP-D01-O01-expansion-01` | `a→a` | `b` | P1: poprawny klucz zachowany |
| `CCARP-D01-O01-expansion-02` | `b→b` | `a` | P1: poprawny klucz zachowany |
| `CCARP-D01-O01-expansion-04` | `b→b` | `c` | P1: poprawny klucz zachowany |
| `CCARP-D01-O01-expansion-06` | `b→b` | `c` | P1: poprawny klucz zachowany |
| `CCARP-D02-O04-expansion-14` | `a→a` | — | P2: trzy pola treści |
