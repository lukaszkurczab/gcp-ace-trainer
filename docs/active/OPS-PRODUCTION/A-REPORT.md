# OPS-PRODUCTION/A — kontrakt kanału obsługi spraw

**Status:** `done / independent QA PASS`  
**Zakres:** kontrakt i pakiet implementacyjny; lokalnie, bez wdrożenia i bez dostępu do danych produkcyjnych.  
**Baza dowodowa:** `patternly` `cf4ad2fa`, `patternly-backend` `3c759555`, `patternly-web` `12c9557c`.

## Wynik

Repozytoria nie zawierają bezpiecznego kanału obsługi rzeczywistych spraw w środowisku produkcyjnym. Istniejące `/admin` i endpointy administracyjne są celowo lokalne: web działa tylko na loopback/emulatorach i nie trafia do publicznego `dist`, a backend zwraca `admin_unavailable` w `production`. Nie wolno uznać tego panelu za kanał produkcyjny ani otwierać go publicznie.

Slice B jest wymagany. Ma dostarczyć lokalne narzędzie operatorskie wywołujące wyłącznie allowlistowane endpointy HTTPS backendu. Nie powstaje hosted admin, bezpośredni dostęp operatorski do Firestore ani drugi zestaw state machines.

## Walidacja podejścia przed zapisem

Niezależny briefing Luna High został powtórzony po wykryciu nieudowodnionego założenia o idempotencji. Zatwierdzony wariant otrzymał: spójność z celem i architekturą `0,92`, prostota `0,86`, kontrola ryzyka `0,90`, utrzymywalność `0,84`; minimum `0,84` (`APPROVE`).

## Granice i właściciel

- Właściciel kanału: allowlistowany operator produktu. Rola nie zastępuje konkretnej osoby ani formalnego upoważnienia.
- Eskalacje: privacy/legal → osoba odpowiedzialna za legal/DPO; security incident → security/DPO; content report → właściciel contentu.
- A/B używają wyłącznie lokalnych danych syntetycznych. Docelowy URL HTTPS może zostać skonfigurowany w B, ale rzeczywisty kontrolowany dowód należy do C przed `GO`.
- Tożsamość operatora: krótko żyjący token Google/OIDC, z dokładnym issuerem, audience i subject. Backend mapuje subject na rolę i jawny zbiór akcji. Brak mapowania, zły issuer/audience lub niedozwolona akcja kończy się fail-closed.
- Narzędzie nie zapisuje tokenów ani treści spraw w repozytorium, historii poleceń lub własnych logach. Audyt backendu przechowuje pseudonim operatora, identyfikator sprawy, akcję, rewizję, wynik i czas — bez payloadu sprawy.

## Macierz istniejącego pokrycia

| Rodzina | Intake i status użytkownika | Istniejąca kolejka/akcje | Aktualny guard i audyt | Luka do B |
|---|---|---|---|---|
| Content reports | Mobilny intake zwraca trwałe przyjęcie; brak obietnicy indywidualnej odpowiedzi. | Lista oraz `open → in_review → resolved → closed`. | Lokalny admin; audyt zmiany statusu, ale brak revision guard i ogólnego command-result store. | Produkcyjny read/detail/transition, allowlista oraz `expectedStatus` sprawdzany transakcyjnie. |
| Privacy requests | Account/public intake, weryfikacja publiczna, odczyt odpowiedzi i statusu. | Weryfikacja, review, export, extension, przygotowanie/dostarczenie odpowiedzi, close. | `expectedRevision`, pseudonimizowany audyt; wysyłka ma własne stany dostarczenia. | Produkcyjny read/action, per-action authorization i bezpieczny reconciliation dla wysyłek. |
| Legal requests | Account/public intake; użytkownik może odczytać własną sprawę/odpowiedź. | Review, answer, close, legal hold. | `expectedRevision`, pseudonimizowany audyt; odpowiedź e-mail ma stan dostarczenia. | Produkcyjny read/action i jawne rozstrzyganie niepewnego wyniku wysyłki. |
| Security incidents | To nie jest intake użytkownika; operator rejestruje incydent. | Klasyfikacja, decyzje, eksport/zgłoszenie organowi, powiadomienia osób, hold, close. | `expectedRevision`, pseudonimizowany audyt; `pending/failed/unknown` i reconciliation dla powiadomień. | Produkcyjny create/read/action z najbardziej ograniczoną rolą i zachowaniem istniejącego reconciliation. |

Wynik repozytoryjnego `needs evidence`: w odczytanych źródłach nie ma kanału produkcyjnego, więc B jest `planned` i wymagane do `SIM-READY`. Nie jest to twierdzenie o nieudokumentowanej infrastrukturze poza repozytoriami. Stan funkcji domenowych: `partial` — state machines są zaimplementowane, lecz osiągalne operatorsko tylko lokalnie.

## Kontrakt retry i niepewnej odpowiedzi

Repo nie ma ogólnego trwałego `commandId` ani magazynu wyniku komendy dla tych czterech rodzin. `commandId` w CLI może służyć tylko jako lokalny identyfikator korelacyjny; nie wolno obiecywać replay zapisanej odpowiedzi.

1. Privacy, legal i security wysyłają `expectedRevision`. Po odpowiedzi niepewnej CLI nie ponawia mutacji automatycznie: odczytuje detail i sprawdza postcondition konkretnej akcji.
2. Jeśli postcondition jest jednoznaczny, CLI raportuje wynik odczytu. Ponowienie ze starą rewizją musi zakończyć się konfliktem, po którym następuje ponowny odczyt.
3. Content report otrzymuje w B `expectedStatus`; backend sprawdza go w tej samej transakcji co zmiana. Po odpowiedzi niepewnej detail rozstrzyga aktualny status.
4. Jeśli stan nie rozstrzyga, akcja zawiera payload niewidoczny w bezpiecznym detail albo uruchamia efekt zewnętrzny, wynik brzmi `AMBIGUOUS / RECONCILIATION REQUIRED`. Automatyczny retry jest zabroniony.
5. Istniejące stany `pending`, `failed`, `unknown` i akcje reconciliation pozostają kanoniczne wyłącznie tam, gdzie rzeczywiście występują. Nie wolno uogólniać mechanizmu security notifications na privacy extension lub legal answer.

## Postcondition per akcja

| Rodzina/akcja | Jednoznaczny odczyt po niepewnej odpowiedzi |
|---|---|
| Content transition | `status == requestedStatus`; inny status po zmianie przez kolejnego operatora → `AMBIGUOUS`, nie retry. |
| Privacy `require_verification`, `verify_subject`, `start_review`, `execute_export`, `prepare_response`, `close` | Oczekiwany status/pola domenowe oraz rewizja większa od wysłanej. Dla export/response wymagany jest bezpieczny znacznik wykonania, nie treść payloadu. |
| Privacy `extend` | `extendedAt` i nowy deadline rozstrzygają zmianę stanu. Powiadomienie e-mail jest osobnym skutkiem; brak dowodu `delivered` po niepewnej odpowiedzi → `AMBIGUOUS`, bez automatycznego retry. |
| Privacy `retry_extension_notice` | Obecny store ustawia `pending` bez podniesienia rewizji i może dopuścić równoległe wysyłki. Do czasu dodania w B bezpiecznego fence/delivery-attempt contract akcja nie jest dostępna w CLI; niepewny wynik → `AMBIGUOUS`. |
| Privacy `deliver` | Status odpowiedzi rozstrzyga tylko stan domenowy. Dla publicznej wysyłki obowiązuje jej rzeczywisty delivery state; `pending/failed` bez jednoznacznego dowodu nie zezwala na automatyczny retry. |
| Legal `start_review`, `close`, `set_legal_hold` | Status lub flaga hold i rewizja większa od wysłanej. |
| Legal `answer` | Obecny store nie wystawia delivery statusu ani akcji reconciliation, a błąd wysyłki zapisuje jako `failed` i usuwa pending response. Sama wyższa rewizja nie dowodzi wysłania. B musi dodać bezpiecznie ogrodzony delivery-attempt/reconciliation contract albo pozostawić akcję niedostępną w CLI; niepewny wynik → `AMBIGUOUS`, bez retry. |
| Security — akcje czysto stanowe | Odpowiednia classification/decision/hold/closed/assessment version i wyższa rewizja. |
| Security — eksport/zgłoszenie/powiadomienie | Bezpieczny artifact/delivery status. `pending/unknown` → istniejący reconciliation; brak automatycznego ponowienia efektu zewnętrznego. |

Każdy endpoint B musi mieć test dla sukcesu, odmowy roli, konfliktu, utraconej odpowiedzi i właściwego postcondition. Akcja bez jawnego, testowalnego postcondition pozostaje niedostępna w CLI.

## Pakiety implementacyjne B

### B1 — tożsamość i autoryzacja operatora

**Cel:** osobny production-operator security profile bez osłabienia lokalnego admina.  
**Zakres:** verifier dokładnego issuer/audience/subject, konfigurowalna allowlista subject → role/actions, fail-closed startup/config validation i negatywne testy.  
**Poza zakresem:** hosted UI, Firebase user-email allowlist, tokeny długowieczne, dane produkcyjne.  
**Akceptacja:** każda dozwolona akcja ma minimalną rolę; obcy subject, issuer, audience, środowisko i akcja są odrzucane; logi nie zawierają tokenu ani payloadu.

### B2 — endpointy operatorskie

**Cel:** bezpiecznie wystawić istniejące store’y, bez kopiowania state machines.  
**Zakres:** allowlistowane list/detail/action dla czterech rodzin; content `expectedStatus`; istniejące `expectedRevision`; ograniczone projekcje odpowiedzi; pseudonimizowany audyt; minimalny fence i reconciliation dla privacy extension/legal answer albo jawne wyłączenie tych akcji z CLI.  
**Poza zakresem:** bezpośredni Firestore, nowe workflow prawne, automatyczne decyzje merytoryczne.  
**Akceptacja:** kontrakty OpenAPI, per-action role checks, revision/status conflicts, brak danych wrażliwych w listach/audycie i testy emulatorowe wszystkich postconditions.

### B3 — lokalne CLI

**Cel:** jedna kanoniczna ścieżka operatora bez publicznego panelu.  
**Zakres:** jawny environment/base URL, pobranie krótkiego tokenu bez utrwalania, list/detail/action, potwierdzenie destrukcyjnych lub zewnętrznych skutków, lokalny correlation ID i bezpieczny output.  
**Poza zakresem:** przechowywanie sekretów, automatyczne retry mutacji, ogólny command-result store.  
**Akceptacja:** CLI odmawia HTTP/non-allowlisted host, wymaga oczekiwanej rewizji/statusu, po timeout wykonuje read-after-uncertain i drukuje rozstrzygnięty wynik albo `AMBIGUOUS / RECONCILIATION REQUIRED`.

### B4 — syntetyczny odbiór lokalny

**Cel:** potwierdzić całą ścieżkę przed `SIM-READY`.  
**Zakres:** syntetyczny intake → autoryzowana lista/detail/akcja → właściwy dla rodziny wynik → audyt; odmowa nieuprawnionego operatora; konflikt i utracona odpowiedź dla każdej rodziny. Dla content report wynikiem użytkownika jest wyłącznie widoczne w aplikacji potwierdzenie trwałego przyjęcia; dalszy status i audyt są dowodem operatorskim, bez obietnicy indywidualnej odpowiedzi. Privacy/legal mają pokazać użytkownikowi tylko istniejący kontrakt statusu/odpowiedzi. Security incident nie ma intake użytkownika.  
**Akceptacja:** powtarzalne testy na emulatorach, widoczne w aplikacji potwierdzenie intake content report, właściwe statusy/odpowiedzi privacy i legal, zero sekretów/danych logowania w artefaktach, niezależne QA i raport. Produkcyjny dostęp nie jest zaliczany.

## Slice C przed GO

C używa kontrolowanych danych w docelowym środowisku i zatwierdzonej roli. Dowód musi wskazać dokładny endpoint/environment, tożsamość artefaktu backendu, odmowę przekroczenia uprawnień, jeden pełny dozwolony flow i audyt bez sekretów. Bez tego OPS-PRODUCTION pozostaje niegotowe do `GO`, nawet jeśli A/B przeszły lokalnie.

## Weryfikacja A

- porównano runtime guard backendu, OpenAPI i kontrakty/store’y czterech rodzin;
- porównano lokalny panel web, wykluczenie `/admin` z publicznego builda oraz instrukcje operacyjne/deploy;
- sprawdzono brak ogólnego command-result store i rozdzielono revision/status guard od idempotentnego replay;
- nie zmieniono kodu wykonawczego, konfiguracji środowiska ani stanu zewnętrznego.

Niezależne QA początkowo wydało `FAIL`, ponieważ pierwsza wersja uogólniała reconciliation z security na privacy/legal i nie definiowała wyniku widocznego dla zgłaszającego content report. Po korekcie kontraktu ponowne QA wydało `PASS`; testów wykonawczych nie uruchamiano, ponieważ A zmienia wyłącznie dokumentację.
