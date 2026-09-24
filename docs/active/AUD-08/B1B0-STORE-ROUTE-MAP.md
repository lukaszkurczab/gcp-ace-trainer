# AUD-08/B1b0 — mapa tras i zapisów generacji autoryzacji

**Data:** 24.09.2026  
**Status:** mapa read-only przyjęta przez niezależne QA (PASS); bez zmian runtime.

## Źródło i reguła

Kanoniczny katalog metod i ścieżek jest w backendowym `src/api/openapi.ts`, profile ochrony w `src/api/route-contract.ts`, a rzeczywiste handlery w `src/api/app.ts`. [Pełna macierz dokładnych 57 metod/ścieżek i magazynów](B1B0-ROUTE-MATRIX.md) obejmuje także odczyty. B1a już przenosi poprawny claim `authorizationGeneration` przez verifier i przygotowuje wymianę sesji. `authenticateRequest`/Fastify nadal nie przekazuje oczekiwanej generacji do magazynów; obecna kontrola konta zwraca tylko `userId`. A1 wymaga porównania claimu z bieżącym `users/{userId}.authorizationGeneration` oraz ponownego sprawdzenia aktywnego stanu i oczekiwanej generacji **w tej samej transakcji co każdy zapis zależny od sesji**. Istniejące `syncMetadata/account.generation` nadal służy postępowi i adopcji; nie wolno go użyć do autoryzacji.

## Klasy tras

| Profil | Przykłady | Reguła B1b |
| --- | --- | --- |
| `app_check_bearer` i `bearer` | `/v1/me`, profil/legal/purchase, progress/sync, export, privacy/legal account, recovery issue, session revoke, deletion, transfer start/upload/seal/preview/confirm/apply/status | Backend rozwiązuje UID, stan konta i oczekiwaną generację; wszystkie zapisy magazynów otrzymują tę wartość jawnym parametrem. |
| `app_check_verify_only_bearer` | registration, session exchange | Bez wymagania aktualnego claimu; exchange przypina generację z aktywnego konta i pilnuje bariery `auth_time`. |
| `app_check_optional_bearer` | public legal requests, content reports | Bez bearer ścieżka gościa; z bearer pełna walidacja konta. Zły bearer nie staje się gościem. |
| `app_check_only` | guest privacy, recovery consume, deletion status/proof | Własne ograniczone zdolności, bez automatycznego claimu konta. Recovery consume należy do A2/B2. |
| `admin`, `webhook`, `public` | admin cases, RevenueCat, health/ready/OpenAPI | Własne uwierzytelnienie; mutacje celu sprawdzają aktywny stan/tombstone w transakcji, ale nie claim sesji użytkownika. Public nie rozwiązuje konta. |

Pełną macierz budować z **dokładnej metody i ścieżki** OpenAPI, nie ze stringowych prefiksów. Obejmuje ona również zapis rate-limit/audytu eksportu, staging transferu, raporty, sesję revoke i opcjonalny bearer. Metody tylko do odczytu odmawiają starej generacji już w guardzie; eksport dodatkowo sprawdza ją przed wysłaniem wrażliwej odpowiedzi.

## Magazyny i miejsca wyścigu

| Grupa | Aktualna granica | Wymagana korekta |
| --- | --- | --- |
| `users/store.ts` | Legal acceptance i purchase confirmation transakcyjnie czytają użytkownika, lecz bez generacji. | Wspólny helper asercji `active + expectedAuthorizationGeneration` na odczytanym dokumencie, użyty wewnątrz obu transakcji. |
| `progress/store.ts` | Sync i jednorazowa adopcja czytają usera w transakcji; transfer wieloetapowy nie zabezpiecza każdego upload/seal/preview/confirm/apply, część wyników zapisuje batch poza transakcją konta. | Sync/adopcja: asercja w istniejącej transakcji. Transfer: każda transakcja staging i każdy batch zastąpiony ograniczoną transakcją lub równoważnym CAS; sprawdzić ponownie finalne apply. Nie uznawać samego guardu za ochronę. |
| `account-lifecycle/store.ts` | Issue codes zastępuje indeksy w transakcji bez claimu; session revoke ma provider call poza transakcją; delete podnosi stan zbyt późno. | Issue/revoke: oczekiwana generacja w operacji. Delete: `deleting` i obrót generacji przed zewnętrznym usuwaniem w jednej transakcji. Public consume pozostaje B2. |
| `data-export/store.ts` | Rate limit i audit zapisują się transakcyjnie, lecz bez generacji; odpowiedź powstaje z późniejszych odczytów. | Asercja w transakcji audytu/rate-limit oraz ponowny check przed zwróceniem eksportu; objąć późniejsze zapisy statusu. |
| `privacy-requests/store.ts`, `legal-requests/store.ts`, `content-reports/store.ts` | Authenticated create oraz odczyt własnej odpowiedzi privacy (z audytem) mogą zapisać po guardzie bez atomowego checku generacji. | Jawnym parametrem przekazać expected gen; dodać transakcję z kontem lub równoważny compare-and-write, także dla audytu odczytu privacy. Guest/admin operacje zachowują własną zdolność. `devices/store.ts.touch` nie ma obecnie wywołania z trasy; nie jest aktywną luką API. |
| `revenueCatWebhookStore.ts` i admin | Provider/operator nie ma claimu użytkownika; webhook może mutować cel istniejący lecz usuwany. | Transakcyjnie odmówić odtworzenia usuwanego/usuniętego celu; osobno ustalić receipt zdarzenia. Nie udawać sesji użytkownika. |

## Podział wykonawczy

1. **B1b1 — granica żądania i pierwszy magazyn.** Rozwiązać `userId + expectedAuthorizationGeneration` z aktywnego konta, bez claimless fallbacku, i dodać transakcyjny helper/asercję w `users/store.ts` dla legal/purchase. Zaktualizowany klient B1a jest warunkiem lokalnego testu. Praca pozostaje lokalna; B1c oceni gotowość wydania i kanał dystrybucji przed jakimkolwiek wdrożeniem.
2. **B1b2 — zwykłe zapisy.** Progress sync i jednorazowa adopcja, recovery issue/session revoke, konto privacy create/read-audit, legal/content-report, export audit/rate limit i check przed odpowiedzią. Każdy aktywny call site ma jawny oczekiwany numer; brak numeru nie wybiera bieżącego z bazy. Niepodłączone `devices.touch` obejmie przyszła integracja przed użyciem.
3. **B1b3 — wieloetapowy transfer.** Każdy upload/seal/preview/confirm/apply wraz z batchami i finalną promocją sprawdza stan/generację w swojej transakcji; w razie niemożności zapewnienia CAS jawnie odmówić etapu do przebudowy.
4. **B1b4 — delete i nie-sesyjne mutacje celu.** Delete obraca generację i `deleting` przed providerem; webhook/admin nie odtwarzają usuniętego konta. Public recovery consume/reissue/ACK pozostają B2 według A2.
5. **B1c — bramka włączenia.** Faktyczny Firebase initial+refresh claim, równość `auth_time`, dokładna macierz OpenAPI→store, typed reauth po obrocie, wpływ na starsze instalacje i jeden iPhone 17. Do PASS B1c nie uruchamiać recovery takeover ani nie usuwać bieżącego revoke.

Test wyścigu dla każdego zapisu: zatrzymać wykonanie po guardzie, obrócić generację, wznowić zapis; transakcja musi odmówić bez zmiany danych. Test odczytu: token ze starą generacją nie dostaje danych. Test transferu sprawdza każdy etap osobno, nie tylko końcowe apply.

**Ocena mapy:** cel/architektura 0,94; prostota 0,91; ryzyko 0,92; utrzymywalność 0,90; minimum **0,90**. Implementacja całego B1b jako jeden patch byłaby poniżej progu 0,8; podział jest warunkiem utrzymywalnego odbioru.

**Odbiór B1b0:** niezależne QA porównało 57 wierszy dokładnych metod/ścieżek z OpenAPI i handlerami oraz skorygowało efekty uboczne odczytów (privacy audit, admin reminders, deletion-proof cleanup). Nie uruchamiano testów runtime, bo B1b0 jest mapą stanu kodu.
