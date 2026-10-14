# Premium i RevenueCat — połączenie oraz pełny przebieg zakupu

Status: do wykonania. Źródło: prośba właściciela z 13.10.2026 o sprawdzenie Apple/Google i dodanie zadania integracji. Priorytet: prostota rozwoju i utrzymania przez jedną osobę. Kolejka i termin: [plan](../../PATTERNLY-WORKING-PLAN.md). Szersze ustalenia: [audyt](../../reports/solo-maintainability-audit-2026-10-13.md).

## Cel i granice

Połączyć istniejącą implementację z istniejącym projektem RevenueCat i domknąć zakup, przywrócenie, zarządzanie oraz utratę dostępu. Bieżący kod oczekuje jednego miesięcznego produktu bez triala; finalną politykę potwierdzić z decyzją właściciela i rzeczywistym sklepem w istniejącym R01/ODK, bez samodzielnego dodawania ofert. Zachować kanoniczne uprawnienie `premium`, backend jako autorytet dostępu i obecną bibliotekę `react-native-purchases`. Nie dodawać drugiego systemu płatności ani równoległego mechanizmu potwierdzania transakcji.

**PREMIUM-RC-01 obejmuje iOS przed dopuszczeniem oferty Premium. PREMIUM-RC-02 obejmuje Google Play po pierwszym wydaniu iOS**, zgodnie z zatwierdzonym podziałem. W tym audycie odczytano źródła, oficjalne wymagania i konfigurację RevenueCat; nie zmieniano dostawców, nie wykonywano zakupów i nie włączano checkoutu. Nie jest to potwierdzenie zgodności wydania przez sklepy.

## Stan potwierdzony 13.10.2026

| Obszar | Dowód i znaczenie |
| --- | --- |
| Projekt RevenueCat | Istnieje Patternly `proj8ae78267`. Wykorzystać go; nie tworzyć nowego projektu. |
| iOS | App `app7b06e9a4c1`, bundle `com.lkurczab.patternly`; produkt `com.lkurczab.patternly.premium.monthly` jest w katalogu RC i należy do entitlement `premium`. Nie potwierdzono jego dostępności/akceptacji w App Store Connect. |
| Offering | Bieżący `default` zawiera `$rc_monthly` z produktem iOS oraz Test Store. Test Store ma też produkt roczny i osobne `patternly_pro`; nie dowodzi zgodności docelowego uprawnienia `premium`. Nie usuwać tych zasobów bez ustalenia użycia. |
| Klucze sklepu | API RC zwróciło `app_store_connect_api_key_configured=false` i `subscription_key_configured=false`. Ustalić i uzupełnić zestaw wymagany przez wybrany StoreKit/SDK i funkcje produktu; te flagi same nie dowodzą, że każdy zakup iOS jest niemożliwy. Nie odczytywano sekretów. |
| Webhook | Lista integracji webhook w tym projekcie RC jest pusta. Backend ma trasę i walidację zdarzeń, lecz wymaga rzeczywistego podłączenia. Nie sprawdzono wdrożonych zmiennych backendu. |
| Google Play | Brak aplikacji Google Play w projekcie RC. Adapter, konfiguracja i copy aplikacji świadomie obsługują obecnie tylko iOS. Backend wybiera jeden app/product ID; dodanie Androida wymaga również zmiany kontraktu. |
| Checkout | `config/public-legal.release.json` ma `premiumCheckoutEnabled=false`; występują jeszcze wartości do uzupełnienia. Jest to zabezpieczenie, nie ukończona integracja. |

Odczyty: [aplikacje RC](https://app.revenuecat.com/projects/8ae78267/apps), [produkty](https://app.revenuecat.com/projects/8ae78267/product-catalog/products), [uprawnienia](https://app.revenuecat.com/projects/8ae78267/product-catalog/entitlements), [oferty](https://app.revenuecat.com/projects/8ae78267/product-catalog/offerings), [webhooki](https://app.revenuecat.com/projects/8ae78267/integrations/webhooks). To snapshot odczytu administracyjnego, nie dowód transakcji.

## Wymagania sklepów a stan aplikacji

| Granica | Stan i pozostała praca |
| --- | --- |
| Oferta przed zakupem | Ekran pokazuje cenę ze sklepu, okres miesięczny, odnowienie i brak triala; ma restore/manage. Sprawdzić finalny zakres usługi, pełną cenę, lokalizacje i widoczność istotnych warunków przed potwierdzeniem. Apple wymaga jasnego opisu subskrypcji oraz dostępu do Terms/Privacy w aplikacji i metadanych; proponowana mała poprawka to bezpośrednie wejścia do istniejących dokumentów z ekranu zakupu. Brak takich wejść na tym ekranie nie oznacza braku dokumentów w całej aplikacji. [Apple subscriptions](https://developer.apple.com/app-store/subscriptions/) |
| Płatność oczekująca | Adapter rozpoznaje anulowanie, ale pozostałe błędy sprowadza do `failure`; nie ma stanu `pending`. RC opisuje `PAYMENT_PENDING_ERROR` dla wymaganej dodatkowej zgody/akcji. Pokazać oczekiwanie bez sukcesu i bez fałszywego komunikatu o definitywnej porażce. [RevenueCat errors](https://www.revenuecat.com/docs/test-and-launch/errors) |
| Przywrócenie i tożsamość | Restore istnieje, lecz wymaga dowodu rzeczywistego same-account restore oraz zgodności polityki aliasów/transferu z backendem. `original_app_user_id === userId` może odrzucić konto obsługiwane przez alias/transfer. To ryzyko warunkowe, zależne od wybranej polityki RC; nie usuwać kontroli tożsamości bez zastępczego bezpiecznego kontraktu. [Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/), [RC identity](https://www.revenuecat.com/docs/customers/identifying-customers) |
| Google Play | W drugim etapie zapewnić jasną cenę, częstotliwość, automatyczne odnowienie i łatwe zarządzanie/anulowanie; nie przenosić copy Apple. Istotne warunki muszą być widoczne bez dodatkowej akcji. [Google subscriptions policy](https://support.google.com/googleplay/android-developer/answer/9900533?hl=en) |
| Zakończenie transakcji | Zachować odpowiedzialność RC SDK za finish/acknowledgement w standardowym trybie. Nie nadawać dostępu dla `PENDING`; nie implementować drugiego ownera acknowledgement. Zweryfikować to w rzeczywistym sandboxie. [RC purchases](https://www.revenuecat.com/docs/getting-started/making-purchases), [Google Billing integration](https://developer.android.com/google/play/billing/integrate) |

## PREMIUM-RC-01 — iOS

### 1. Jedna konfiguracja projektu, sklepu i backendu

- Sporządzić jedną tabelę mapowania: bundle/RC app ID, store SKU, entitlement `premium`, offering/package, środowisko SANDBOX/PRODUCTION oraz właściciel sekretów. Oddzielić publiczny klucz SDK od sekretnego klucza odczytu i webhooka. Nigdy nie zapisywać sekretów w repo ani raporcie.
- W App Store Connect sprawdzić rzeczywisty miesięczny produkt, subscription group, ceny/regiony, dostępność, wymagane umowy oraz metadane. W RC uzupełnić wymagane poświadczenia i powiadomienia sklepu według aktualnej dokumentacji. Nie uznawać samej pozycji w katalogu RC za produkt gotowy w sklepie.
- Podłączyć istniejący backendowy webhook, autoryzację i dokładne oczekiwane identyfikatory/środowisko. Potwierdzić rzeczywisty odczyt klienta RC przez `/v1/entitlements`; brak read key nie może być maskowany lokalnym przyznaniem dostępu.
- Ustalić, czy Test Store będzie używany do wcześniejszych prób. Jeśli tak, jego mapowanie ma odzwierciedlać docelowy entitlement w izolowanym środowisku. Nie dopuścić Test Store jako produkcyjnego produktu; nie usuwać `patternly_pro` ani historii klientów automatycznie.

### 2. Domknięcie przepływu i tożsamości

- Dodać jawne `pending/deferred`, anulowanie i niepewny wynik; ponowne sprawdzenie dostępu po powrocie aplikacji/provider update. Nie ponawiać automatycznie zakupu przy niepewnym wyniku. SDK success nadal prowadzi do odczytu backendu, nie bezpośredniego grantu.
- Przed zmianą ustalić zachowanie logout/switch, same-account restore oraz restore na innym koncie Patternly. Obecnie SDK pozostaje skonfigurowane do kolejnego `logIn`; nie dodawać bezrefleksyjnie `logOut`, który zmienia model anonimowej tożsamości. Zgrać politykę RC z readerem, webhookiem i cache, zachowując UID/generację/lease i odrzucanie wyników starego konta.
- Zapewnić restore/manage również wtedy, gdy czasowo wyłączono przyjmowanie nowych zakupów, o ile produkt jest już sprzedawany. Nie uzależniać obsługi obecnego subskrybenta od dostępności nowej oferty. Sprawdzić zachowanie dla aktywnego Premium i braku management URL; bez pozornego sukcesu lub zbędnego drugiego zakupu.
- Uzupełnić finalne informacje o usłudze, lokalizacje i wejścia do istniejących Terms/Privacy. Utrzymać cenę pochodzącą ze sklepu; nie kodować jednej kwoty w UI. Zachować obowiązujące ograniczenia wieku/konta i zgodę przed zakupem z ODK-E2E-119.

### 3. Potwierdzenie zakupu i dostarczenie funkcji

- Przeprojektować wąsko korelację zgody/próby z transakcją odroczoną. `modules/users/store.ts` zapisuje aktywną próbę z 15-minutowym oknem; `modules/billing/revenuecatWebhookStore.ts:100–119` tworzy receipt tylko, gdy `purchased_at_ms` mieści się w tym oknie i pasuje niezużyta próba. Zakup faktycznie zatwierdzony później może nadać dostęp bez wymaganego potwierdzenia. Samo późne dostarczenie webhooka z wcześniejszym czasem zakupu nie dowodzi tego błędu.
- Zachować trwałą, jednoznaczną zgodę dla konkretnej transakcji i jej właściciela także przy kolejnej próbie, restarcie i zmianie konta. Zmiana konta nie przenosi zgody na nowego użytkownika; ewentualny transfer wymaga jawnej polityki i ponownej weryfikacji tożsamości. Ustalić ograniczoną retencję i rozstrzyganie niepowiązanych zdarzeń; nie rozwiązywać problemu bezterminową zgodą wielokrotnego użytku ani wyłącznie wydłużeniem timeoutu. Wymaganie maila pochodzi z istniejącego produktu/ODK, nie jest tu przedstawiane jako nowy obowiązek sklepowy.
- Naprawić M10 z audytu: niepewny skutek SMTP i finalizacja tej samej próby. Jedna transakcja ma jeden logiczny receipt; nie obiecywać transportu SMTP exactly-once. Nieznany wynik musi być rozstrzygany bez automatycznej ponownej wysyłki.
- Domknąć M11 w istniejącym zakresie pakietów: realny transport i dostęp do kupionej treści przed dopuszczeniem oferty. Wybrać jeden kontrakt zgodny z dokumentacją albo jawnie uzgodnić jej korektę; nie budować dwóch równoległych ścieżek pobierania.

### Zakres plików

APP: `src/infrastructure/purchases/index.ts` i testy; `src/features/premium/PremiumPurchaseScreen.tsx`, `premiumEntitlement.ts` i testy; odpowiednie granice `src/application/account/AccountSessionProvider.tsx` / `premiumRefreshQueue.ts`; locale settings; `app.config.js`; `config/public-legal.release.json` oraz istniejące źródło/generator konfiguracji prawnej. Sprawdzić aktualne ścieżki i nie edytować wygenerowanych kopii niezależnie.

BACKEND: `src/infrastructure/revenuecat/client.ts`, `src/modules/billing/revenuecatWebhookStore.ts`, `revenuecatWebhook.ts`, `src/modules/users/store.ts`, odpowiednie trasy `src/app.ts`, składanie `src/index.ts`, `src/config/environment.ts` (ustalić aktualną lokalizację przed zmianą), istniejące testy RevenueCat/receipt oraz konfiguracja wdrożenia. M11 korzysta z istniejących modułów content packages/storage. WEB: tylko finalne dokumenty/linki z R01/R02, bez nowej ścieżki płatności webowej.

### Kryteria odbioru i weryfikacja

1. Dashboard, build i backend mają zgodne identyfikatory. Zły app/product/entitlement/środowisko nie nadaje dostępu ani nie tworzy potwierdzenia zakupu. Autorytetem jest świeża decyzja backendu z właściwą datą i kontem.
2. Success, cancel, pending, failure, restore i manage mają prawdziwy, czytelny stan. Pending nie daje dostępu; późniejsze zatwierdzenie odświeża go bez nowego zakupu. Przerwanie/logowanie innego konta nie przypisuje starego wyniku nowemu użytkownikowi.
3. Zakup z czasem transakcji ponad 15 minut po potwierdzeniu ma jednoznaczną korelację lub jawne rozstrzygnięcie operacyjne; nie ginie wymagane potwierdzenie. Duplikaty i zmiana kolejności zdarzeń nie tworzą nowych logicznych receiptów. Niepewny SMTP nie staje się bezwarunkowym retry.
4. Same-account restore działa. Zachowanie cross-account restore/transfer odpowiada jawnej polityce, bez niezamierzonego równoległego dostępu dwóch kont. Powrót po anulowaniu zachowuje opłacony okres; wygaśnięcie/refund/revoke odbiera nowy dostęp zgodnie z kontraktem, bez niszczenia legalnie rozpoczętej sesji.
5. Finalna oferta i dokumenty odpowiadają sklepowi i R01. Użytkownik uzyskuje obiecaną treść; katalog/checkout nie są włączane zamiast uzupełnienia backendu i pakietów.

Weryfikacja lokalna: istniejące testy purchases, premiumEntitlement, premiumRefreshQueue, RevenueCat client/webhook; nowe przypadki pending, alias/transfer według decyzji, korelacja po oknie i niepewna finalizacja receipt. Emulator tylko dla potrzebnych transakcji Firestore/races; syntetyczne dane nie potwierdzają payloadów ani działania sklepu.

Odbiór rzeczywistych usług pozostaje w **ODK-E2E-085/119 oraz fragmencie receipt ODK-E2E-086 / R04**: zakup, odroczenie i późniejsza decyzja, restore, odnowienie, anulowanie, grace/hold, expiry, refund/revoke, duplikaty/kolejność, przełączenie konta i zatwierdzona polityka transferu. Użyć tego samego kandydata i kontrolowanych kont, bez mnożenia urządzeń; zachować dowody zgodne z rzeczywistym SDK i zdarzeniami. Nie kopiować macierzy jako drugiej bramki. Test Store ani lokalne testy nie zastępują App Store sandbox. Publikacja pozostaje R07/R08, finalne wartości R01 i publiczne adresy R02.

## PREMIUM-RC-02 — Google Play po iOS

Rozszerzyć to samo rozwiązanie przed wydaniem Premium na Androidzie. Najpierw ustalić dokładny produkt/base plan i kontrakt payloadów Google. Podłączyć Google Play do istniejącego projektu RC, poświadczenia z minimalnymi wymaganymi uprawnieniami, powiadomienia sklepu i Android SDK key. Zweryfikować aktualne wymagania Billing/target SDK w momencie realizacji.

W kodzie zastąpić pojedynczy globalny app/product ID niewielką jawną mapą zatwierdzonych kombinacji sklepu, aplikacji i produktu, nadal dla jednego entitlement `premium`. Uwzględnić reader, webhook, cache konta, platformowy adapter i copy. Nie przyjmować dowolnych SKU i nie tworzyć drugiego autorytetu Premium. Dokładny projekt tej zmiany wymaga odrębnego review kontraktu po poznaniu rzeczywistych payloadów.

Odebrać Google license tester/sandbox i odpowiednie przypadki R06/ODK: purchase/pending, acknowledge przez RC, restore/identity, renew/cancel/expiry, grace/account hold, pause/resume oraz refund/revoke. Product replacement tylko jeśli wprowadzony do oferty; bez dodawania upgrade/downgrade dla produktu z jednym planem. Istotne warunki i link zarządzania odpowiadają Google Play. Do realizacji Android pozostaje jawnie niedostępny dla zakupu; nie deklarować gotowej zgodności obu sklepów.

## Ryzyka, decyzje i prostota

Przed implementacją rozstrzygnąć politykę restore/transfer, trwałą korelację odroczonej transakcji oraz pojedynczy transport pakietów. To decyzje kontraktu/tożsamości/trwałości wymagające niezależnego review; obecny dokument nie zatwierdza usunięcia kontroli konta, migracji danych ani czyszczenia zasobów RC. Najpierw wykorzystać już podjęte decyzje i rzeczywiste zależności. Brak finalnych danych właściciela nie blokuje niezależnych poprawek kodu.

Ocena podejścia PREMIUM-RC-01: dopasowanie do celu/architektury **0,98**, prostota **0,87**, kontrola ryzyka **0,83**, utrzymywalność **0,92**, minimum **0,83**. Pozostaje istniejący SDK i jeden autorytet; ryzykiem są opóźnione transakcje i tożsamość, dlatego wymagają decyzji i konkretnych testów. Odroczenie PREMIUM-RC-02: **0,96 / 0,93 / 0,88 / 0,91**, minimum **0,88**; zachowuje zatwierdzoną kolejność i unika przedwczesnej przebudowy iOS. To ocena podziału, nie jeszcze projektu wielosklepowego backendu.

Zadanie jest ukończone, gdy odpowiedni etap spełnia powyższe kryteria i ma dowody w istniejących odbiorach usług. Wykonane zakresy usuwać z kolejki zgodnie z jej zasadami; nie pozostawiać drugiej listy statusów w tym dokumencie.

Niezależny review Luna High 13.10: podział i zakres PASS, minimum ocen **0,85**. Uwzględniono doprecyzowanie bieżącej polityki triala oraz związania zgody z właścicielem. Review dotyczy planu i granic źródłowych; nie zastępuje przyszłego projektu szczegółowych kontraktów ani odbioru usług.

## Wskazówka do kontynuacji

Przeczytaj ten dokument, plan i bieżący kod/konfigurację czterech repo. Ponownie sprawdź tylko zmienione lub niezweryfikowane mapowania RC/Store; zachowaj cudze WIP i aktywny QLE. Najpierw zamknij decyzje tożsamości i korelacji wraz z niezależnym review, następnie realizuj najmniejsze spójne zakresy PREMIUM-RC-01. Usuń zastąpione ścieżki po kontroli odbiorców. Zmiany dostawców, kontrolowane zakupy/maile i publikacja mają mieć konkretny autoryzowany zakres; nie pytaj ponownie o już udzieloną zgodę. Nie traktuj wpisania kluczy ani zielonych unit testów jako zakończenia integracji.
