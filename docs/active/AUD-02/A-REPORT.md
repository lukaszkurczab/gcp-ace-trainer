# AUD-02A — Exam Premium

**Status:** PASS  
**Data:** 27 września 2026  
**Urządzenie:** istniejący iPhone 17 Simulator, iOS 26.4, `7F315654-3175-4F3C-BB24-B0263F59360C`

## Wynik

`Certification Exam Simulation` pozostaje osobnym profilem symulacji poza zwykłą macierzą practice modes i zawsze wymaga potwierdzonego Premium. Free oraz niepewny entitlement kończą się przed przygotowaniem lub zapisem sesji. Premium uruchamia dokładny profil GCP i zachowuje pełny cykl Exam: odpowiedzi, zmianę odpowiedzi, flagę, navigator, cold resume, ręczne zakończenie lub timeout, wynik i review 50/50.

## Zmiana

- Practice Hub wybiera kanoniczny mode node'a, zachowuje kontekst niedostępnego topicu i pokazuje kartę Exam tylko dla zweryfikowanego profilu symulacji.
- Home przekazuje `trackId`, a runtime owner ma osobną, fail-closed ścieżkę `certification-exam-simulation`, która odrzuca `nodeId`, waliduje profil i zachowuje tożsamość artefaktu.
- Wspólna bramka dostępu wymaga potwierdzonego Premium przed trwałym startem; odmowa i stan unavailable nie wywołują `start`.
- Exam zachowuje trwałe odpowiedzi i flagi, poprawne odświeżenie navigatora, cold resume, jawne manual finish/timeout oraz kanoniczny wynik i review.
- Lokalny backend smoke ma deterministyczny fixture `expired|active` dla zwykłego `GET /v1/entitlements`; fixture nie jest dowodem providera ani produkcji.
- Kandydat contentu `72b892153dd53082f641ffb20efcb7151fa96db4fa553d0fe4a915929f33216e` zawiera aktualny profil GCP. Bieżący app lock i admission v3 wiążą dokładnie dziewięć artefaktów; historyczny lock pozostał bez zmian.

## Evidence runtime

- Free/paywall, zero trwałej sesji i cold restart: `/tmp/patternly-aud02a-evidence/free/2026-09-27_164728`.
- Premium prepare/start: `/tmp/patternly-aud02a-evidence/premium/2026-09-27_172806`.
- Premium answer change, flag/navigator, terminate/restart/resume, manual finish, wynik i review 50/50: `/tmp/patternly-aud02a-evidence/premium/2026-09-27_172905`.
- Timeout, wynik i review: `/tmp/patternly-aud02a-evidence/timeout/2026-09-27_173522`.
- Final-HEAD rerun wiążący runtime z końcowym commitem aplikacji: `/tmp/patternly-aud02a-final-head-evidence/free-final`, `/tmp/patternly-aud02a-final-head-evidence/premium-final` i `/tmp/patternly-aud02a-final-head-evidence/timeout-final`. Każdy katalog zawiera output Maestro oraz lokalny manifest dokładnych SHA/UDID/trybu entitlement; manifest nie jest artefaktem produkcyjnym.
- Fixture entitlement potwierdził zgodne konto i produkt dla `expired` oraz `active`. Screenshoty potwierdzają prezentację; zachowanie backendu potwierdzają testy kontraktowe i odpowiedzi endpointu.
- Użyto wyłącznie istniejącego iPhone'a 17 i jednej instalacji `com.lkurczab.patternly`.

## Weryfikacja

- Pełne `patternly npm test` z bieżącym content HEAD i osobnym historycznym checkoutem `cc3efca88be7e01137f10ac69a0643f06b61a350` — 1347/1347 PASS.
- `npm run typecheck` — PASS.
- `npm run check:content-release` — PASS; inventory 9 tracków, 117 node'ów, 943 mental units, 16077 pytań.
- Targeted Exam/entitlement/navigation/review oraz kontrakt Maestro — PASS; wcześniejsze grupy 63/63 i 6/6.
- `patternly-content npm test` — 74/74 PASS; `candidate:admission-v3` i `candidate:release-gate-v2` — READY.
- Backend `localSmoke.test.ts` — 5/5 PASS; backend typecheck — PASS.
- Pełny backend `npm test` bez emulator env poprawnie odmówił suite'om emulatorowym. Powtórzenie z env przerwała awaria istniejącego Auth emulatora (`ECONNREFUSED 127.0.0.1:19099`); nie jest raportowane jako PASS. Zmieniony, izolowany fixture ma kompletną bramkę 5/5, a Auth/backend zostały ponownie uruchomione i `/ready` potwierdzono.
- `git diff --check` — PASS; tymczasowe logi diagnostyczne usunięte.

## Niezależne QA

Wstępny `qa-gate` na `gpt-6-luna high` wydał `PASS WITH ISSUES`, a pierwszy końcowy przegląd poprawnie odrzucił evidence sprzed finalnego commita. Po korekcie runnerów finalny Free/Premium/timeout jest powtarzany na dokładnym końcowym app HEAD i admission, a ostatni `qa-gate` sprawdza te same SHA przed push.

## Granice

- Nie wykonano deploymentu, publikacji, operacji sklepowej ani dowodu realnego RevenueCat.
- Nie zmieniono pytań ani historycznego release locka. Zmiana GCP artifact hash wynika z kanonicznych `contentDomainId` i `simulationProfiles`; `questionSetSha256` pozostał bez zmian.
- VoiceOver nie jest kryterium tego zadania zgodnie z decyzją właściciela i kanonicznym planem.
