# ODK-116/A2 — mapa publicznych danych i kontrakt wykonania

**Data:** 24.09.2026  
**Status:** diagnoza i kontrakt wykonania; implementacja A2–A4 otwarta.

## Aktualne źródła i konsumenci

| Repo / HEAD przy diagnozie | Rola i obecny kontrakt | Rozbieżność |
| --- | --- | --- |
| `patternly` / `460a5b16` | `src/legal/legalVariables.ts` dostarcza wartości do `privacyPolicy.ts`, `termsOfService.ts` i techniczny produkt do zakupów. `publicEnvironment.ts` waliduje osobny rekord publicznych URL, a `app.config.js` sprawdza tylko JSON i nazwę środowiska. | 39 wierszy zmiennych prawnych ma jawne placeholdery; brak walidacji gotowości danych przed wydaniem. Dwa źródła publicznych faktów są rozdzielone bez wspólnego identyfikatora wersji. |
| `patternly-web` / `2cfc614` | `PublicPage.jsx` ma na sztywno nazwę sprzedawcy; stopka nie udostępnia Privacy/Terms/Support. Strona jest marketingowa, bez intake danych prawnych. | Nie ma kontraktu wartości z aplikacji ani dowodu poprawnych publicznych linków. |
| `patternly-backend` / `0ea62f7` | `environment.ts` waliduje SMTP, operatora administracyjnego i sekrety usług. | Nie ma konsumenta publicznego rekordu operatora. SMTP i sekrety nie mogą zostać źródłem danych publikowanych. |

Aktywne aplikacyjne locale to `en` i `pl` (`src/locales`, szablony prawne). Cel siedmiu locale w planie należy do ODK-117; nie można deklarować jego spełnienia na podstawie obecnych plików. Istniejące ID produktu ma konsumenta zakupowego i pozostaje technicznym identyfikatorem, oddzielnym od danych osoby lub firmy.

## Granica i kolejność zmian

1. **A2 — producent w app:** jedna typowana schema publicznych faktów operatora, kontaktów, wersji szablonów i URL. Zdefiniować jawny profil testowy oraz tryb wydania; testowy profil może uruchamiać lokalne flow, ale produkcyjny preflight odmawia braków i placeholderów. Sekrety i dane uwierzytelniające nie są częścią rekordu. Zachować kompatybilność z szablonami i produktowym ID do czasu przełączenia konsumentów.
2. **A3 — konsumenci i release w app:** szablony Privacy/Terms oraz UI pobierają te same wartości; walidacja wydania sprawdza pełny rekord i wersję/fingerprint. Dowód obejmuje render obu obecnych locale, brak fikcyjnych danych w wydaniu, działający lokalny bootstrap i brak zmiany semantyki zakupowego ID.
3. **A4 — web:** jawny, wersjonowany eksport publicznego rekordu z app jako artefakt wejściowy buildu web; web sprawdza schema/fingerprint, usuwa hardcode sprzedawcy i używa zatwierdzonych URL. Nie dodawać serwerowego źródła tych samych faktów bez konsumenta. Działanie web przy braku artefaktu ma być jawnie niedostępne, a nie fikcyjnie uzupełnione.
4. **ODK-116-B:** dopiero prawdziwe wartości PO i rzeczywiste identyfikatory platform przechodzą preflight wydania. Osobno ODK-117 dodaje pozostałe locale.

**Kolejność implementacji i merge:** app A2 → app A3 → web A4. **Kolejność wdrożenia:** bez publikacji testowych wartości; po rzeczywistym ODK-116-B najpierw zweryfikowany rekord i web, następnie build aplikacji wskazujący zatwierdzone adresy. **Wycofanie:** przed publikacją można wrócić do poprzedniego buildu; po publikacji wersję/fingerprint należy zachować w dowodzie wydania, a zmianę danych rozliczyć nową rewizją i testem wpływu. Nie nadpisywać już zaakceptowanej wersji dokumentów.

**Weryfikacja systemowa:** test producenta generuje rekord i fingerprint; web konsumuje dokładnie ten artefakt i odrzuca niezgodną wersję; app i web pokazują te same wartości/odnośniki. Same zielone testy w dwóch repozytoriach nie wystarczą bez tego połączenia.

**Ocena przed implementacją:** zgodność 0,90; prostota 0,82; kontrola ryzyka 0,83; utrzymywalność 0,84; minimum **0,82**. Główne ryzyko: teksty prawne zawierają wiele pól opisowych, których nazwy i zakres muszą być ustalone z rzeczywistych szablonów; A2 zaczyna od ich inwentaryzacji, bez wymyślania wartości wydawcy.
