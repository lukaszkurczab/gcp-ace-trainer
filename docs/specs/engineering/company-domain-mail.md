# DOMAIN-MAIL-01 — firmowa domena i poczta

Status i kolejność: [plan główny](../../PATTERNLY-WORKING-PLAN.md). Zadanie przygotowuje domenę oraz działającą firmową skrzynkę przed finalizacją kontaktów R01. Publikację witryny na tej domenie obejmuje [R02 / WEB-PUBLISH](web-release.md). Pełny odbiór automatycznych wiadomości backendu pozostaje w ODK-E2E-086.

## Cel i potwierdzona luka

Użytkownik ma znaleźć witrynę Patternly pod zatwierdzonym adresem i móc napisać na działający firmowy e-mail. Operator musi odbierać wiadomości oraz odpowiadać z tego adresu.

W `patternly/config/public-legal.release.json` adresy operatora, prywatności, reklamacji i odstąpienia są nadal niewypełnione. W `patternly-web/firebase.json` i `.firebaserc` wskazano Hosting `patternly-app-sandbox`; samo to nie potwierdza podłączenia firmowej domeny. Dotychczasowy plan wymagał podania kontaktów i odbioru SMTP, ale nie zawierał zadania utworzenia firmowej skrzynki.

Odczyt z 07.10.2026 potwierdził w usłudze Cloud Run `patternly-backend-sandbox` projektu `patternly-app-sandbox`: `SMTP_HOST=smtp-relay.brevo.com`, port 587, domena nadawcy i odpowiedzi `gmail.com`. W Secret Manager istnieje konfiguracja hasła SMTP; wartości sekretu nie odczytywano. To dowód skonfigurowanego transportu wysyłki Brevo, nie firmowej skrzynki ani udanej dostawy. Starsze instrukcje Google Workspace są rozbieżne z tym odczytem i wymagają korekty w zadaniu, jeśli opisują ten sam transport.

Publiczne zapytania o `patternly.it` do resolverów Cloudflare i Google oraz autorytatywnego `dns.nic.it` zwróciły `NXDOMAIN`: brak aktywnej delegacji DNS. Nie potwierdza to dostępności domeny do zakupu ani nie wyklucza nieaktywnego konta u dostawcy. Nie sprawdzono panelu rejestratora ani panelu skrzynek; nie znaleziono dowodu działającej firmowej skrzynki. Przed tworzeniem zasobów sprawdzić własność i istniejące konta. Nie wysłano wiadomości, nie kupiono usług i nie zmieniono konfiguracji.

## Ustalenia wymagane przed konfiguracją zewnętrzną

Właściciel wskazał domenę `patternly.it`. Adres skrzynki i dostawca nie zostały jeszcze wybrane; najpierw sprawdzić, czy istnieją poprawne zasoby. Nie kupować innej domeny ani nie wybierać adresu e-mail przez domysł.

Potwierdzić dokładną domenę, kanoniczny adres witryny, adres skrzynki i ewentualne aliasy, dostawcę poczty, właściciela kont oraz to, czy domena lub poczta już istnieją. Jeśli trzeba kupić domenę lub usługę, przygotować konkretną ofertę i koszt do zatwierdzenia przed zakupem. Nie wpisywać wymyślonych adresów jako danych wydaniowych.

Jedna rzeczywista skrzynka z aliasami może obsługiwać kilka funkcji kontaktu, jeśli właściciel tak zdecyduje. Nie tworzyć osobnych płatnych skrzynek wyłącznie dlatego, że konfiguracja prawna ma kilka pól. Każdy opublikowany adres musi faktycznie trafiać do obsługiwanej skrzynki.

## Zakres wykonania

1. Ustalić własność domeny, dostęp do rejestratora/DNS i konta pocztowego oraz osobę odpowiedzialną za obsługę. Dla istniejącej domeny zachować pozostałe działające usługi; dla nowej przeprowadzić uzgodnioną rejestrację i weryfikację własności.
2. Utworzyć lub zweryfikować skrzynkę i uzgodnione aliasy. Zapewnić właścicielowi dostęp oraz działające odzyskiwanie konta i dostępne zabezpieczenia logowania. Hasła, kody odzyskiwania i klucze pozostają poza repozytorium.
3. Przygotować dokładną zmianę DNS na podstawie aktualnych wymagań wybranego dostawcy: weryfikacja domeny, MX oraz SPF, DKIM i DMARC odpowiednie do rzeczywistych nadawców. Sprawdzić istniejące rekordy przed zmianą, nie zastępować ich w ciemno i nie publikować kilku sprzecznych rekordów SPF. Polityka DMARC musi uwzględniać legalne źródła wysyłki; jej skuteczność potwierdzić rzeczywistą dostawą.
4. Wykonać kontrolowaną próbę: wiadomość z zewnętrznej skrzynki trafia na każdy opublikowany adres lub alias, operator odbiera ją i odpowiada z uzgodnionego firmowego adresu, a odpowiedź dociera do nadawcy. Sprawdzić nagłówki uwierzytelnienia domeny. Samo istnienie konta, rekordów DNS lub akceptacja połączenia SMTP nie zamykają zadania.
5. Przekazać zweryfikowane publiczne adresy do R01: `terms.operatorEmail`, `complaintEmail`, `withdrawalEmail`, `privacy.privacyEmail` oraz inne rzeczywiście używane kontakty. Zachować jedno źródło `config/public-legal.release.json`; skontrolować konsumentów w aplikacji i eksporcie prawnym WWW.
6. Uzgodnić, czy automatyczne wiadomości aplikacji korzystają z tego samego dostawcy, czy z odrębnego transportu. Powiązać rzeczywiste `SMTP_FROM_EMAIL` i `SMTP_REPLY_TO` z działającymi adresami oraz właściwym DNS. Konfiguracja sekretów należy do istniejącego mechanizmu backendu, bez drugiego systemu wysyłki. Pełną macierz sukcesu, odmowy i niepewnej dostawy odebrać w ODK-E2E-086.
7. Zapisać zwięzły stan operacyjny: domena, dostawca, publiczne adresy, właściciel obsługi, sposób dostępu do zarządzania i data odbioru. Przebieg z identyfikatorami wiadomości i prywatnymi danymi przechowywać poza publicznym repo; repo ma zawierać odtwarzalną procedurę i bezpieczne podsumowanie.

## Zależności i granice

Wybór/weryfikacja domeny i utworzenie poczty mogą poprzedzać pozostałe dane R01. R01 konsumuje działające kontakty; R02 wykorzystuje tę samą zatwierdzoną domenę i konfiguruje jej rekordy dla Hosting, zachowując rekordy poczty. Dzięki temu nie ma zależności poczty od wcześniejszej publikacji witryny.

Lokalny eksport Gościa pozostaje offline, bez e-maila i uwierzytelniania. Zadanie nie dodaje nowych maili do przepływów produktu ani publicznego formularza zgłoszeń. Nie migrować istniejącej korespondencji i nie usuwać starej domeny, skrzynek lub rekordów bez wykazanej potrzeby i autoryzacji. Planowanie nie jest zakupem ani zgodą na nieokreślone zmiany u dostawcy; istniejącą autoryzację dla konkretnej operacji sprawdzić przed proszeniem o nią ponownie.

## Odbiór i ryzyka

Zadanie jest zakończone, gdy zatwierdzona domena pozostaje pod kontrolą właściciela, skrzynka i wszystkie używane aliasy odbierają pocztę, odpowiedzi docierają do zewnętrznej skrzynki, uwierzytelnienie domeny odpowiada wybranemu transportowi, a kontakty mają jedną obsługiwaną konfigurację. R01 i ODK-E2E-086 otrzymują rzeczywiste wyniki, nie zastępcze adresy lub pozorny sukces.

Przed zmianami zapisać obecne rekordy DNS i plan odtworzenia; po zmianach sprawdzić też zachowanie usług, których rekordy zachowano. Główne ryzyka to utrata istniejącej dostawy, brak dostępu operatora oraz niezgodność domeny nadawcy z rzeczywistym transportem. Nie obiecywać natychmiastowej propagacji DNS ani dostawy na podstawie wyłącznie testu lokalnego.

Ocena kierunku: zgodność z celem i architekturą 0,96; prostota 0,92; kontrola ryzyka 0,87; utrzymywalność 0,92; minimum 0,87. Wykorzystanie jednej domeny i istniejących właścicieli konfiguracji ogranicza duplikację; odczyt stanu i kontrolowane próby chronią działające usługi.

## Polecenie dla kolejnego agenta

Sprawdź aktualny plan, konfigurację aplikacji/web/backendu i rzeczywisty stan wybranych usług. Rozpoznaj wykonane części, uzupełnij wyłącznie pozostały zakres DOMAIN-MAIL-01, uporządkuj działania według zależności i dołącz dowód do każdej zmiany. Oddziel odczyt, zakup, zmianę DNS i konfigurację skrzynki. Pokaż konkretne brakujące decyzje lub dostępy, kontynuując niezależne przygotowanie. Nie zmieniaj innych usług ani przepływów produktu. Nie wysyłaj próbnych wiadomości bez upoważnienia do tej próby; uzyskaj je dla konkretnych kontrolowanych adresów, jeżeli nie jest już udzielone.
