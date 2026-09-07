# ODK-E2E-077 — discovery i projekt minimalnego DSAR lifecycle

Status: `APPROVED`

Akceptacja product ownera: 2026-09-06. Zatwierdzono hybrydowe doręczenie (aplikacja dla konta, bezpieczny link dla gościa), użycie istniejącego panelu operatora oraz retencję odpowiedzi 30 dni i minimalnego pseudonimowego dowodu 3 lata.

## Cel

Zapewnić jeden spójny cykl obsługi praw osoby, której dane dotyczą: przyjęcie żądania, proporcjonalną weryfikację tożsamości, ocenę, realizację albo uzasadnioną odmowę, przedłużenie terminu, bezpieczną odpowiedź, zamknięcie i audyt. Zakres obejmuje dostęp, sprostowanie, usunięcie, ograniczenie, sprzeciw, przenoszenie oraz wycofanie zgody.

## Ustalenia

- RODO nie wymaga osobnego formularza dla każdego prawa ani określonego kanału, ale wymaga ułatwienia ich wykonywania, przejrzystej komunikacji i odpowiedzi co do zasady w miesiąc.
- Przedłużenie o maksymalnie dwa dalsze miesiące wymaga powiadomienia w pierwszym miesiącu wraz z przyczyną.
- Dodatkowe dane do potwierdzenia tożsamości wolno żądać tylko przy uzasadnionych wątpliwościach i w zakresie koniecznym.
- Jeśli Patternly nie potrafi zidentyfikować gościa, nie powinno tworzyć dodatkowych danych wyłącznie po to, aby móc go zidentyfikować. Gość musi jednak móc dobrowolnie dostarczyć informacje pozwalające odszukać jego dane.
- Odmowa lub brak działania wymaga uzasadnienia oraz informacji o skardze do organu nadzorczego i środku sądowym.
- Żądania są zasadniczo bezpłatne. Opłata albo odmowa z powodu oczywistej bezzasadności lub nadmierności wymaga wykazania tej przesłanki przez administratora.
- Eksport ODK068 obejmuje kopię danych, ale pełna odpowiedź z art. 15 musi zawierać także informacje o celach, kategoriach, odbiorcach, retencji, źródle, prawach, skardze, transferach i ewentualnym zautomatyzowanym podejmowaniu decyzji.
- Istniejący backend ma uwierzytelniony eksport, usuwanie konta, publiczne potwierdzanie posiadania adresu email, audyt i pojedynczą rolę administratora. Nie ma wspólnego rejestru spraw, terminów, decyzji ani bezpiecznego doręczania odpowiedzi.
- Nie każde żądanie można wykonać automatycznie. Sprostowanie, ograniczenie, sprzeciw i odmowa mogą wymagać oceny operatora oraz udokumentowania podstawy.

## Podejście

### Jeden model sprawy

Jeden rekord `privacyRequest` z typem prawa i historią niezmiennych zdarzeń. Rekord przechowuje minimalny zestaw danych: identyfikator sprawy, kanał, powiązanie z kontem albo pseudonim zgłaszającego, zakres żądania, status, termin, przyczynę przedłużenia/odmowy, referencję do odpowiedzi oraz czasy. Treść odpowiedzi nie trafia do logów.

Statusy są ograniczone do: `received`, `identity_verification_required`, `in_review`, `response_ready`, `fulfilled`, `partially_fulfilled`, `refused`, `closed`. Przedłużenie jest zdarzeniem terminowym, a nie statusem: zapisuje poprzedni i nowy termin, powód oraz czas powiadomienia. Każde przejście ma dozwolonego aktora i wpis audytowy. Termin jest liczony kalendarzowo od otrzymania żądania w UTC; weryfikacja i żądanie doprecyzowania są odnotowywane, ale nie służą do bezpodstawnego resetowania zegara. Jedna sprawa dotyczy jednego prawa, dzięki czemu częściowa realizacja i częściowa odmowa mają jednoznaczny wynik.

Wspólna koperta sprawy używa polityki właściwej dla typu prawa. Polityka określa wymagany poziom weryfikacji, dozwolone wyniki i wykonawcę. Wycofanie zgody korzysta z tej samej koperty i audytu, ale wykonuje odrębną operację zarządzania zgodą; nie jest traktowane jak usunięcie danych ani sprzeciw.

### Kanały osoby składającej wniosek

- Konto: krótki ekran dostępny z obecnego „Twoje dane”. Pokazuje jedno działanie „Złóż wniosek” i listę własnych spraw. Wybór prawa, krótki opcjonalny opis i wysłanie; operacje wysokiego ryzyka wymagają świeżej reautoryzacji. Szczegóły prawa i procesu są ukryte pod „Pokaż szczegóły”.
- Gość: ten sam publiczny kanał WWW, do którego aplikacja już kieruje. Formularz przyjmuje email, typ prawa i ustrukturyzowane wskazówki ograniczone do identyfikatorów, które Patternly faktycznie przetwarza; bez dowolnych załączników i nieograniczonego opisu. Link email potwierdza wyłącznie posiadanie skrzynki i otwiera krótką sesję weryfikacyjną; nie jest automatycznie dowodem, że odnalezione dane dotyczą tej osoby.
- Polityka prawa określa poziom weryfikacji zależny od ryzyka. Gdy danych gościa nie da się odnaleźć lub powiązanie nie jest wystarczające, generyczna odpowiedź nie ujawnia istnienia danych i pozwala podać tylko dodatkowe, minimalne wskazówki.

### Praca operatora

Istniejący panel administracyjny otrzymuje jedną kolejkę „Wnioski prywatności”. Lista pokazuje identyfikator, prawo, status i termin — bez treści oraz danych osobowych. Szczegóły są pobierane dopiero po otwarciu sprawy, a każdy odczyt jest audytowany. Operator może zażądać proporcjonalnej weryfikacji, odnotować ocenę, przedłużyć z przyczyną, przygotować realizację albo odmowę z podstawą i zamknąć sprawę.

Eksport i usunięcie wykorzystują istniejące wykonawce. Panel DSAR nie otrzymuje nowego przycisku automatycznie usuwającego konto: nieodwracalne usunięcie nadal wymaga istniejącego, potwierdzonego przepływu właściciela konta. Pozostałe prawa są realizowane przez jawne, audytowane działania operatora; system nie udaje automatycznego rozstrzygnięcia prawnego. MVP zachowuje jedną skonfigurowaną rolę administratora, ale nie pozwala jej obchodzić zabezpieczeń istniejących wykonawców.

### Bezpieczna odpowiedź

Rekomendowany wariant hybrydowy:

- konto odbiera status i odpowiedź w aplikacji po świeżej reautoryzacji;
- gość otrzymuje nieprzewidywalny, haszowany po stronie serwera i wygasający token, który jest jednorazowo wymieniany na krótką sesję strony odpowiedzi;
- email nie zawiera danych ani pełnej odpowiedzi;
- endpointy są nieenumerujące, limitowane i nie zapisują tokenu ani odpowiedzi w logach;
- odpowiedź ma krótki czas dostępności, ograniczenie prób, możliwość odwołania i audyt pobrania; po wygaśnięciu można wydać nowy link bez duplikowania sprawy;
- `response_ready`, `fulfilled` i `closed` są odrębne: przygotowanie odpowiedzi nie jest uznawane za jej doręczenie.

### Minimalny zakres UI

Ekran użytkownika nie jest panelem zarządzania sprawą. Na pierwszym planie pozostają: typ prawa, status, termin i wymagane działanie. Uzasadnienia, historia, informacje o skardze i szczegóły procesu są dostępne po rozwinięciu. Panel operatora używa istniejącego języka wizualnego i dodaje jedną kolejkę oraz jeden widok szczegółu.

### Retencja i dostęp

Rekord sprawy, zaszyfrowany artefakt odpowiedzi i minimalny audyt są rozdzielone. Audyt nie zawiera treści żądania, odpowiedzi, emaila ani surowego identyfikatora konta; przechowuje pseudonim, zdarzenie, aktora, podstawę decyzji i czas. Rekomendacja: odpowiedź dostępna 30 dni od doręczenia, dane robocze i tokeny usuwane po zamknięciu/wygaśnięciu, a minimalny pseudonimowy dowód rozliczalności przechowywany 3 lata analogicznie do dowodów usunięcia. Polityka purge obejmuje ponowne wydanie odpowiedzi i legal hold. Dostęp operatorski pozostaje ograniczony do skonfigurowanego, zweryfikowanego administratora; rozbudowa ról nie jest częścią MVP.

Każdy wykonawca prawa ma kontrakt: snapshot zakresu, idempotency key, wynik pełny/częściowy/odmowa, retry, dowód zakończenia i zakaz oznaczenia `fulfilled` przed udostępnieniem odpowiedzi. Sprostowanie, ograniczenie, sprzeciw i wycofanie zgody nie zostaną oznaczone jako zrealizowane, dopóki odpowiadające im realne mutacje nie istnieją; brak wykonawcy daje operatorowi jawny stan niedostępności, nie fałszywy sukces.

## Decyzje wymagane od product ownera

1. Akceptacja hybrydowego doręczenia: aplikacja dla konta, jednorazowy link email dla gościa.
2. Akceptacja istniejącego panelu administracyjnego jako minimalnego narzędzia operatora, bez automatycznego podejmowania decyzji prawnych.
3. Akceptacja proponowanej retencji: odpowiedź 30 dni, minimalny dowód sprawy 3 lata.

## Kontrakty implementacyjne

### Macierz praw i wykonawców

| Prawo | Minimalny zakres | Weryfikacja | Wykonawca MVP | Dozwolony wynik |
|---|---|---|---|---|
| Dostęp | Kopia danych i informacje wymagane art. 15 | Konto: świeża reautoryzacja; gość: dowód powiązania z poszukiwanym identyfikatorem | Eksport ODK068 rozszerzony o informację art. 15 | pełna realizacja, częściowa realizacja z redakcją, odmowa |
| Sprostowanie | Wskazane nieprawidłowe lub niekompletne dane | Jak dla odczytu/mutacji danej kategorii | Jawna, idempotentna mutacja dozwolonych pól; inne pola wymagają działania operatora | pełna/częściowa realizacja, odmowa |
| Usunięcie | Dane objęte przesłankami art. 17 z rozliczeniem wyjątków | Świeża reautoryzacja lub odrębny, silny dowód właściciela | Istniejący przepływ usunięcia potwierdzany przez właściciela | pełna/częściowa realizacja, odmowa |
| Ograniczenie | Oznaczone operacje i kategorie danych | Jak dla danych objętych żądaniem | Blokada zapisu/przetwarzania w warstwie repozytoriów, z wyjątkami zapisanymi przez operatora | pełna/częściowa realizacja, odmowa |
| Sprzeciw | Konkretne operacje oparte na prawnie uzasadnionym interesie | Proporcjonalna do operacji i danych | Flaga egzekwowana przed daną operacją; ocena nadrzędnych podstaw pozostaje ręczna | realizacja albo uzasadniona odmowa |
| Przenoszenie | Dane dostarczone przez osobę, przetwarzane automatycznie na zgodzie lub w celu wykonania umowy | Jak dla eksportu | Eksport ODK068 z jawnie oznaczonym zakresem przenoszalnym | pełna/częściowa realizacja, odmowa |
| Wycofanie zgody | Konkretna zgoda i zależne przyszłe przetwarzanie | Ten sam poziom co wyrażenie/zarządzanie daną zgodą | Osobny rejestr zgód i egzekwowanie wycofania przed przyszłym przetwarzaniem | realizacja; inne podstawy pozostają jawnie nienaruszone |

System nie wystawia wyniku pozytywnego, jeśli wykonawca nie zwróci idempotentnego dowodu rzeczywistego zastosowania zmiany. Wieloprawne zgłoszenie jest rozbijane na powiązane sprawy, po jednej na prawo. Identyczne aktywne zgłoszenie nie jest automatycznie odrzucane: operator widzi powiązanie i decyduje, czy odpowiedzieć łącznie; każde prawo zachowuje własny wynik i audyt.

### Stany, wykonanie i doręczenie

- `received` → `identity_verification_required` lub `in_review`.
- `identity_verification_required` → `in_review` po wystarczającym dowodzie albo → `refused`, gdy Patternly wykaże brak możliwości identyfikacji.
- `in_review` → `response_ready`, `partially_fulfilled` albo `refused`. Wynik wykonawcy ma osobny stan `pending`, `retryable_failure` lub `terminal_failure`; żaden błąd nie jest ukrywany jako realizacja.
- `response_ready` oznacza utworzenie, sprawdzenie i autoryzację artefaktu. Po skutecznym udostępnieniu i wysłaniu powiadomienia sprawa przechodzi do `fulfilled` albo `partially_fulfilled`.
- Pobranie jest osobnym zdarzeniem. Brak pobrania nie cofa realizacji, ale pozostaje widoczny w audycie; po 30 dniach artefakt wygasa, a ponowne wydanie tworzy nowy artefakt w tej samej sprawie.
- `fulfilled`, `partially_fulfilled` i `refused` → `closed` po zakończeniu komunikacji. Zamknięcie nie usuwa jeszcze dowodu retencyjnego.
- Przedłużenie może wystąpić najwyżej raz, przed upływem pierwszego terminu. Nowy termin nie może przekroczyć dwóch dodatkowych miesięcy. Zdarzenie zawiera powód, wersję komunikatu i dowód próby powiadomienia.

### Poziomy zaufania i dostęp

- `account_session`: aktywny token pozwala utworzyć sprawę i odczytać jej minimalny status wyłącznie dla własnego UID.
- `recent_account_session`: świeża reautoryzacja jest wymagana do odczytu odpowiedzi, eksportu, przenoszenia oraz rozpoczęcia usunięcia.
- `verified_email_session`: jednorazowy token email jest wymieniany przez jawne działanie użytkownika na krótką, obiektowo ograniczoną sesję; automatyczny prefetch linku nie zużywa tokenu ani nie ujawnia odpowiedzi.
- `guest_subject_verified`: operator odnotował wystarczające powiązanie podanych wskazówek z konkretną kategorią danych. Samo posiadanie emaila nie nadaje tego poziomu.
- `administrator`: zweryfikowany email z konfiguracji może oglądać kolejkę i wykonywać dozwolone przejścia. Lista nie zawiera treści ani danych kontaktowych; każdy odczyt szczegółu i artefaktu jest audytowany.
- Żadne przejście administracyjne nie omija świeżej reautoryzacji właściciela wymaganej przez istniejący wykonawca usunięcia.

### Dane, bezpieczeństwo i cykl życia

- Rekord sprawy zawiera tylko dane sterujące procesem. Kontakt i wskazówki identyfikacyjne są przechowywane oddzielnie i nie są kopiowane do audytu.
- Artefakt odpowiedzi jest szyfrowany oddzielnym kluczem, nie trafia do Firestore jako pole dokumentu, logów ani emaila. Autoryzacja jest obiektowa dla `requestId` i bieżącego podmiotu/sesji.
- Tokeny są generowane kryptograficznie, w bazie przechowywany jest wyłącznie hash. Token nie trafia do telemetryki, referrera ani odpowiedzi po wymianie; endpointy mają jednolite odpowiedzi i per-subject/per-IP rate limiting.
- Minimalny audyt zawiera pseudonim podmiotu, typ zdarzenia, pseudonim aktora, kod powodu, wersję komunikatu i czas. Nie zawiera free text, emaila, tokenu ani treści odpowiedzi.
- Legal hold jest jawnym, audytowanym wyjątkiem z powodem i datą przeglądu. Nie obejmuje automatycznie całej sprawy ani odpowiedzi.
- Właścicielem polityki purge jest operator danych. Automatyczny purge usuwa tokeny i artefakty po ich terminie, dane robocze po zamknięciu oraz minimalny dowód po upływie zatwierdzonej retencji.

### Kryteria akceptacji

- Każde prawo przechodzi test pełnej realizacji, częściowej realizacji i uzasadnionej odmowy, jeśli dany wynik jest prawnie możliwy.
- Konto nie odczyta cudzej sprawy ani artefaktu; stara sesja po zmianie UID lub reautoryzacji nie może odebrać odpowiedzi.
- Publiczne intake, wymiana tokenu i status są nieenumerujące; skaner linków nie konsumuje tokenu.
- Termin miesięczny, jednokrotne przedłużenie i informacja przed jego upływem są testowane na kontrolowanym zegarze.
- Nie istnieje pozytywny status bez dowodu wykonawcy; retry jest idempotentny.
- Odpowiedź art. 15 zawiera kopię i wymagane informacje, a zakres przenoszalny jest odróżniony od pełnego dostępu.
- Operator widzi minimalną kolejkę, a odczyt szczegółów, decyzja, pobranie, reissue, purge i legal hold mają audyt.
- Purge usuwa artefakt, tokeny i dane robocze we właściwym terminie oraz zachowuje wyłącznie zatwierdzony minimalny dowód.

## Ocena przed wdrożeniem

- Dopasowanie do celu i architektury: `0.92` — rozszerza istniejący eksport, usuwanie, auth i panel, zachowując polityki per prawo.
- Prostota: `0.83` — jeden model sprawy i jedna kolejka; osobne polityki pozostają konieczne dla praw o różnej semantyce.
- Kontrola ryzyka: `0.88` — ryzykowa weryfikacja i doręczenie mają jawne poziomy zaufania, sesję zamiast bearer download oraz minimalny audyt.
- Utrzymywalność: `0.89` — wspólna koperta, osobne zdarzenia terminowe i kontrakty wykonawców zapobiegają przeciążeniu statusów.

## Źródła prawne

- RODO, w szczególności art. 7 oraz 11–22: https://eur-lex.europa.eu/legal-content/PL/TXT/?uri=CELEX:32016R0679
- EDPB, Guidelines 01/2022 on data subject rights — Right of access, wersja 2.1: https://www.edpb.europa.eu/documents/guideline/guidelines-012022-on-data-subject-rights-right-of-access_en
- UODO, materiały dla obywatela dotyczące wykonywania praw: https://uodo.gov.pl/pl/504
