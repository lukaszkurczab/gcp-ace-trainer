# ODK-E2E-078 — discovery obsługi naruszeń danych

Status: `APPROVED_FOR_IMPLEMENTATION`

Data: 2026-09-07

## Dowody prawne

- art. 33 RODO wymaga udokumentowania każdego naruszenia oraz zgłoszenia organowi bez zbędnej zwłoki, w miarę możliwości do 72 godzin od stwierdzenia, chyba że ryzyko dla praw i wolności jest mało prawdopodobne;
- spóźnione zgłoszenie nadal trzeba wysłać z uzasadnieniem; informacje mogą być uzupełniane etapami;
- art. 34 RODO wymaga jasnego zawiadomienia osób bez zbędnej zwłoki przy wysokim ryzyku, z udokumentowanymi wyjątkami;
- odpowiedzialność za decyzję pozostaje po stronie administratora; system może pilnować terminów, ale nie może automatycznie rozstrzygać obowiązku prawnego.

Źródła: [RODO art. 33–34](https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=PL), [UODO — zgłaszanie naruszeń](https://uodo.gov.pl/pl/525/2584), [poradnik UODO 2025](https://uodo.gov.pl/pl/file/5686), [Wytyczne EROD 9/2022](https://uodo.gov.pl/file/5313).

## Minimalny zakres rozwiązania

- szyfrowany rejestr incydentów i naruszeń z ograniczonym dostępem administratora;
- jawne czasy `detectedAt`, `awarenessAt`, `containedAt`, `closedAt`; zegar 72 h liczony tylko od `awarenessAt`;
- rozdzielone decyzje: czy zdarzenie jest naruszeniem, czy zgłosić UODO i czy zawiadomić osoby;
- kategorie/skalę danych i osób, wpływ na poufność–integralność–dostępność, skutki, ocenę prawdopodobieństwa i wagi, środki containment/remediation/prevention;
- wersjonowany, nieedytowalny log decyzji i działań;
- eksport treści zgłoszenia początkowego i uzupełnień oraz dowodów wysłania;
- eskalacje przed 72 h, ale bez automatycznego oznaczania `not_required`;
- osobny, prosty szablon zawiadomienia osób z kontaktem i zalecanymi działaniami;
- runbook dla incydentu niskiego i wysokiego ryzyka oraz ćwiczenie zakończone dowodem.

## Decyzje product ownera

Decyzje zatwierdzone 2026-09-07.

### Punkt kontaktowy

Konfigurowalny alias `privacy@docelowa-domena`; do czasu uzupełnienia prawdziwej wartości placeholder blokuje realną wysyłkę. Kanałem wysyłkowym pozostaje zatwierdzony Google Workspace SMTP.

### Właściciel i zastępca

Właścicielem formalnej decyzji jest administrator danych/product owner. Zastępca jest konfigurowalnym polem i może pozostać pusty. Obecnie system ma jednego administratora; nie jest wdrażany osobny RBAC.

### Retencja

Zminimalizowany rejestr, decyzje i audyt są przechowywane przez sześć lat kalendarzowych od zamknięcia. Szyfrowane artefakty i dowody są przechowywane przez rok kalendarzowy od ich utworzenia. Jawny, uzasadniony legal hold wstrzymuje oba terminy; jego zwolnienie jest audytowane i ponownie wylicza termin z pierwotnej daty.

### Kanały i interfejs

- brak nowego ekranu mobilnego;
- minimalny panel administracyjny pokazuje najpierw klasyfikację, termin 72 h i stan wymagający działania, a szczegóły udostępnia na żądanie;
- zgłoszenie do UODO pozostaje ręczne: system przygotowuje wersjonowany eksport i zapisuje dowód wysłania, ale nie wysyła go automatycznie;
- zawiadomienie osób jest wysyłane osobno do każdego odbiorcy dopiero po jawnej akcji administratora; wynik niepewny nie jest automatycznie ponawiany.

## Ocena wariantu rekomendowanego

- dopasowanie do celu i architektury: `0.93`;
- prostota: `0.83`;
- kontrola ryzyka: `0.94`;
- utrzymywalność: `0.88`.

Minimalna ocena discovery: `0.83`.

## Walidacja podejścia przed implementacją

Pierwsza niezależna walidacja Luna/max odrzuciła briefing z wynikiem `0.74` ze względu na niedoprecyzowane niezmienniki współbieżności, wysyłki, retencji i `awarenessAt`. Po redesignie zatwierdzono:

- trzy niezależne osie stanu: klasyfikację, decyzję i wykonanie wobec UODO oraz decyzję i wykonanie wobec osób;
- serwerowy, niezmienny `awarenessAt`, korektę wyłącznie jako nową wersję z powodem oraz termin UTC `+72 h`;
- osobne przygotowanie i wysyłkę zawiadomienia, idempotentną próbę oraz stan `unknown` wymagający ręcznej decyzji;
- bez-PII append-only audit, szyfrowane szczegóły i zamrożone snapshoty;
- idempotentne przypomnienia 24/48/60/70 h, które nie wykonują decyzji ani wysyłek;
- precyzyjną retencję i kaskadowy legal hold;
- wersjonowany eksport UODO i ręczny zapis dowodu zamiast integracji wysyłkowej.

Ocena końcowa po redesignie: spójność `0.92`, prostota `0.88`, kontrola ryzyka `0.83`, utrzymywalność `0.86`; minimum `0.83`, werdykt `APPROVE`.
