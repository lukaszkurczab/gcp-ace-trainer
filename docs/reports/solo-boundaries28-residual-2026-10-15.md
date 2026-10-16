# Prompt 28 / ARCH-08 — odbiór residualu ownerów, 15.10.2026

**PASS kodu i lokalny. Residual zamknięty; prompt29 nieuruchomiony.** [Manifest, komendy i hashe](solo-boundaries28-residual-2026-10-15.json). [Pierwszy, historyczny PARTIAL28](solo-boundaries28-2026-10-15.md) pozostaje bez zmian i nie stanowi deklaracji bieżącego RED.

## Cel, zakres i AC

Naprawić wyłącznie rzeczywistych ownerów accountDataRecordFingerprint oraz has/setPremiumTestingAccess. Zachować bytes/profil identity, typy rekordów, marker Premium, runtime gates, wyjątki, aktywnych konsumentów, WIP i piny. AC: istniejący checker wykazuje RED przed zmianą i GREEN po naprawie; zachowanie ownerów ma odrębne testy; niezależne review/QA; zero nowych wyjątków checkera. Najmniejsze sprawdzenia: mutation probe, docelowe behaviors,44 istniejące fixture i5 wariantów repo, typecheck/recovery/diff/refcheck.

Writer: główny agent. Niezależny design review i QA: osobni gpt-6-luna high. Dopasowanie0,98; prostota0,89; bezpieczeństwo0,95; utrzymywalność0,94; minimum0,89. Pierwotna hipoteza infrastructure identity leaf została skorygowana po review: ARCH-09 i workspace docs/11-implementation-guidelines.md wymagają neutralnego domain ownera. Nie dodano nowej polityki ani abstrakcyjnej platformy.

## Wynik i zmienione pliki

- `src/domain/identity/recordFingerprint.ts` jest jedynym ownerem account fingerprint. `src/domain/account/accountDataRecordIdentity.ts` przejmuje dokładnie siedem obecnych rodzajów i wejściowy kontrakt z niezmienioną unią recordType. Repository i application kierują do tej samej funkcji. Serializer, profile i shared vectors niezmienione.
- `src/domain/identity/sha256.ts` to bajtowo identyczna przeniesiona implementacja. `src/infrastructure/identity/sha256.ts` zachowuje aktywną ścieżkę importu jako re-export, bez drugiego algorytmu.
- `src/application/premiumTesting.ts` rzeczywiście posiada query/command i gate smoke/sandbox; `src/storage/repositories/premiumTestingRepository.ts` posiada wyłącznie read/write istniejącego device-local markera. Klucz, wartość, kolejność I/O i dokładny unavailable error pozostają zgodne. Usunięte repo has/set nie mają referencji. UI i content consumers niezmienione.
- Pozostałe zmienione źródło: `src/application/account/accountDataService.ts`, `src/storage/repositories/accountDataRepository.ts`.
- Testy: `src/application/premiumTesting.test.ts`, `src/storage/repositories/premiumTestingRepository.test.ts`, `src/domain/identity/recordFingerprint.test.ts`, `src/domain/identity/sha256.test.ts`. Behavioral gate tests przeniesione do rzeczywistego application ownera i rozszerzone, a nie zastąpione checkerem.

Łącznie12 plików kodu/testów; pełne hashe w manifeście. Dodatkowo tylko nowy pakiet dowodów oraz kanoniczny workspace plan i bieżący stan. Checker, reguły, fixture, UI, wcześniejsze WIP i raporty nie były edytowane w residualu. Zachowane compatibility re-exports mają żywych konsumentów; nie przywrócono starego API ARCH-07.

## Faktycznie wykonane sprawdzenia

- [Prechange mutation RED](solo-boundaries28-residual-2026-10-15/before-red.tap):1PASS/1FAIL, te same3 symbole/5 ścieżek, istniejąca reguła ARCH-04/05/F-06. BackendDiagnostics→account service→repo fingerprint oraz Settings (również przez Home)→premiumTesting→repo has/set.
- [Owner behaviors](solo-boundaries28-residual-2026-10-15/owners.tap):39/39 PASS. Account snapshots/outbox/sync/terminal wire i diagnostics; shared identity bytes/hash/rejection; SHA zgodny z Node crypto; Premium odmowa bez I/O w release/missing/unknown, działanie smoke/sandbox, exact marker/unrelated records i propagacja błędów storage.
- [Granice i fixture](solo-boundaries28-residual-2026-10-15/boundaries.tap):51/51 PASS, w tym44 direct/barrel/type/transitive/cycle/native/legal fixture,5 pełnych aktualnych wariantów repo oraz2 mutation tests. Repo GREEN bez filtrowania/allowlistowania residualu. Legalna delegacja application do persistence pozostaje legalna; UI nie importuje już wyeksportowanych funkcji repo przez fasadę.
- [Typecheck](solo-boundaries28-residual-2026-10-15/typecheck.log) i [recovery](solo-boundaries28-residual-2026-10-15/recovery.log): exit0. Diff check i refcheck: PASS. SHA przeniesiony byte-for-byte;149 zapisanych plików WIP zgodnych hashami, dependency pins i package-lock zgodne z HEAD.
- Niezależne QA:11/11 focused tests wykonane osobno, kontrola delta/bytes/referencji i149hashes; brak defektu implementacji. Pierwszy verdict PASS WITH GAPS dotyczył wyłącznie niezamkniętych wtedy dokumentów; finalny readback zapisany w manifeście po aktualizacji.

Najmniejszy real resolver probe i jego wnioski są w historycznym pakiecie28. W residualu nie budowano narzędzia ani nie zmieniano resolvera. Fresh RED i fresh repo matrix potwierdzają aktualne użycie checkera. Nie powtarzano pełnej wcześniejszej suit wyłącznie dla nowego stanu plików.

## Granice i przekazanie

Brak residualu28. ARCH-07/27 oraz odebrane22–26/M03 nie były ponownie wykonywane. Nie uruchamiano full suite/CI/native/build ani usług; ta zmiana ownerów nie wymagała symulatora. Dane właściciela, urządzenie, piny i banki nietknięte. Odbiór usług i wydania pozostaje osobny. Zachowane ryzyka checkera: statyczny explicit graph, prywatny Expo alias API i role wskazanych composition roots opisane w pierwszym raporcie; brak nowej bramki produktu.

Bez commit/push, publikacji, maili, automatyzacji, nowego celu lub wątku. Następny dopuszczalny prompt29; ta sesja go nie rozpoczyna.
