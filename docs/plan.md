---
title: Patternly — model komercyjny i plan implementacji
status: ACTIVE_RECONCILIATION
audit_date: 2026-07-19
application_audited_sha: 84bbfd0dca154ef85dc7d0853665f9f8f5ffab67
content_audited_sha: b424faa6d8c7209acb51ac23af812d08c31842dc
active_next_task: S3-CLOSURE-EVIDENCE-02
---

# Patternly — model komercyjny i precyzyjny plan implementacji

## 0. Kontrola wykonania po weryfikacji repozytoriów

### Cel strumienia pracy

Doprowadzić Patternly od działającego, lokalnego runtime'u Algorithms do
komercyjnego produktu wielotrackowego bez utrzymywania równoległych kontraktów,
pustych tracków, ukrytych fallbacków ani niezweryfikowanych deklaracji jakości
treści.

### Nienegocjowalna zasada cutoveru

Każda zmiana ustanawia jeden canonicalny owner i jedną wykonywalną ścieżkę.
Zabronione są:

- fallbacki i silent defaults;
- translatory starych modeli, ID, rekordów lub payloadów;
- aliasy i mapowania kompatybilności;
- równoległe stare/nowe wersje runtime'u, repository, route'u, stanu lub schema;
- odczyt starego formatu „na wszelki wypadek”;
- ukrywanie błędu przez substitute content, substitute track albo domyślny mode;
- przechwytywanie błędu w celu pokazania fikcyjnego sukcesu;
- metadata, feature flags lub filtry służące do obchodzenia niekompletnej
  implementacji.

Nieznany, stary, niekompletny albo niespójny stan kończy się typed error,
blocking state lub jawnie niedostępną akcją. Cutover usuwa zastępowaną ścieżkę,
jej importy, route'y, testy i dokumentację w tym samym spójnym zadaniu.

Dozwolone pozostaje wersjonowanie jednego kanonicznego, immutable artifactu
treści, manifestu, profilu egzaminu albo kontraktu danych. Numer wersji służy
identyfikacji i walidacji dokładnego wejścia; nie uprawnia do runtime translatora
ani obsługi dwóch autorytatywnych modeli.

### Zakres tej rewizji

Plan został sprawdzony względem aktualnego kodu, testów, raportów Stage 3,
kanonicznych dokumentów `00`–`13` i `15`–`17` oraz repozytorium
`patternly-content`. Graphify nie był dostępny; nie był potrzebny do ustalenia
poniższych faktów, ponieważ zależności potwierdzono bezpośrednio w źródłach.

Sekcje 1–8 opisują hipotezę produktu komercyjnego. Nie są automatycznie zgodą na
zmianę istniejących kontraktów. Sekcja 9 pozostaje backlogiem kierunkowym, ale
zadanie wolno rozpocząć dopiero wtedy, gdy ma status `planned` albo `partial`,
nie ma niespełnionej zależności `blocking` i posiada kompletny pakiet odbioru.

### Potwierdzony stan

| Obszar | Status | Dowód i konsekwencja |
| --- | --- | --- |
| Kernel, MMKV, journal i recovery | `done` | `recovery:check` i typecheck przechodzą; testy trwałości, recovery oraz ownership są obecne. Nie planować ponownej implementacji. |
| Algorithms runtime i izolacja architektury | `done` | Bieżące testy potwierdzają timer lifecycle, exactly-once expiry, durable projections i brak importów repository z presentation/track semantics. |
| Algorithms artifact `algorithms-core-0002` | `partial` | Artifact jest technicznie przypięty do content SHA i przechodzi kontrakty. Faktyczna odpowiedzialna recenzja jakości pozostaje osobną decyzją/evidencją. |
| Algorithms Stage 3 visual/native closure | `partial` | Istnieją iOS captures oraz zielony CI, ale brakuje pełnego P/S packetu, Androida, VoiceOver/TalkBack, large type, reduced motion i zatwierdzonego porównania. |
| Certification | `partial` | Audit P6 istnieje. `cloud-certification` i stare ekrany są osiągalnymi, jawnie niedostępnymi pozostałościami; canonicalny runtime i artifact nie istnieją. |
| Model subskrypcji `Focus` / `Multi-Track` | `unknown / needs evidence` | Jest spójną hipotezą produktu, ale repo nie zawiera entitlement contractu, danych cenowych ani potwierdzenia konfiguracji sklepów. |
| Lokalizacja `en` / `pl_full` / `pl_partial` | `planned` | Brak modeli domenowych i katalogu UI. Kontrakt jest wystarczająco konkretny do refinementu, lecz nie do implementacji przed realignmentem dokumentów. |
| Billing, zdalna dystrybucja i telemetria | `blocking` | Obowiązujące docs zezwalają obecnie na lokalny, bundled-only produkt i wymagają osobnego privacy/security contractu przed SDK lub transmisją. |
| Automatyczne dopuszczanie treści bez odpowiedzialnej recenzji | `blocking` | Kanoniczne docs i publisher wymagają human sign-off; testy `patternly-content` egzekwują dokładne approval records. Sam evaluator nie jest dowodem jakości pedagogicznej ani odpowiedzialności release. |
| Portfolio scaffolds dla niegotowych tracków | `blocking` | `docs/10-roadmap.md` i instrukcje repo zabraniają pustych runtime'ów, taxonomii i przyszłych placeholderów. Nie tworzyć katalogów tracków bez kompletnego, wykonywalnego zakresu. |

### Sprzeczności wymagające korekty przed P0

1. **Automatyzacja nie może sama sobie nadać approval.** Pipeline może tworzyć
   deterministyczne evidence i blokować release, ale finalna polityka
   odpowiedzialności za jakość treści musi zostać jawnie zatwierdzona. Do tego
   czasu nie usuwamy istniejącego human-review contractu i nie zmieniamy schema
   approval.
2. **Portfolio nie może być zbiorem pustych planów tracków.** Należy rozszerzać
   istniejący canonical path `patternly-content/config/tracks`, a nowy track
   dodawać dopiero z rzeczywistym specem, source policy i testami. Nie tworzymy
   `portfolio/tracks/*` jako drugiego systemu ani plików zapowiadających brak
   implementacji.
3. **`announced` nie jest stanem runtime'u.** Discovery może pokazywać
   niedostępną ofertę tylko jako świadomie zaprojektowaną powierzchnię produktu,
   bez rejestracji runtime'u i bez pustego contentu. Decyzja o obecności takiej
   powierzchni wymaga kryterium wartości i designu; nie jest warunkiem
   architektury katalogu.
4. **RevenueCat, remote content i analytics zmieniają privacy boundary.** Najpierw
   powstaje zatwierdzony contract danych, błędów i retencji; dopiero później
   adapter SDK. Nie dodajemy SDK jako sposobu odkrywania domeny.
5. **P0 jest zbyt duże.** Jednoczesna zmiana siedemnastu dokumentów bez
   rozstrzygnięcia powyższych decyzji stworzyłaby rozproszony, sprzeczny kontrakt.

### Aktywna kolejność zadań i dalszych epików

Tylko pierwsze dwa wiersze są bounded tasks. Wiersze 3–16 są epikami
zależnościowymi i nie są implementation-ready; przed rozpoczęciem każdy musi
zostać rozbity na osobne pakiety z celem, non-goals, acceptance, verification,
evidence, ryzykiem i report target.

| Kolejność | Zadanie | Status | Zależność |
| ---: | --- | --- | --- |
| 1 | `S3-CLOSURE-EVIDENCE-02` | `partial` | Brak zależności produktowej; wymaga natywnych środowisk i pełnego evidence. |
| 2 | `COMMERCIAL-CONTRACT-DECISIONS-01` | `planned` | Decyzje właściciela produktu dotyczące review authority, announced surfaces, tierów i zakresu telemetrii. |
| 3 | `PRODUCT-CONTRACT-REALIGN-01` | `blocking` | Start po `COMMERCIAL-CONTRACT-DECISIONS-01`; obejmuje dokumenty, nie kod. |
| 4 | `PORTFOLIO-CONTRACT-CUTOVER-01` | `blocking` | Start po realignmencie; rozszerza jeden istniejący track-config path, nie tworzy drugiego katalogu. |
| 5 | `LOCALIZATION-DOMAIN-01` | `blocking` | Start po realignmencie i finalnym language policy. |
| 6 | `NETWORK-PRIVACY-CONTRACT-01` | `blocking` | Warunek dla billing/content delivery/telemetry. |
| 7 | `ENTITLEMENT-DOMAIN-01` | `blocking` | Wymaga finalnej semantyki tierów, slotów, expiry i offline grace. |
| 8 | `BILLING-ADAPTER-01` | `blocking` | Start dopiero po domenie entitlementów i privacy contract; wybór SDK jest decyzją adaptera. |
| 9 | `SIGNED-CONTENT-DELIVERY-01` | `blocking` | Start po network/privacy contract i portfolio contract. |
| 10 | `LOCALIZATION-RUNTIME-AND-UI-01` | `blocking` | Start po domenie lokalizacji; jeden kompletny wariant bez fallbacku. |
| 11 | `PRODUCT-TELEMETRY-01` | `blocking` | Start po zatwierdzonym allowlist, retencji, opt-out i procesorze. |
| 12 | `CONTENT-EVIDENCE-AUTOMATION-01` | `blocking` | Automatyzuje evidence i gate'y; nie deklaruje własnej jakości ani approval authority. |
| 13 | `CERTIFICATION-CANONICAL-CUTOVER-01` | `blocking` | Wymaga zamkniętego Stage 3, finalnego GCP specu, profilu egzaminu, contentu i designu. |
| 14 | `COMMERCIAL-SURFACES-AND-QA-01` | `blocking` | Integruje portfolio, języki, entitlementy, billing i download dopiero po ich niezależnej weryfikacji. |
| 15 | `PRODUCTION-CONTENT-EXPANSION-01` | `blocking` | Authoring zaczyna się dopiero po finalnych kontraktach, bez pustych banków i bez częściowej aktywacji. |
| 16 | `SUBSCRIPTION-RELEASE-CLOSURE-01` | `blocking` | Końcowy gate iOS/Android, store, privacy, content, accessibility i CI. |

Zadania P2–P27 niżej są materiałem wejściowym dla powyższych pakietów. Ich
nazwy lub zakres nie stanowią osobnej aktywnej kolejki i muszą być scalane z
jednym canonicalnym taskiem z tej tabeli.

### Pierwszy pakiet wykonawczy — `S3-CLOSURE-EVIDENCE-02`

**Cel:** zamknąć ostatni niezweryfikowany gate istniejącego Algorithms Stage 3,
zanim nowy model komercyjny zmieni runtime, nawigację lub powierzchnie produktu.

**Zakres:**

- zinwentaryzować realne captures P-01…P-15 i S-01…S-29;
- usunąć duplikaty lub niekanoniczne ścieżki screenshotów dopiero po
  potwierdzeniu, że nie są jedynym dowodem;
- uruchomić bounded Maestro flows na iOS dla brakujących stanów;
- uruchomić krytyczne stany na Androidzie;
- wykonać VoiceOver/TalkBack, standard/large text, reduced motion, focus order,
  touch targets i ordering controls;
- porównać wyniki z zatwierdzonym packetem i uzupełnić jeden raport closure;
- potwierdzić zielony CI dla dokładnego SHA.

**Poza zakresem:** runtime semantics, persistence, scoring, pytania, billing,
lokalizacja, telemetryka, portfolio oraz Certification.

**Wejścia:**

- `audit/algorithms-ui/s3-audit-evidence-rerun.md`;
- `audit/algorithms-ui/p4-visual-qa-report.md`;
- `.audit/ux-ui/maestro/flows/algorithms-stage3-ios-states/`;
- `.audit/ux-ui/maestro/flows/algorithms-stage3-harness.android.yaml`;
- `docs/audits/ux-ui/algorithms-stage3-visual-harness-v1/`;
- approved Algorithms Stage 3 design packet.

**Bieżący inventory:** fixture isolation i state assignment przechodzą. W
lokalnych artifacts istnieją kandydackie iOS captures P-01…P-15 oraz S-01,
S-09, S-16 i S-29. Raport akceptuje obecnie tylko P-01…P-12. Część plików
P-13…P-15 i S-* znajduje się pod omyłkowym `screenshots/screenshots/`; do czasu
porównania i zapisania metadata nie wolno uznać ich za accepted ani usuwać.

**Acceptance criteria:**

1. Każdy stan P-01…P-15 i S-01…S-29 ma jeden zaakceptowany screenshot,
   platformę, urządzenie, ustawienia dostępności i exact app/content SHA.
2. Android ma evidence co najmniej dla wszystkich stanów krytycznych wskazanych
   w packetcie; brak urządzenia jest blockerem, nie `deferred`.
3. VoiceOver i TalkBack mają zapis kolejności i treści kluczowych ogłoszeń.
4. Large text i reduced motion nie zasłaniają treści ani akcji i nie tworzą
   nieosiągalnych kontrolek.
5. Audit host pozostaje read-only, korzysta z realnego przypiętego artifactu i
   nie uzyskuje production import edge ani MMKV write path.
6. Raport closure rozstrzyga każdą różnicę względem approved packetu jako PASS
   albo blocker; nie używa zbiorczego „mostly complete”.
7. `qa:static`, audit fixture tests, content boundary i CI są zielone dla
   czystego checkoutu exact SHA.

**Weryfikacja:** bounded Maestro flows, natywne accessibility checks,
`npm run audit:algorithms-ui:fixtures`, `npm run typecheck`,
`npm run validate:content-boundary`, clean-checkout `npm run qa:static` i CI.

Bieżący wynik przygotowawczy: audit fixture tests `2/2 PASS`, content boundary
`PASS`, recovery inventory `PASS`, typecheck `PASS`; pełny lokalny `qa:static`
wykonał `218/219 PASS`, a jedyny test został poprawnie zatrzymany przez
`DIRTY_INTEGRATION_INPUT`, ponieważ plan i Android flow są niezacommitowane.
`patternly-content` ma `32/32 PASS`.

**Wymagany dowód:** screenshots, device/settings metadata, screen-reader notes,
comparison table, command results i link/ID zielonego CI w jednym raporcie.

**Ryzyka:** brak Android targetu; istniejące lokalne, ignorowane screenshots mogą
nie odpowiadać raportowi; niezacommitowana zmiana Android flow należy do
bieżącego worktree i nie może zostać utracona; pełny `qa:static` lokalnie
odrzuca brudny checkout zgodnie z kontraktem.

**Report target:** zaktualizowany
`audit/algorithms-ui/s3-audit-evidence-rerun.md` oraz decyzja Stage 3 w tym
pliku. Po PASS zakończone podzadania Stage 3 są usuwane z aktywnego planu.

### Drugi pakiet wykonawczy — `COMMERCIAL-CONTRACT-DECISIONS-01`

**Cel:** zamknąć decyzje, bez których realignment kanonicznych dokumentów
musiałby zgadywać odpowiedzialność, zakres danych lub reprezentację niegotowej
oferty.

**Zakres:** zapisać finalną decyzję dla: (1) odpowiedzialnej release authority
dla treści i roli automatycznych evaluatorów, (2) obecności lub braku kart
`announced`, (3) tierów `Focus`/`Multi-Track`, limitów i statusu cen jako
hipotezy lub decyzji, (4) klas ruchu sieciowego, procesorów, retencji i opt-out,
(5) kolejności privacy contract względem wyboru billing/analytics SDK.

**Poza zakresem:** zmiany aplikacji, dodawanie SDK, tworzenie store products,
nowe tracki, pytania, schema migration oraz przepisywanie wszystkich docs.

**Wejścia:** sekcje 1–8 tego planu; `docs/00-overview.md`,
`07-content-guidelines.md`, `08-storage-and-offline.md`,
`09-security-and-privacy.md`, `10-roadmap.md`, `11-implementation-guidelines.md`,
`12-testing-strategy.md`; publisher i testy `patternly-content`; wymagania App
Store/Google Play i wybranych procesorów zweryfikowane w aktualnych źródłach
przed finalną decyzją.

**Acceptance criteria:** każda z pięciu decyzji ma ownera, uzasadnienie,
odrzucone alternatywy i mierzalną konsekwencję dla kontraktu; brak zapisu
pozwalającego evaluatorowi zatwierdzić własną pracę; brak pustych tracków lub
metadanych ukrywających brak implementacji; brak SDK bez jawnego data contract;
ceny i metryki są oznaczone jako hipotezy, dopóki nie mają evidence.

**Weryfikacja:** ręczna tabela sprzeczności przed/po, `rg` dla human approval,
network, telemetry, bundled/remote content, announced/hidden i subscription;
sprawdzenie, że wynik nie zmienia kodu ani schema.

**Wymagany dowód:** decision table w tym pliku, linki do aktualnych źródeł dla
zewnętrznych wymagań, lista dokumentów do zmiany w P0 oraz lista założeń, które
pozostają `unknown / needs evidence`.

**Ryzyka:** przedwczesne utrwalenie cen; pomylenie technicznego gate'u z oceną
pedagogiczną; zaprojektowanie katalogu wokół niegotowych tracków; wybór
procesora przed ustaleniem minimalnego zbioru danych.

**Report target:** sekcja decyzji w `docs/plan.md`. Po akceptacji P0 otrzymuje
konkretną listę zmian i przechodzi z `blocking` do `planned`.

## 1. Hipotezy komercyjne wymagające decyzji

Proponowane założenia:

- hybrydowy katalog ścieżek;
- English-first;
- Polish jako `full` albo `partial`;
- w trybie `partial` pytania certyfikacyjne pozostają w języku odpowiadającym realnemu egzaminowi;
- płatność subskrypcyjna zależna od liczby jednocześnie aktywnych ścieżek;
- bezpłatny pierwszy node każdej dostępnej ścieżki;
- usunięcie ręcznego approval gate jest `blocking` do czasu zatwierdzenia
  odpowiedzialnej release authority i dowodu, że automatyczne evidence nie
  deklaruje samo własnej jakości;
- generowanie właściwych pytań dopiero po ukończeniu infrastruktury, runtime’ów, walidatorów, lokalizacji, płatności i dystrybucji treści.

Plan nie powinien powstać jako drugi dokument sterujący. Musi zastąpić nieaktualną część `docs/plan.md`, ponieważ obecny kontrakt przewiduje jeden execution-control document.

---

# 2. Ocena modelu subskrypcji

## Werdykt

Model jest zasadny, ale tylko w uproszczonej wersji `1/3`.

Ocena pierwotnej koncepcji:

```txt
7/10
```

Po korektach opisanych poniżej:

```txt
8/10
```

Model ma trzy główne zalety:

1. Cena rośnie wraz z realnym zakresem równoległej nauki.
2. Użytkownik przygotowujący się tylko do jednego egzaminu nie finansuje całego katalogu.
3. Wyższy tier naturalnie pasuje do osób łączących np. Algorithms, SQL i certyfikację.

Największa wada: większość indywidualnych użytkowników realizuje jeden główny cel naraz. Oznacza to, że podstawowy plan może zaspokoić większość popytu, a wyższy tier będzie miał mały udział. Nie należy więc budować trzech lub czterech płatnych poziomów.

Dominujące platformy edukacyjne zwykle sprzedają dostęp do całego katalogu. Patternly będzie więc postrzegany jako bardziej restrykcyjny i musi być odpowiednio tańszy oraz znacznie bardziej wyspecjalizowany.

Subskrypcja ma sens tylko wtedy, gdy produkt dostarcza trwałą lub cykliczną wartość:

- nowe nody;
- aktualizacje certyfikacji;
- korekty treści;
- nowe ścieżki;
- regularny review loop;
- aktualizacje profili egzaminacyjnych.

Statyczny bank pytań nie uzasadnia dobrze subskrypcji.

---

# 3. Docelowa oferta startowa

## 3.1. Free Preview

```txt
Cena: 0
Aktywne płatne ścieżki: 0
Dostęp: pierwszy node każdej dostępnej ścieżki
```

Pierwszy node powinien być dostępny w pełnej jakości:

- wszystkie informacje i wyjaśnienia;
- wszystkie interakcje obsługiwane przez ten node;
- review ograniczony do jego treści;
- zapis postępu;
- brak reklam;
- brak sztucznego ograniczenia liczby prób.

Zablokowane pozostają:

- node 2 i dalsze;
- cross-node practice;
- pełne mixed practice;
- `Interview Simulation`;
- `Exam Simulation`;
- review obejmujący treść spoza darmowego node’a.

Darmowy node nie zużywa slotu.

## 3.2. Focus

```txt
Tier ID: focus
Limit: 1 aktywna ścieżka
```

Rekomendowane ceny startowe:

| Okres       | USA / rynki dolarowe | Strefa euro |     Polska |
| ----------- | -------------------: | ----------: | ---------: |
| Miesięcznie |                $7.99 |       €7.99 |  29,99 PLN |
| Rocznie     |               $49.99 |      €49.99 | 199,99 PLN |

To powinien być plan domyślnie rekomendowany.

## 3.3. Multi-Track

```txt
Tier ID: multi_track
Limit: 3 aktywne ścieżki
```

Rekomendowane ceny startowe:

| Okres       | USA / rynki dolarowe | Strefa euro |     Polska |
| ----------- | -------------------: | ----------: | ---------: |
| Miesięcznie |               $12.99 |      €12.99 |  49,99 PLN |
| Rocznie     |               $79.99 |      €79.99 | 319,99 PLN |

Przykład wykorzystania:

```txt
Algorithms
+ Google Cloud Associate Cloud Engineer
+ SQL & Data Reasoning
```

Na starcie nie wprowadzamy tieru Unlimited.

Warunki późniejszego dodania:

- dostępnych jest co najmniej sześć pełnych ścieżek;
- co najmniej 10–15% płacących użytkowników regularnie osiąga limit trzech;
- istnieje mierzalny popyt na czwartą ścieżkę.

## 3.4. Dlaczego tylko dwa płatne tiery

Paywall powinien pokazywać wyłącznie:

```txt
Focus — 1 active track
Multi-Track — 3 active tracks
```

oraz przełącznik:

```txt
Monthly / Annual
```

Nie używać nazw:

```txt
Bronze
Silver
Gold
Pro Max
```

Nie wprowadzać wielu poziomów cenowych przed zebraniem danych.

## 3.5. Brak triala na starcie

Nie dodawać bezpłatnego okresu próbnego.

Pierwszy node pełni funkcję stałej, uczciwej próbki.

Paywall pojawia się:

1. po summary pierwszego node’a;
2. przy próbie rozpoczęcia node’a 2;
3. przy próbie uruchomienia trybu wymagającego szerszego banku.

Trial może zostać przetestowany później jako eksperyment, ale nie powinien być elementem architektury.

---

# 4. Semantyka aktywnych ścieżek

## 4.1. Aktywacja

Track staje się aktywny, gdy użytkownik z ważną subskrypcją po raz pierwszy próbuje uruchomić płatną część ścieżki.

```txt
preview node
→ próba otwarcia node 2
→ sprawdzenie entitlementu
→ dostępny slot
→ aktywacja tracku
→ rozpoczęcie sesji
```

## 4.2. Zmiana aktywnej ścieżki

Użytkownik może dezaktywować ścieżkę bez cooldownu.

Początkowo nie wprowadzamy:

- blokady 30-dniowej;
- opłat za zmianę;
- utraty historii;
- resetowania review;
- kar za przełączanie.

Dezaktywacja:

- zachowuje całą historię;
- zachowuje progress i review queue;
- blokuje nowe płatne sesje;
- usuwa rekomendacje tego tracku z aktywnego Home;
- nie usuwa lokalnych danych.

Nie można dezaktywować tracku posiadającego bieżącą aktywną sesję. Najpierw trzeba ją zakończyć albo porzucić.

Cooldown należy rozważyć dopiero wtedy, gdy dane pokażą masową rotację jednego slotu pomiędzy wszystkimi trackami.

## 4.3. Downgrade

Przy przejściu z trzech slotów do jednego:

- obecny okres zachowuje trzy sloty;
- po wejściu nowego limitu użytkownik wybiera jedną ścieżkę;
- aplikacja nie wybiera jej automatycznie;
- historia pozostałych zostaje zachowana;
- bieżąca aktywna sesja może zostać dokończona.

## 4.4. Wygaśnięcie subskrypcji

Subskrypcja jest sprawdzana przy:

- bootstrapie;
- rozpoczęciu płatnej sesji;
- aktywacji tracku;
- zmianie planu;
- przywróceniu zakupu.

Wygaśnięcie nie przerywa już rozpoczętej i zapisanej sesji.

Sesja otrzymuje snapshot uprawnienia podczas przygotowania i może zostać ukończona offline.

Nowa płatna sesja wymaga aktywnego entitlementu.

---

# 5. Języki

## 5.1. Kanoniczny model

```ts
type InterfaceLocale = "en" | "pl";

type LocalizationCoverage = "full" | "partial";

type ContentLanguagePolicy = "english_full" | "polish_full" | "polish_partial";
```

## 5.2. English Full

```txt
UI: English
Questions: English
Answers/options: English
Reason/Details: English
Taxonomy labels: English
```

English jest jedynym kanonicznym źródłem authoringu.

## 5.3. Polish Full

```txt
UI: Polish
Questions: Polish
Answers/options: Polish
Reason/Details: Polish
Taxonomy labels: Polish
```

Dla Certification:

- practice może być całkowicie po polsku;
- `Exam Simulation` może być po polsku również wtedy, gdy oficjalny egzamin nie występuje po polsku;
- aplikacja musi wtedy jasno stwierdzić, że symulacja odwzorowuje profil i zakres, ale nie język realnego egzaminu.

## 5.4. Polish Partial

```txt
UI: Polish
Setup i summary: Polish
Reason/Details: Polish
Taxonomy i rekomendacje: Polish
Questions i odpowiedzi Certification: język wybranego realnego egzaminu
```

Typowy przypadek:

```txt
polski interfejs i feedback
+ angielskie pytania i odpowiedzi
```

„Ten sam język co realny egzamin” oznacza język i terminologię egzaminacyjną, nie kopiowanie ani imitowanie oficjalnych pytań.

`ExamExperienceProfile` powinien otrzymać:

```ts
type ExamLocalePolicy = {
  officiallySupportedLocales: readonly string[];
  selectedExamLocale: string;
  questionLocale: string;
  explanationLocale: InterfaceLocale;
};
```

## 5.5. Brak runtime fallbacków językowych

`partial` nie jest technicznym fallbackiem.

Każdy artifact jawnie deklaruje:

```txt
UI locale
question locale
feedback locale
coverage level
```

Jeżeli `pl_full` nie jest kompletny:

- nie jest oferowany;
- runtime nie pobiera przypadkowo angielskich stringów;
- dostępny może być wyłącznie jawny `pl_partial`.

Zmiana angielskiego pytania unieważnia wszystkie tłumaczenia powiązane z jego fingerprintem.

---

# 6. Billing i konta

## 6.1. RevenueCat jako adapter

Rekomendowany model:

- RevenueCat integruje App Store i Google Play;
- domena Patternly nie importuje RevenueCat;
- entitlementy, purchase i restore są dostępne przez port aplikacyjny.

Nie tworzymy kont Patternly w pierwszym wydaniu.

Konsekwencje:

- restore działa w obrębie Apple ID albo Google Account;
- nie obiecujemy synchronizacji między iOS i Androidem;
- aktywne ścieżki i learning progress pozostają lokalne;
- reinstall może przywrócić subskrypcję, ale nie lokalną historię;
- cross-platform account może zostać dodany później jako osobny kontrakt.

Produkty sklepowe:

```txt
patternly_focus_monthly
patternly_focus_annual
patternly_multi_track_monthly
patternly_multi_track_annual
```

Entitlementy:

```txt
focus
multi_track
```

Port domenowy:

```ts
interface SubscriptionEntitlementPort {
  getSnapshot(): Promise<SubscriptionEntitlementSnapshot>;
  purchase(productId: ProductId): Promise<SubscriptionEntitlementSnapshot>;
  restore(): Promise<SubscriptionEntitlementSnapshot>;
  openManagement(): Promise<void>;
}
```

---

# 7. Dystrybucja treści

Przy kilkunastu ścieżkach, wielu wersjach certyfikacji oraz dwóch językach pełne bundlowanie wszystkiego z aplikacją nie będzie skalowalne.

Docelowy model:

```txt
aplikacja
→ signed catalog manifest
→ immutable track artifact
→ lokalna walidacja podpisu i checksumy
→ lokalny cache
→ pełna praca offline
```

## 7.1. Bundlowane z aplikacją

- portfolio metadata;
- Discovery Catalog;
- pierwszy darmowy node każdej ścieżki `available`;
- minimalne testowe fixture’y;
- klucz publiczny do weryfikacji podpisów.

## 7.2. Pobierane po aktywacji

- pełny artifact aktywowanego tracku;
- potrzebne warianty językowe;
- taxonomy;
- blueprints;
- `ExamExperienceProfile`;
- source/provenance manifest.

Treść może być hostowana jako publiczne, immutable pliki.

Na początku nie budujemy:

- DRM;
- serwera generującego signed URLs;
- kontroli dostępu do pojedynczych JSON-ów po stronie backendu.

Uczenie pozostaje offline-first.

Sieć jest wymagana do:

- zakupu;
- restore;
- aktualizacji katalogu;
- pobrania lub zaktualizowania tracku.

Odpowiedzi, wyniki, review i learning history nie są przesyłane.

---

# 8. Telemetria komercyjna

Bez pomiaru nie da się zweryfikować:

- czy pierwszy node pokazuje wartość;
- czy paywall jest wyświetlany w odpowiednim momencie;
- czy limit trzech tracków ma popyt;
- czy użytkownicy rotują slotami;
- czy plan roczny utrzymuje użytkowników.

Rekomendowany podział:

- RevenueCat dla zdarzeń subskrypcyjnych;
- osobny ograniczony system telemetryczny dla zdarzeń produktowych.

Dozwolone zdarzenia:

```txt
preview_node_started
preview_node_completed
paywall_viewed
purchase_started
purchase_completed
purchase_failed
track_activation_requested
track_activated
track_deactivated
track_slot_limit_reached
subscription_restored
language_mode_changed
content_pack_download_started
content_pack_download_completed
```

Zakazane payloady:

- prompt;
- odpowiedź;
- item ID;
- score;
- mistake code;
- review evidence;
- szczegóły postępu;
- `Reason`;
- `Details`.

---

# 9. Precyzyjny plan implementacji

## Etap 0 — kontrakt i aktualny Stage 3

### P0 — `PRODUCT-CONTRACT-REALIGN-01`

**Status:** `blocking` — nie rozpoczynać przed
`COMMERCIAL-CONTRACT-DECISIONS-01`.

**Zakres:** dokumentacja, bez zmian aplikacji.

Zmienić:

```txt
00-overview
01-product-definition
02-architecture
03-navigation-and-flows
04-data-model
05-design-system
06-branding-and-style-direction
07-content-guidelines
08-storage-and-offline
09-security-and-privacy
10-roadmap
11-implementation-guidelines
12-testing-strategy
13-risk-register
15-certification-track-learning-system
16-leetcode-like-learning-system
17-training-runtime-and-interaction-spec
docs/plan.md
```

Dodać kontrakty:

- Portfolio Catalog;
- Discovery Catalog;
- Runtime Registry;
- localization `full` / `partial`;
- subscription tiers;
- track slots;
- free first node;
- billing network boundary;
- signed remote content;
- minimal telemetry;
- automated content evidence i deterministic technical gates;
- jawna, zatwierdzona release authority dla jakości edukacyjnej.

Zmienić wymagania:

- human sign-off tylko zgodnie z finalną decyzją o odpowiedzialnej release
  authority; nie usuwać go bez jawnego, niezależnego replacement contractu;
- brak jakiejkolwiek sieci;
- wyłącznie bundled full content;
- brak subscription state;
- ogólne `cloud-certification`.

### Acceptance

- jeden niesprzeczny kontrakt odpowiedzialności za jakość i aktywację treści;
- brak sprzeczności dotyczącej network boundary;
- jeden execution plan;
- pytania nadal poza zakresem;
- test spójności dokumentów.

---

### P1 — `S3-CLOSURE-EVIDENCE-02`

**Status:** `partial` — aktywne pierwsze zadanie. Pełny pakiet wykonawczy
znajduje się w sekcji 0.

Dokończyć obecne Algorithms Stage 3:

- Android;
- VoiceOver;
- TalkBack;
- Dynamic Type;
- reduced motion;
- screenshot comparison;
- pozostałe stany P/S.

Bez zmian:

- runtime’u;
- płatności;
- języków;
- treści.

---

# Etap 1 — Portfolio

### P2 — `PORTFOLIO-CATALOG-01`

**Status:** `blocking` — zakres poniżej zostaje zastąpiony przez
`PORTFOLIO-CONTRACT-CUTOVER-01` po realignmencie dokumentów.

Repozytorium:

```txt
patternly-content
```

Nie tworzyć `portfolio/tracks/*` ani scaffoldów dla niegotowych tracków.
Rozszerzyć jeden istniejący canonical path:

```txt
config/tracks/<trackId>.json
```

Wpis powstaje dopiero razem z rzeczywistym, kompletnym specem danego tracku i
definiuje:

- stabilne ID;
- family ID;
- provider ID;
- product kind;
- supported language modes;
- free preview node policy;
- subscription eligibility.

Bez:

- pytań;
- pustych aktywnych banków;
- wpisów dla przyszłych lub zapowiadanych tracków;
- `ExamExperienceProfile`;
- runtime registration.

---

### P3 — `DISCOVERY-CATALOG-01`

**Status:** `blocking` — wymaga decyzji o powierzchni `announced` i
zatwierdzonego designu. Pierwszy cutover pokazuje wyłącznie tracki z realnym
canonicalnym wpisem i prawdziwą dostępnością.

W aplikacji dodać read-only katalog hybrydowy.

Minimalny pierwszy zakres:

```txt
Available
- Algorithms
```

Jeżeli właściciel produktu zatwierdzi później surface `announced`, jego karta:

- nie rejestruje runtime’u;
- nie prowadzi do setupu;
- nie ma daty premiery;
- nie ma fikcyjnego procentu ukończenia.

---

# Etap 2 — lokalizacja

### P4 — `LOCALIZATION-DOMAIN-01`

Dodać:

```ts
InterfaceLocale;
ContentLocale;
LocalizationCoverage;
ExamLocalePolicy;
LocalizedArtifactRef;
```

Wymusić:

- English canonical;
- jawne `pl_full`;
- jawne `pl_partial`;
- brak runtime fallbacków;
- fingerprint zależny od źródłowego angielskiego artifactu.

---

### P5 — `UI-I18N-CUTOVER-01`

- przenieść wszystkie user-facing strings do typowanego katalogu;
- dodać English i Polish;
- ustawić English jako default;
- obsłużyć system locale i ręczny wybór;
- włączyć CI na brakujące i nadmiarowe klucze;
- usunąć inline copy.

---

### P6 — `CONTENT-LOCALE-RUNTIME-01`

Runtime wybiera jeden kompletny wariant artifactu.

Testy:

- `en_full`;
- `pl_full`;
- `pl_partial`;
- brak wymaganej lokalizacji;
- niezgodny source fingerprint;
- egzamin w języku innym niż UI;
- brak przypadkowego mieszania stringów.

---

# Etap 3 — subskrypcje i sloty

### P7 — `ENTITLEMENT-DOMAIN-01`

Dodać finalne modele:

```ts
SubscriptionTier;
SubscriptionEntitlementSnapshot;
TrackSlotPolicy;
ActiveTrackAssignment;
TrackAccessDecision;
SubscriptionFailure;
```

Reguły:

- Free = preview node;
- Focus = 1 slot;
- Multi-Track = 3 sloty;
- jedna aktywna sesja globalnie nadal obowiązuje;
- aktywne ścieżki nie są aktywnymi sesjami;
- historia inactive tracku zostaje;
- brak cooldownu.

---

### P8 — `REVENUECAT-ADAPTER-01`

- dodać przypięty SDK RevenueCat;
- skonfigurować sandbox i production keys poza repo;
- utworzyć cztery produkty;
- utworzyć dwa entitlementy;
- purchase;
- restore;
- cached access;
- offline grace;
- manage subscription;
- upgrade;
- downgrade.

Testy adaptera nie mogą przenikać do domeny.

---

### P9 — `TRACK-ACTIVATION-01`

Implementacja:

- aktywacja;
- dezaktywacja;
- limit slotów;
- zmiana planu;
- downgrade resolution;
- expiry;
- grace period;
- restore po reinstalacji;
- brak przerwania istniejącej sesji.

---

### P10 — `PAYWALL-AND-STORE-FLOWS-01`

Powierzchnie:

- post-preview paywall;
- node-2 paywall;
- slot-limit upsell;
- restore;
- manage;
- billing issue;
- grace period;
- purchase failure;
- parental/store restriction;
- localized terms.

Paywall pokazuje całkowitą cenę roczną jako główną wartość.

---

# Etap 4 — sieć, content delivery i telemetria

### P11 — `NETWORK-PRIVACY-CONTRACT-01`

Rozdzielić trzy klasy ruchu:

```txt
billing
content delivery
anonymous product analytics
```

Jawnie zabronić transmisji learning state.

Dodać:

- network inventory;
- processor inventory;
- retention;
- redaction;
- opt-out analytics;
- restore and cancellation copy;
- store privacy manifests.

---

### P12 — `SIGNED-CONTENT-REGISTRY-01`

W `patternly-content`:

- canonical manifest;
- SHA-256;
- Ed25519 signature;
- immutable release paths;
- locale variants;
- preview/full pack distinction;
- minimum app version;
- deactivation metadata;
- revocation metadata.

---

### P13 — `CONTENT-DOWNLOAD-AND-CACHE-01`

W aplikacji:

- catalog fetch;
- signature validation;
- download;
- checksum;
- atomic local activation;
- retry;
- offline cache;
- content mismatch;
- cache cleanup;
- zachowanie pakietu używanego przez bieżącą sesję.

Bez historycznej rekonstrukcji zakończonych sesji.

---

### P14 — `PRODUCT-TELEMETRY-01`

Dodać zamknięty event allowlist.

Testy mają blokować:

- wysyłanie odpowiedzi;
- score;
- item ID;
- prompt;
- review evidence;
- dowolny niezarejestrowany event.

---

# Etap 5 — automatyczna fabryka treści

Na tym etapie nadal nie powstają produkcyjne pytania.

### P15 — `AUTOMATED-CONTENT-GOVERNANCE-01`

**Status:** `blocking` — zastąpione przez
`CONTENT-EVIDENCE-AUTOMATION-01`. Nie usuwać obecnego approval schema, dopóki
nie zostanie zatwierdzona odpowiedzialna release authority.

Dodać automatyczne evidence niezależnie od istniejącego approval record:

```ts
AutomatedContentAssessment;
EvaluatorRun;
BlindSolutionEvidence;
SourceClaimEvidence;
AmbiguityFinding;
OriginalityFinding;
CoverageEvidence;
LocalizationEvidence;
ReleaseDisposition;
```

Deterministic release coordinator może wydać techniczne `eligible_for_release`
wyłącznie po przejściu wszystkich gate'ów. Nie może sam nadać sobie statusu
odpowiedzialnej recenzji jakości edukacyjnej.

Nie dodawać pól udających ręczne zatwierdzenie ani autoryzację właściciela:

```txt
humanReviewer
humanApproved
product-owner-authorized-ai-review
```

---

### P16 — `GENERATION-PIPELINE-01`

Pipeline:

```txt
track specification
→ taxonomy
→ coverage matrix
→ slot specification
→ candidate generation
→ structural validation
→ blind solution
→ adversarial evaluation
→ source validation
→ similarity detection
→ localization
→ UI rendering
→ immutable candidate
```

Do testów używać neutralnych fixture’ów kontraktowych, nie właściwego banku pytań.

---

### P17 — `INDEPENDENT-EVALUATION-01`

Każdy kandydat przechodzi:

- blind solve bez accepted answer;
- drugi niezależny evaluator;
- ambiguity search;
- counterfactual mutation;
- accepted-answer consistency;
- distractor plausibility;
- scoring verification;
- taxonomy verification;
- provenance verification;
- near-duplicate detection;
- leakage detection.

Niezgodność evaluatorów blokuje element.

---

### P18 — `CONTENT-QA-BUILD-01`

Audit-only build pokazujący:

- pytanie;
- answer contract;
- `Reason`;
- `Details`;
- distractor explanations;
- taxonomy;
- źródła;
- evaluator evidence;
- podobne pytania;
- language variants;
- coverage matrix.

Nie posiada przycisku `Approve`.

Człowiek może przeglądać wynik testowo, ale nie jest wymaganym elementem pipeline’u.

---

# Etap 6 — runtime’y bez właściwych pytań

### P19 — `CERTIFICATION-PORTFOLIO-SPECS-01`

Dla pierwszej fali:

- Google Cloud Associate Cloud Engineer;
- AWS Certified Solutions Architect – Associate;
- Microsoft Certified: Azure AI Fundamentals.

Przygotować:

- taxonomy;
- competencies;
- blueprints;
- official source registry;
- `ExamExperienceProfile`;
- localization policy;
- free preview node definition;
- automated release gates.

Bez pytań.

---

### P20 — `CERTIFICATION-RUNTIME-CUTOVER-01`

- jeden `CertificationFamilyRuntime`;
- usunąć `cloud-certification`;
- usunąć stare Cloud-specific runtime’y;
- wdrożyć wszystkie siedem trybów;
- profile-driven simulation;
- fixture-backed tests;
- zero track-ID branches w shared code.

---

### P21 — `PRODUCT-SURFACES-CUTOVER-01`

- Home;
- katalog;
- track detail;
- roadmap;
- subscription state;
- language mode;
- download state;
- active track management;
- Progress;
- Settings;
- restore/manage subscription;
- telemetry opt-out.

---

### P22 — `COMMERCIAL-QA-HARNESS-01`

Pokryć:

- free preview;
- paywall;
- Focus purchase;
- Multi purchase;
- slot limit;
- upgrade;
- downgrade;
- expiry;
- offline entitlement;
- download failure;
- locale full/partial;
- store restore;
- announced track;
- content signature failure.

---

# Etap 7 — generowanie pytań

Dopiero na tym etapie rozpoczyna się authoring.

### P23 — `ALGORITHMS-CONTENT-EXPANSION-01`

Nie ustalać arbitralnej liczby pytań.

Wymagania:

- każdy slot wynika z materialnie odrębnej decyzji;
- pełne pokrycie mental units;
- pełne decisive boundaries;
- pełne transfer boundaries;
- brak fillerów;
- simulation-compatible pool co najmniej 3× większy niż sesja;
- minimum 120 elementów zgodnych z symulacją;
- docelowa liczba wynika z coverage matrix;
- prawdopodobny zakres 160–220;
- English canonical;
- `pl_full`;
- automatyczny gate;
- immutable release.

---

### P24 — `GOOGLE-CLOUD-ACE-CONTENT-01`

- coverage matrix oparty na aktualnym official guide;
- competency/topic/skill-atom coverage;
- simulation pool co najmniej 3× większy od maksymalnej liczby pytań z profilu;
- English canonical;
- Polish Full;
- Polish Partial;
- automatyczna walidacja źródeł.

---

### P25 — `AWS-SAA-CONTENT-01`

Analogiczny pełny przebieg.

---

### P26 — `AZURE-AI-FUNDAMENTALS-CONTENT-01`

Analogiczny pełny przebieg.

Nie aktywować podzbiorów.

Track pozostaje:

```txt
unavailable
```

dopóki cały wymagany bank, profil, języki i runtime nie przejdą gate’ów.

---

# Etap 8 — release

### P27 — `SUBSCRIPTION-RELEASE-CLOSURE-01`

Release wymaga minimum trzech pełnych płatnych tracków.

Rekomendowany pierwszy katalog:

```txt
Algorithms
Google Cloud Associate Cloud Engineer
AWS Certified Solutions Architect – Associate
Microsoft Certified: Azure AI Fundamentals
```

SQL pozostaje `announced`.

Sprawdzić:

- store products;
- ceny regionalne;
- purchase;
- restore;
- upgrade;
- downgrade;
- offline access;
- subscription management;
- privacy disclosures;
- telemetry;
- signed content;
- wszystkie języki;
- accessibility;
- automated content evidence;
- CI;
- natywne iOS/Android QA.

---

# 10. Metryki po wydaniu

Najważniejsze metryki:

```txt
preview start rate
preview completion rate
preview-complete → paywall
preview-complete → paid
download → paid D35
Focus / Multi-Track mix
annual / monthly mix
second-track activation rate
slot-limit hit rate
track switching frequency
paid active learning D7 / D30
first renewal
cancellation reason
content defect rate
```

Początkowe hipotezy:

- plan roczny: co najmniej 55% zakupów;
- Multi-Track: 15–25% płatnych subskrypcji;
- D35 download-to-paid: powyżej 2.5%;
- preview-complete-to-paid: co najmniej 8%;
- mniej niż 10% użytkowników Focus wykonuje częste rotacje slotu;
- content defect rate: poniżej 1 potwierdzonego defektu na 100 aktywnych pytań.

Nie są to stałe kontrakty. To progi do oceny pierwszej kohorty.

---

# 11. Kolejność bez skrótów

```txt
zamknięcie evidence obecnego Algorithms Stage 3
→ decyzje komercyjne i release authority
→ realignment kontraktów
→ portfolio
→ języki
→ sieć i prywatność
→ entitlementy
→ zakupy
→ sloty
→ paywall
→ signed content delivery
→ telemetryka
→ automatyczne content evidence i techniczne gate'y
→ generator i evaluatory
→ QA build
→ certification runtime
→ finalne surface’y
→ dopiero wtedy tworzenie pytań
→ release
```

Najważniejsza reguła:

> Nie należy przechodzić bezpośrednio do tworzenia kolejnych banków pytań ani
> implementacji kolejnych certyfikacji. Najpierw trzeba ustanowić finalny model
> portfolio, języków, płatności, dystrybucji, automatycznych evidence gate'ów i
> odpowiedzialnej release authority.
