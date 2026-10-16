# DOMAIN-MAIL-01 — firmowa domena i poczta

Status i kolejność: [jedyny plan](/Users/lukaszkurczab/Desktop/Projects/Patternly/docs/PATTERNLY-WORKING-PLAN.md), [bieżący stan](/Users/lukaszkurczab/Desktop/Projects/Patternly/.agent/WORKING_STATE.md). R01 otrzymuje działające kontakty; witryna pozostaje [R02](web-release.md), pełna macierz backendowego SMTP — ODK-E2E-086.

## Prompt39 — odczyt i przygotowanie 16.10.2026

**PASS prompt39 / DOMAIN-MAIL-01 dla domeny, Zimbra, pojedynczej dostawy Brevo i uzgodnionej konfiguracji sandbox.** Właściciel kupił `patternly.it` na rok w OVH z dołączoną skrzynką contact@ i aliasami support/privacy. Zimbra+Brevo zastąpiły Google Workspace; nie uruchomiono trialu/subskrypcji Google. WHOIS potwierdził rejestrację do16.10.2027. Odebrano6/6 wiadomości człowieka oraz osobno zatwierdzoną1/1 próbę Brevo SMTP. Oba wycinki mają niezależny raw-header QA gpt-6-luna high PASS. Nie ponawiać zakupu ani siedmiu wysyłek.

Właściciel następnie osobno zatwierdził przełączenie dwóch pól backendu; nowe FROM/REPLY-TO contact@ obsługują100% domyślnego ruchu sandbox przy tym samym obrazie i referencjach sekretów. Pozostałe opisy Google poprawiono. R01 otrzymuje potwierdzone kontakty; pełny ODK-E2E-086 i wydanie pozostają osobno. Odebrany39 usunięto z aktywnego planu. Następny dopuszczalny prompt40/R01, nieuruchomiony. Odebranego QLE/01 nie ponawiano.

### Bieżące dowody i granice

| Obszar | Faktyczny odczyt16.10.2026 | Granica dowodu |
| --- | --- | --- |
| Domena/zakup | WHOIS13:56:58UTC: rejestracja16.10.2026, wygaśnięcie16.10.2027, clientDeleteProhibited; dns103.ovh.net/ns103.ovh.net. OVH zakończył tworzenie domeny, zamówienie38,12zł brutto. | Kontrola w zalogowanym OVH. Historyczne AVAILABLE/NXDOMAIN nie opisują obecnego stanu. Dane abonenta i zamówienia prywatne. |
| Skrzynka/aliasy | STARTER15GiB contact@, slot1/1 Aktywna; support@ i privacy@ Aktywna2/2. Właściciel korzysta z webmaila. | Trzy dostawy wejściowe: zrzut Inbox i potwierdzenie właściciela, bez raw Delivered-To/Received Zimbra. Powiązane odpowiedzi sprawdzone przez Gmail API. |
| DNS OVH | CF/Google14:09:42UTC: NS/3MX/SPF zgodne; oba OVH NS14:08:16UTC: SRV autodiscover. Exact2CNAME DKIM i publiczne klucze14:15:22UTC na OVH NS/CF/Google. | Zastane NS/MX/SPF/A/TXT zachowane. DKIM panel Konfiguracja OK, podpisywanie włączone. Odpowiedzi potwierdzają selector-1; rotacji selector-2 nie ćwiczono. |
| DMARC | Jeden TXT TTL3600, exact readback14:26:07UTC na obu OVH NS/CF/Google. Google DMARCpass dla3odpowiedzi OVH oraz1Brevo. | p=none monitoruje, nie odrzuca. Odbioru raportu aggregate nie sprawdzono; bez nowego zewnętrznego rua. |
| Brevo DNS/domena | Exact dodatkowy TXT+2CNAME publicznie zgodne14:53:08UTC na obu OVH NS/CF/Google. Panel domen: patternly.it Authenticated, All domains are authenticated. | Właściciel poprawił własny błędny brevo1 DNAME na CNAME; nie ponawiać dodawania. Not branded dotyczy opcjonalnego trackingu shared IP. |
| Brevo nadawca/konto | Patternly <contact@patternly.it> Verified, DKIM patternly.it i DMARC green; MCP id2 active=true. Dotychczasowy Gmail sender zachowany. Konto właściciela Free/sendLimit, relay enabled smtp-relay.brevo.com:587. | Niezależny read-only QA PASS. Ostrzeżenie freemail starego Gmaila nie oznacza błędu nowego contact@. Bez płatnego IP/planu. |
| Konto transportu | Readback Cloud Run15:01:20UTC: login SMTP porównany w pamięci z relay loginem zalogowanego Brevo — zgodny; password wyłącznie Secret Manager ref. | Nie ujawniono wartości loginu/hasła. Jednorazowy probe odczytał istniejące hasło tylko w pamięci, bez rotacji. |
| Brevo dostawa | Jedna zatwierdzona wiadomość odebrana w Gmail Inbox17:10:28Warsaw, nonspam, From Patternly/contact@, To właściciel, Reply-To contact@. SPFpass, DKIMpass d=patternly.it s=brevo2, DMARCpass. | SPF kopertowy hb.d.sender-sib.com nie jest wyrównany; DMARC przechodzi przez aligned DKIM. To probe SMTP, nie handler aplikacji ani regresja starego sendera. |
| Cloud Run | patternly-app-sandbox / europe-central2 / patternly-backend-sandbox; nowa rewizja patternly-backend-sandbox-domain-mail39-1016 Ready i100% domyślnego ruchu, Brevo587, FROM/REPLY-TO contact@, FROM_NAME Patternly. | Ten sam obraz i pozostały runtime; istniejące tagi zachowane, nowy tymczasowy usunięty; /health i /ready200. Bez nowej wiadomości/handler testu; pełne ODK-E2E-086 osobno. |
| Konfiguracja kontaktów | Potwierdzone contact/support/privacy przekazane R01 poniżej. emailDeliveryProvider w APPJSON/localfixture i SMTP env/instrukcje backendu poprawione na Brevo. | Pozostałe dane prawne/kontakty wydaniowego JSON nadal do R01; bez jego uruchamiania, eksportu i publikacji. |

Sprawdzone źródła: APP0e5e44468308d3dba73305acd276edb73fcea98b, BACKEND4095a31a403192d39b87b32f70f90c178b321c7e, WEB82d4509c0f82f449424152b26b540edc7829d5a0. Na wejściu39 repo czyste; własny diff APP to ta specyfikacja, BACKEND to narzędzie próby. environment.ts wymaga kompletu SMTP_*, smtpPrivacyEmailSender.ts używa465TLS/587STARTTLS, requireTLS/minTLS1.2. purchaseReceiptSmtp.test.ts dowodzi kontraktu lokalnego, nie operatora. Eksport public legal korzysta z kanonicznego JSON. Poza opisem emailDeliveryProvider nie zmieniano logiki produktu; zależności, piny, urządzenia, WWW i pozostałe usługi zachowane.

### Wybrana Zimbra i koszty

Jedna skrzynka15GB contact@, aliasy support@ i privacy@, obsługa przez właściciela, bez catch-all. Zimbra odbiera i wysyła odpowiedzi człowieka; istniejący Brevo wysyła automatyczne maile. Bez drugiego systemu backendowego i bez migracji starego Gmaila.

| Składnik | NettoPLN | BruttoPLN23%VAT | Warunek |
| --- | --- | --- | --- |
| Domena OVH1rok | 30,99 | 38,12 | Zakup i rejestracja do16.10.2027 odebrane. |
| Cena odnowienia pokazana przy zakupie | 27,99 | 34,43 | Cena przyszła niegwarantowana. |
| Zimbra Starter15GB, dołączona skrzynka | 0dopłaty | 0dopłaty | Bezpłatna dopóki domena jest w OVH i nie zostaje usunięta/przeniesiona, zgodnie z przypisem koszyka. |
| Brevo | Bez zmiany Free | Bez nowego zamówienia | Bez zakupu IP/planu/zwiększeń limitu. |

Źródła: [OVH domena](https://www.ovhcloud.com/pl/domains/tld/it/), [skrzynka w cenie domeny](https://www.ovhcloud.com/pl/domains/), [Zimbra](https://www.ovhcloud.com/pl/emails/). Google Workspace nie aktywowano; brak subskrypcji do anulowania.

### Dostęp do zakupu — konkretny punkt zatrzymania

Zakup/onboarding/DNS zakończone przez właściciela. Opera connector odczytuje/nawiguje, bez click/fill; właściciel obsługuje formularze i webmail, sekrety oraz rozliczenia bezpośrednio u operatora. Nie ponawiać diagnostyki znanego błędu CUA. Właściciel uwierzytelnił domenę i dodał nadawcę w Brevo; statusy odczytano przez panel i MCP. Brevo akceptuje istniejący DMARC z rua contact@, bez proponowanego zewnętrznego rua. Trzy nowe rekordy i poprawkę DNAME→CNAME odebrano niezależnie. Rollback DNS usuwa wyłącznie te3dodatki, bez resetu strefy.

### Konkretny DNS dla wybranego wariantu

**Wdrożone i odebrane.** Nazwy względne do patternly.it, TTL3600s dla nowych rekordów. Zachować NS/DNSSEC/WWW/A/inne TXT. Nie dodawać Google MX/SPF/tokenów, dodatkowego SPF/DMARC ani domyślnego include Brevo.

| Nazwa | Typ | Priorytet | Wartość |
| --- | --- | --- | --- |
| @ | MX | 1 | mx1.mail.ovh.net. |
| @ | MX | 5 | mx2.mail.ovh.net. |
| @ | MX | 100 | mx3.mail.ovh.net. |
| @ | TXT | — | v=spf1 include:mx.ovh.com -all |
| _autodiscover._tcp | SRV | — | 0 0 443 zimbra1.mail.ovh.net. |
| ovhmo-selector-1._domainkey | CNAME | — | ovhmo-selector-1._domainkey.5014010.fb.dkim.mail.ovh.net. |
| ovhmo-selector-2._domainkey | CNAME | — | ovhmo-selector-2._domainkey.5014011.fb.dkim.mail.ovh.net. |
| _dmarc | TXT | — | v=DMARC1; p=none; rua=mailto:contact@patternly.it; adkim=r; aspf=r |
| @ | TXT | — | brevo-code:de7da86045b4eea1b8c7bdd96a2ae7e3 — dodatkowy publiczny token DNS, nie credential SMTP/API. |
| brevo1._domainkey | CNAME | — | b1.patternly-it.dkim.brevo.com. |
| brevo2._domainkey | CNAME | — | b2.patternly-it.dkim.brevo.com. |

Oba klucze OVH: DKIM1/rsa,294decoded bytes, SHA256 8c3fef2b951a699f97832720374e3d559258f5d52e10ff12baceb844e0bf36a2. Faktyczne3MX zgodne z [OVH](https://docs.ovhcloud.com/en/guides/web-cloud/web-hosting/hosting-migrating-to-ovh); nie nadpisywać ich ogólnym przykładem5MX. [OVH SPF](https://docs.ovhcloud.com/pl/guides/web-cloud/domains/dns-zone-spf), [Zimbra](https://docs.ovhcloud.com/pl/guides/web-cloud/email-and-collaborative-solutions/zimbra/getting-started-zimbra), [OVH DKIM](https://docs.ovhcloud.com/pl/guides/web-cloud/domains/dns-zone-dkim). [Brevo authentication](https://help.brevo.com/hc/en-us/articles/12163873383186-Authenticate-your-domain-with-Brevo-Brevo-code-DKIM-DMARC) nie wymaga MX/SPF standardowego shared relay; aligned DKIM potwierdziła rzeczywista dostawa. Zaostrzenie p=none wymaga sprawdzenia wszystkich legalnych nadawców; nie dodawać zewnętrznego odbiorcy raportów bez decyzji.

### Odebrana skrzynka i pozostały transport

Odebrano webmail i odpowiedzi z contact@. [Klient OVH](https://docs.ovhcloud.com/en/guides/web-cloud/email-and-collaborative-solutions/zimbra/mail-apps): login pełny contact@, IMAP imap.mail.ovh.net:993 SSL/TLS, SMTP smtp.mail.ovh.net:465 SSL/TLS, hasło prywatne. Klienta IMAP/SMTP i send-as support/privacy nie testowano; odpowiedzi kanonicznie z contact@.

Przekazanie potwierdzonych kontaktów do R01, bez uruchamiania go: terms.operatorEmail, complaintEmail, withdrawalEmail → contact@patternly.it; privacy.privacyEmail → privacy@patternly.it; pomoc → support@patternly.it. Jedyne źródło config/public-legal.release.json; konsumentów i eksport sprawdzić w R01. Brak pozostałych danych prawnych nie unieważnia odbioru tych adresów.

### Odebrane przełączenie backendu

Właściciel osobno odpowiedział „Tak” na przełączenie dwóch pól backendu sandbox, przy tym samym obrazie, sekretach i obecnych tagach. Zgoda obejmowała konfigurację i ruch; nie kolejną wiadomość. Utworzono raz rewizję `patternly-backend-sandbox-domain-mail39-1016` z SMTP_FROM_EMAIL i SMTP_REPLY_TO = contact@patternly.it. FROM_NAME=Patternly, Brevo587 i wszystkie pozostałe zmienne/referencje sekretów zachowane. Obraz pozostaje dokładnie `europe-central2-docker.pkg.dev/patternly-app-sandbox/patternly/patternly-backend@sha256:df685f98c6f1572ca362ce440dbe9e93f5d7fd9865dca4585ac6e6a77f4dcd70`; bez nowego builda i bez adopcji nowszego kodu repozytorium.

Najpierw --no-traffic, potem Ready/readback exact2env, porównanie hashy wszystkich pozostałych env i konfiguracji runtime oraz GET /health i /ready z TLS verification. Do odczytu nowej rewizji dodano tylko krótkotrwały tag domain-mail39-check; niezależny design review zaakceptował ten szczegół. Tagi ios-1012/android-1008 ani ich mapowania nie były zmieniane. Niezależny gpt-6-luna high wykonał własny live gcloud read i potwierdził Ready, obraz i kontrakt przed promocją; HTTP200 potwierdził z receipts. Następnie usunięto wyłącznie nowy tag, odczytano stare100%/tagi i skierowano domyślny ruch na dokładną odebraną rewizję. Końcowy readback: Ready=True, latestCreated=latestReady,100% nowej rewizji, dokładnie2envdelta, reszta hashy zgodna, tylko2oryginalne tagi; domyślne /health200 i /ready200 z body zgodnym z baseline.

Pierwszy lokalny HTTPS probe Pythona zatrzymał brak lokalnego CA, przed wdrożeniem; zmieniono metodę na systemowy curl z cert verification (bez -k), który zakończył się poprawnie. Odczyt gcloud wymagał dostępu CLI do własnego katalogu konfiguracji; po wykonaniu z właściwym dostępem niezależny live QA powiódł się. Nie obniżono TLS ani bramek.

Granice: domyślny service URL korzysta z nowego nadawcy; URL-e tagowane ios-1012/android-1008 pozostają przy starych, niezmiennych rewizjach/Gmailu. Aktualny lokalny PUBLIC_ENVIRONMENT.apiOrigin wskazuje domyślny URL, smoke API jest lokalne; nie dowodzi to endpointu zainstalowanego binary. Odczyt /ready dotyczy zachowanego starszego obrazu (database/authentication/providerReader, bez contentPackages); nie odbiera aktualnego source/Premium/R04. Nie wykonywano backendowego testu wysyłki po zmianie ani pełnej macierzy ODK-E2E-086. Siedem wcześniejszych zgód wykorzystane, zero nowych wiadomości. Nie modyfikowano IAM, DNS, store settings, sekretów ani pinów aplikacji; nie wykonywano rollback.

Rollback przygotowany: skierować domyślny ruch na `patternly-backend-sandbox-ios-1012-4d8efbd=100`, zachowując obecne tagi. Wersjonowana procedura tego przełączenia (wykonana, nie ponawiać): gcloud run services update patternly-backend-sandbox --project=patternly-app-sandbox --region=europe-central2 --image=<dokładny powyższy digest> --update-env-vars=SMTP_FROM_EMAIL=contact@patternly.it,SMTP_REPLY_TO=contact@patternly.it --revision-suffix=domain-mail39-1016 --no-traffic --tag=domain-mail39-check; po readback/gates gcloud run services update-traffic tej usługi z --remove-tags=domain-mail39-check; potem --to-revisions=patternly-backend-sandbox-domain-mail39-1016=100. [Cloud Run update](https://docs.cloud.google.com/sdk/gcloud/reference/run/services/update), [ruch i tagi](https://docs.cloud.google.com/sdk/gcloud/reference/run/services/update-traffic). Każda mutacja tylko raz; ledger i readback chronią przed ślepym retry.

Korekta lokalnego residualu opisów: backend .env.example (Brevo587, placeholderlogin, contact@), docs/cloud-run-manual-deploy.md i operations.md; APP privacy.emailDeliveryProvider en/pl = Brevo SMTP w kanonicznym config/public-legal.release.json oraz zgodnej local fixture. Konsumenci privacyPolicy/eksport używają tej zmiennej; brak drugiego źródła wydaniowego. Pozostałe kontakty/dane prawne/placeholders i checkout=false zachowane dla R01, bez eksportu lub publikacji. Istniejący legalVariablesSchema.test.ts10/10PASS potwierdza schema, zgodność fixture/JSON, wybór runtime/CLI i fail-closed release. Nowszego backendowego źródła nie wdrażano, więc nie ponawiano całego CI dla starego serwowanego digestu.

Prywatne receipts0700/0600 w katalogu dowodów: brevo-cloudrun-before.json, brevo-cloudrun-deploy.json, brevo-cloudrun-candidate-check.json, brevo-cloudrun-independent-qa.json, brevo-cloudrun-tag-cleanup.json, brevo-cloudrun-promotion.json, brevo-cloudrun-final.json, brevo-cloudrun-final-independent-qa.json. Zawierają bezpieczne hashe/metadata i HTTP readback, bez wartości credentials. Oceny dopasowanie/prostota/kontrola ryzyka/utrzymywalność0,96/0,98/0,90/0,96, minimum0,90; niezależny review/QA Luna High. Finalny niezależny live readback konfiguracji/ruchu/HTTP oraz odbiór dokumentacji: PASS DOMAIN-MAIL-01/39 w opisanych granicach.

### Odebrana próba odbiór–odpowiedź —6/6, Brevo osobno

Zgoda na6wiadomości wykorzystana:3Gmail→contact/support/privacy wysłane14:19:27–36UTC; wszystkie Inbox Zimbra16:19Warsaw według zrzutu i potwierdzenia właściciela.3odpowiedzi contact@→ten sam Gmail dostarczone16:28:36–43Warsaw, INBOX/nonspam. Zgodne From/To/Delivered-To, thread i dokładne In-Reply-To oryginalnego Message-ID. Brak Reply-To — poprawny fallback Fromcontact@.

Każda odpowiedź: Authentication-Results mx.google.com SPFpass smtp.mailfrom=contact@patternly.it, DKIMpass d=patternly.it s=ovhmo-selector-1, DMARCpass header.from=patternly.it; SPF/DKIM aligned. Received potwierdza TLS1.3 OVH→Google, bez twierdzenia end-to-end. Niezależny Luna High przeczytał raw original/reply: PASS. Prywatne gmail-send-receipts.json/gmail-reply-headers.json, bez kopiowania ID/IP/nagłówków/zrzutu do repo. Inbound raw Zimbra nieodczytany; dowód to zrzut właściciela i powiązane odpowiedzi.

### Odebrana pojedyncza próba Brevo SMTP —1/1

Właściciel oddzielnie zatwierdził jedną wiadomość From Patternly <contact@patternly.it> do własnego lukasz.kurczab@gmail.com, Reply-To contact@, treść „Kontrolowany test dostawy Brevo dla Patternly”, bez innych odbiorców/załączników i bez zmiany backendu. Zgoda wykorzystana. Ledger sendInvocations=1, SMTP zaakceptowało odbiorcę, receipt zakończony15:10:29.900UTC; Gmail odebrał15:10:28UTC (17:10:28Warsaw) i pokazał dokładnie1wiadomość w INBOX, nonspam.

Rzeczywiste nagłówki mx.google.com: SPFpass smtp.mailfrom domeny hb.d.sender-sib.com, DKIMpass d=patternly.it s=brevo2, DMARCpass header.from=patternly.it. SPF nie jest aligned; aligned DKIM wystarczył dla DMARC. From/To/Delivered-To/Reply-To zgodne; brak CC/BCC. Niezależny Luna High porównał raw temat i Message-ID z ledgerem oraz nagłówki: PASS tej dostawy. Nie dowodzi handlerów aplikacji, regresji starego Gmail sendera ani pełnego ODK-E2E-086.

Wersjonowane narzędzie operacyjne: [probe-domain-mail-smtp.mjs](../../../../patternly-backend/scripts/probe-domain-mail-smtp.mjs). Domyślne wywołanie `node scripts/probe-domain-mail-smtp.mjs --evidence-dir /private/tmp/patternly-domain-mail39-1j5rw_73` tylko odczytuje konfigurację, bez sekretu/wysyłki. `--send` wykorzystano raz; nie uruchamiać go ponownie ani nie usuwać/przenosić ledgera w celu retry. Kod zachowano jako odtwarzalne źródło odebranej próby, nie trasę produktu. Jest przypięty do bazowej rewizji tej próby; po przełączeniu wykrycie zmiany konfiguracji jest oczekiwanym zatrzymaniem, nie powodem do nowej wysyłki. Narzędzie rezerwuje prywatny ledger przez wx przed odczytem hasła, używa requireTLS/minTLS1.2 i cert verification, nie loguje sekretów ani raw błędów; nie rozszerza zgody. Przy unknown najpierw readback, bez automatycznego retry.

Prywatne dowody w `/private/tmp/patternly-domain-mail39-1j5rw_73/` (0700, pliki0600): brevo-dns-before.json, brevo-dns-after.json, brevo-dns-corrected.json; brevo-transport-account-check.json; brevo-smtp-attempt.json; brevo-gmail-headers.json; brevo-backend-env-candidate.json (historyczne przygotowanie, zastąpione odebranym przełączeniem powyżej) oraz human6/6 powyżej. Zawierają dane runtime/ID; zachować poza repo. Snapshot DNS jest celowany, nie pełnym eksportem strefy. Hasło SMTP istniało tylko w pamięci procesu, nie w dowodach.

Odtwarzalne odczyty: whois -h whois.nic.it patternly.it; dig NS/MX/TXT, _dmarc TXT, exact4selektory CNAME i ich TXT cele na obuOVHNS/1.1.1.1/8.8.8.8. Nie zakładać propagacji po stałym czasie. Brevo read-only account/senders oraz panel Authenticated/Verified; Cloud Run describe filtrowany lokalnie do bezpiecznych pól. Nie drukować credentials/full env.

Oceny wariantu dopasowanie/prostota/kontrola ryzyka/utrzymywalność0,97/0,98/0,88/0,96 (min0,88). Probe0,96/0,90/0,90/0,92 (min0,90): jedno istniejące konto i sekret, jedno jawnie zatwierdzone send, bez zmiany produktu. Niezależny Luna High: PASS propozycji DNS, odczytu domain/sender, kodu probe oraz obu rzeczywistych wycinków dostawy. Wykonane node --check probe, backend npm run lint, workspace docs checker i diff-check PASS. Bez zmian produktu nie ponawiano całej suity; hosted CI, pełne usługi i wydanie nieodebrane.

## Cel i historyczne rozpoznanie z07.10.2026

Użytkownik ma znaleźć witrynę Patternly pod zatwierdzonym adresem i móc napisać na działający firmowy e-mail. Operator musi odbierać wiadomości oraz odpowiadać z tego adresu.

W `patternly/config/public-legal.release.json` adresy operatora, prywatności, reklamacji i odstąpienia są nadal niewypełnione. W `patternly-web/firebase.json` i `.firebaserc` wskazano Hosting `patternly-app-sandbox`; samo to nie potwierdza podłączenia firmowej domeny. Dotychczasowy plan wymagał podania kontaktów i odbioru SMTP, ale nie zawierał zadania utworzenia firmowej skrzynki.

Odczyt z 07.10.2026 potwierdził w usłudze Cloud Run `patternly-backend-sandbox` projektu `patternly-app-sandbox`: `SMTP_HOST=smtp-relay.brevo.com`, port 587, domena nadawcy i odpowiedzi `gmail.com`. W Secret Manager istnieje konfiguracja hasła SMTP; wartości sekretu nie odczytywano. To dowód skonfigurowanego transportu wysyłki Brevo, nie firmowej skrzynki ani udanej dostawy. Starsze instrukcje Google Workspace są rozbieżne z tym odczytem i wymagają korekty w zadaniu, jeśli opisują ten sam transport.

Publiczne zapytania o `patternly.it` do resolverów Cloudflare i Google oraz autorytatywnego `dns.nic.it` zwróciły `NXDOMAIN`: brak aktywnej delegacji DNS. Nie potwierdza to dostępności domeny do zakupu ani nie wyklucza nieaktywnego konta u dostawcy. Nie sprawdzono panelu rejestratora ani panelu skrzynek; nie znaleziono dowodu działającej firmowej skrzynki. Przed tworzeniem zasobów sprawdzić własność i istniejące konta. Nie wysłano wiadomości, nie kupiono usług i nie zmieniono konfiguracji.

## Ustalenia wymagane przed konfiguracją zewnętrzną

Właściciel16.10.2026 wybrał i autoryzował zakup domeny `patternly.it` na1rok z dołączoną Zimbra Starter, bez Google Workspace; Brevo pozostaje transportem aplikacji. Nie prosić ponownie o tę samą zgodę. Bieżące dowody i granice poszczególnych etapów są powyżej. Właściciel uzgodnił6wiadomości testowych;3wejściowe odebrano (zrzut właściciela),3odpowiedzi z nagłówkami Gmail PASS. Osobno autoryzowana1próba Brevo również wykorzystana i odebrana; nie ponawiać7wiadomości. Dane abonenta i rozliczeń uzupełniać w panelu operatora, bez domysłów. Nie kupować innej domeny ani płatnych dodatków.

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

## Przekazanie po odbiorze39

DOMAIN-MAIL-01 odebrane w powyższych granicach, nie ponawiać zakupu/aliasów/DNS/siedmiu maili/przełączenia. R01/40 otrzymuje rzeczywiste kontakty i ma własne dane/zgody/gates; nie został uruchomiony w39. Pełna macierz backendu i wydanie pozostają osobno. Jeśli ujawni się nowy konkretny defekt poczty, odczytać bieżący stan i wykorzystać prywatne dowody; żaden historyczny test nie daje zgody na kolejną wysyłkę.
