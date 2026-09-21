# ODK-118 — jedna miesięczna oferta Premium

**Status:** lokalny kontrakt produktu i domeny wykonany; końcowe potwierdzenie oferty w sklepach oraz ceny w Warunkach pozostaje przy ODK-116/085.

Decyzja PO: jedna automatycznie odnawialna subskrypcja miesięczna bez triala, planowana cena w Polsce 29,99 PLN; ceny w pozostałych krajach wyznacza sklep. Z domeny usunięto nieużywane `PREMIUM_OFFER_KINDS`, `PremiumOfferKind` i `isPremiumOfferKind` z wariantami fixed 30/90 dni. Identyfikator `premium`, kształt projekcji konta oraz stan uprawnienia nie zmieniły się. Nie znaleziono ścieżki zapisu ani odczytu historycznych rekordów z tymi wariantami — występowały tylko w deklaracji i teście. Reguła siedmiu dni offline jest osobnym zakresem ODK-119 i na tym etapie pozostaje bez zmian.

Uzgodniono aktywne `docs/00-overview.md`, `01-product-definition.md`, `09-security-and-privacy.md`, `10-roadmap.md` i `13-risk-register.md`. Ekran zakupu już pokazuje cykl miesięczny, brak triala i bieżącą cenę sklepu. Warunki opisują odnowienie, anulowanie, zmianę ceny i odstąpienie. Zmienne ceny w `src/legal/legalVariables.ts` nadal są placeholderami do uzupełnienia po potwierdzeniu danych oferty; nie wstawiono polskiej ceny jako stawki dla wszystkich krajów EOG.

**Weryfikacja:** `premiumEntitlement.test.ts` 9/9 PASS; `npm run typecheck` PASS; wyszukanie symboli fixed 30/90 w aktywnym `patternly/src` i pięciu zmienionych dokumentach puste; `git diff --check` PASS. Brief walidował `gpt-5.6-luna/max`: spójność 0,93, prostota 0,92, ryzyko 0,83, utrzymanie 0,90; minimum 0,83.

Niezależny QA `gpt-5.6-luna/max`: PASS; spójność 0,97, prostota 0,98, ryzyko 0,96, utrzymanie 0,97; minimum 0,96. QA potwierdził też 4/4 testy adaptera zakupu oraz istniejący kontrakt miesięcznego produktu `P1M` bez ceny promocyjnej i triala.

**Brakujące dowody:** rzeczywiste SKU/cena/trial/odnowienie w App Store, Google Play i RevenueCat oraz kompletne zmienne legal. Nie stwierdzono ich stanu w providerach, więc raport nie przyznaje globalnej bramki wydania.
