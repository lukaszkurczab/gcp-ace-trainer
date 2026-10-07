# Q13 — aktualizacja pakietu przy aktywnej sesji

Priorytet i status: [plan główny](../../PATTERNLY-WORKING-PLAN.md), BIZQ-01. Cel i AC: [Q13 w specyfikacji](../business-quality/01-BIZQ-01-JAKOSC-PYTAN-I-OBJASNIEN.md). To pozostały rzeczywisty odbiór, bez nowej redakcji OOD.

## Potwierdzony punkt rozpoczęcia07.10

App ma kod e889b05 i OOD24; Claude845 jest bieżącym katalogiem. Operacje feedback 33 i Guest34 są wdrożone. Testowa para OOD23/content-lock z niedokończonej próby została przywrócona do HEAD24. Oryginalny Gość został usunięty zgodnie z dyspozycją PO; nowy Gość i dziewięć chronionych kont nie są autoryzowane do kolejnego zbiorczego usunięcia.

Poprzednie próby kończyły się przed sesją: private-copy storage preparation/nonce capability, nie zaobserwowany błąd exact resume po aktualizacji. Prywatny manifest i checkouty starych narzędzi nie istnieją. Nie używać ich historycznych receipts jako aktualnego planu lub native dowodu.

## Bieżące pliki i kontrakt

- `src/application/contentPackageRuntimeOwner.ts`: resolveExactArtifact używa exact track/version/hash, następnie profile-scoped retained installed packages; registerInstalledNodePackage nie dodaje pakietu do discovery. Bez exact package zwraca jawny błąd; nie wybiera bieżącego katalogu po samym trackId.
- `src/content/application/nodePackageStoreComposition.ts` i `src/content/runtime/nodePackageStorage.ts`: źródło zweryfikowanych installed packages i profile scope.
- `src/application/trainingLifecycle/TrainingLifecycleUseCases.ts`, `src/application/design-interview/designInterviewSessionFacade.ts`: resume, persisted plan, occurrences, responses i lifecycle/journal; istniejące odpowiednie tests są punktem odniesienia.
- `src/content/generated/canonical-content/{object-oriented-design-interview.json,content-lock.json}`: bieżąca24para. Bytes zaakceptowanej23pary są w Git `ea4f3d61b39bab6b9f12ace73b34721d0d6e717a`; nie jest to zgoda na checkout starego kodu aplikacji.

Jeżeli exact poprzednia wersja jest rzeczywiście dostępna, sesja może użyć tylko jej utrwalonego planu i pytań. Jeżeli jej brak, właściwym wynikiem jest explicit mismatch/unavailable z zachowaniem odpowiedzi i historii. Powrót do bieżącego catalog nie może podmienić sesji ani zaliczyć poprzednich attempts do nowej wersji.

## Najmniejszy następny pakiet

1. Otworzyć istniejący iPhone17 i sprawdzić installed app/build identity oraz obecny sposób połączenia Debug/Metro. Używać głównego checkoutu po porządkach, jednego urządzenia i obecnych runtime/test entrypoints. Brak działającej metody przygotowania testowych danych rozstrzygnąć najmniejszym bezpiecznym probe przed budową nowego tooling; nie tworzyć drugiej instalacji/nonce infrastruktury dla wygody.
2. Wybrać jedną izolowaną testową sesję z poprawnie potwierdzonym Premium. Zapisać exact content ref, utrwalony plan/option order i odpowiedź przed zmianą. Oddzielić learning progress, settings, identity/registry/journal oraz cache/package records w preservation assertions. Nie logować raw kont ani sekretów.
3. Zmienić wyłącznie spójną zaakceptowaną parę catalog/lock według reviewed test procedure, potwierdzić bytes i wykonać cold relaunch. Sprawdzić rzeczywisty resume albo explicit unavailable według dostępności exact package. Nie utożsamiać HMR z cold persistence.
4. Wymagane AC: brak podmiany prompt/options/answer, stare exact refs i records zachowane, brak nowego submit/re-score pod bieżącym hash, profil i konta poza testem zachowane. Powtórny restart daje ten sam jawny stan. Screenshot potwierdza prezentację; osobne before/after state assertions potwierdzają dane. Przywrócić current catalog/lock po próbie i sprawdzić ordinary Home.
5. Aktualizować tylko plan i working state po niezależnym odbiorze. Wersjonować wyłącznie rzeczywiście potrzebne odtwarzalne narzędzie; per-run flows, captures i raw logs są tymczasowe. Zakres nie obejmuje Guest deletion, zmian providera, zakupów, deployu ani całego nowego storage frameworka.

To plan odbioru Q13, nie deklaracja wykonanego native testu. Jeżeli probe wykaże konkretny brak runtime capability, raport wskazuje bezpieczny etap i minimalną korektę; nie powtarzać niezmienionych nieudanych prób.
