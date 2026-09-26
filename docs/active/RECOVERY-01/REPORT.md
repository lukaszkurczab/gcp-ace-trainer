# RECOVERY-01 — raport odbioru

Data: 26 września 2026

## Wynik

Automatyczne odzyskanie separowalnego planu jest zaimplementowane w istniejącym ownerze synchronizacji konta. Próba jest read-only wobec backendu (`getProgress`), rezerwowana trwale przed żądaniem, deduplikowana i ograniczona wykładniczym backoffem 30 s–6 h. Dismiss pozostaje wyłącznie decyzją prezentacyjną i nie zatrzymuje retry.

Ocena zaakceptowanego podejścia: spójność z celem i architekturą 0,96; prostota 0,88; ryzyko 0,84; utrzymywalność 0,90; minimum 0,84.

## Kontrakt bezpieczeństwa

- Triggery należą do jednego sidecara: bootstrap incydentu, reconnect, poprawny powrót do foreground i timer aktywnej aplikacji.
- Odpowiedź jest odrzucana przy zmianie konta, incydentu lub generacji oraz przy niejednoznacznym rekordzie, złym tracku albo wersji nie nowszej od kwarantanny.
- Sukces pod jednym lokalnym lockiem zapisuje plan i jego ACK oraz usuwa dokładnie ten incydent.
- Recovery nie wywołuje `syncProgress` i nie przesuwa globalnej `remoteAccountRevision`, ponieważ nie materializuje całego zdalnego snapshotu.
- Nie dodano migracji formatu incydentu ze starszych lokalnych buildów. Jest to jawny non-goal przed pierwszym wydaniem; brak realnych użytkowników i danych produkcyjnych.

## Weryfikacja

- Targeted aplikacji: 103/103 PASS; dodatkowy test struktury triggerów 33/33 PASS.
- `npm run typecheck` w aplikacji: PASS.
- `npm run typecheck` w backendzie: PASS.
- Pełne testy backendu z działającymi emulatorami Auth/Firestore: 254/254 PASS.
- `git diff --check` w obu repozytoriach: PASS.
- Istniejący iPhone 17, iOS 26.4, bez tworzenia dodatkowego urządzenia lub instalacji:
  - zdalny plan v9 o nieobsługiwanym schemacie wywołał trwały incydent;
  - komunikat był widoczny i dismiss nie naruszył danych;
  - exact remote assert po odczycie klienta zachował `accountRevision=1`, plan v9 i wszystkie rekordy postępu;
  - po kontrolowanej naprawie do poprawnego planu v10 aplikacja automatycznie pokazała `patternly:target-date-guidance:root:home` bez ponownego komunikatu;
  - exact remote assert po odzyskaniu nadal zachował `accountRevision=1` i niezmienione rekordy postępu.
- Fixture backendu obsługuje osobne asercje stanu uszkodzonego i naprawionego. Późniejszy pełny test backendu wyczyścił dane emulatora; końcowy cleanup nie znalazł już mapowania fixture.

## Niezależne QA

GPT-6 Luna High, read-only: `PASS WITH ISSUES`.

Reviewer potwierdził read-only transport, trwały backoff, deduplikację, ochronę account/incident/generation, atomowy lokalny commit oraz triggery. Pierwotny finding o kompatybilności starszego lokalnego formatu został wycofany po zastosowaniu jawnego non-goal planu.

Pozostałe ograniczenia nie blokują RECOVERY-01:

- szerokie `qa:static` ujawniło dwa niezależne, istniejące wcześniej rozjazdy testów w nietkniętych obszarach `ProfileStoragePreparationGate` i `visualShell`;
- trzy testy content cross-repo wymagają jawnych wartości przypiętych SHA; uruchomienie bez nich nie jest PASS;
- restart/backoff oraz offline są potwierdzone testami trwałego storage, a ownership reconnect/foreground testem kompozycji; osobny fizyczny toggle sieci na Simulatorze nie był wykonywany.

## Zmienione obszary

- foreground/reconnect ownership i publikacja stanu sesji konta;
- read-only recovery service i retry policy;
- trwały incident, rezerwacja próby i atomowy commit planu;
- testy lifecycle, fail-closed, restart/backoff, deduplikacji, generacji i trigger ownership;
- lokalny fixture backendu dla exact remote before/after.
