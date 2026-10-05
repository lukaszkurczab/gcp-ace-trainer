# BIZQ-01 — pakiet30: zapisany partial i wspólny renderer

Cel pakietu to ograniczony odbiór zapisanej odpowiedzi Claude, q3/10, w light/dark przy maksymalnym Dynamic Type. Nie utworzono nowej sesji, nie zmieniono tracka ani odpowiedzi. Priorytet PO06.10 dotyczy ogólnej ścieżki uczenia i jej prezentacji; wymagania treściowe BIZQ-01 pozostają jawne. Pełny odbiór pakietu dokumentują osobno [niezależny QA](ACCEPTANCE-QA.md) i [root acceptance](ROOT-PACKAGE30-ACCEPTANCE.json); niniejszy raport opisuje zamrożoną implementację i dowody.

## Naprawa i jej przyczyna

Root potwierdził rzeczywisty defekt: cała karta A była widoczna, a tekst kończył się na „supervisor acceptance i”, zamiast pełnego „in a later review.”. Pierwsze hipotezy zmiany flex/width oraz usunięcia kontenera nie usunęły ucięcia. Aktywne drzewo React wykazało pełny tekst i aktualną strukturę renderera, więc nie był to stary bundle ani skrócony bank.

[Natywny pomiar](NATIVE-TEXT-LAYOUT-PROBE.json) pokazał ramkę 307,999877 pt zamiast 308 pt dla siedmiu linii po 44 pt. To ten sam typ granicy fizycznego piksela, który udowodniono dla feedbacku w28. [Rewizja planu](OPTION-HEIGHT-REPAIR-PLAN.json) uzyskała niezależny Luna High design PASS: dopasowanie0,96/prostota0,88/ryzyko0,87/utrzymywalność0,91; minimum0,87. Root zaakceptował ją przed implementacją.

`AnswerOption.tsx` używa teraz lokalnego `OptionTextLayout`, resetowanego przez tekst, szerokość okna, fontScale, physicalScale, literę badge i stan odpowiedzi. Dwie ostatnie wartości mogą zmienić dostępną szerokość tekstu bez zmiany okna; Pressable zachowuje tożsamość. Pierwszy poprawny onLayout nadaje minimum zaokrąglone do siatki pikseli plus jeden fizyczny piksel. Kolejne callbacki nie zwiększają minimum. Zbędny `answerContent` usunięto. Zachowano cap2, role, checked/disabled, labels/value oraz style stanów. Nie ma stałej wysokości, warunku dla pytania, loggera ani zmiany punktacji.

Dotychczasowy `src/features/practice/feedbackTextHeight.ts` przeniesiono do `src/components/textLayoutHeight.ts` i nadano neutralne nazwy exports. Feedback oraz opcje korzystają z jednej implementacji. [Ścisłe porównanie po normalizacji nazw/importów](FEEDBACK-REUSE-JUSTIFICATION.json) potwierdza identyczność całego helpera i `PracticeFeedbackBlock` z HEAD bazowym. Dwa istniejące testy dostosowano do importów; dwa nowe przypadki sprawdzają rzeczywisty callback opcji dla zaobserwowanej granicy, brak pętli wzrostu i reset pomiaru bez zmiany kontrolki.

## Faktyczny zakres dowodów

| Kryterium | Dowód i granica |
| --- | --- |
| Pełny prompt i wszystkie pięć opcji light/dark/max | [42 końcowe obrazy](FINAL-SCREENS.json): po20 nakładających się ujęć na motyw oraz zwykły powrót do wyniku/Home. Root obejrzał01–10 i20 obu motywów;11–19 powtarzają zamknięty dół Details. A ma czytelny pełny koniec. |
| Partial i rozróżnienie stanów | Zapisany wynik to selectedB/correct, omittedD/dashedcorrect, pozostałe neutralne; banner Partly correct. Końcowy summary nadal9correct/1partlycorrect,29/34. Nie jest to nowy dowód wrong-selected ani repairedOOD. |
| Omitted feedback, Reason, pięć Details, Source i reachable Next | [48 świeżych wcześniejszych ujęć](RECOVERED-SCREENS.json), osobiście obejrzanych przez root; [uzasadniony reuse](FEEDBACK-REUSE-JUSTIFICATION.json) niezmienionego zachowania feedbacku po neutralnym przeniesieniu. Końcowe body potwierdza pełny Reason, dostępne Details i Next. Next nie naciskano do q4. |
| Rzeczywiste otwarcie źródła | [Jedno zwykłe naciśnięcie Source](SOURCE-OPENING-EVIDENCE.json) otworzyło Safari pod właściwym pełnym URL: Claude Platform Docs, Prompt engineering overview, rzeczywisty body. Cookie/suggestions controls pozostały nietknięte. Widoczność z29 nie została rozszerzona na ten dowód. |
| Powrót i kontynuacja | Z Safari aplikacja wróciła na GCPHome; zwykła Activity→ta sama sesja→Review→q3 została wykonana. Nie deklaruje się retained-position. Po Q12 wykonano q3→summary→PracticeHub→GCPHome przez zwykłe kontrolki; [log](RETURN-RESTORED-GCP.log). |
| Preservation i OS | [Fresh recovered baseline](RECOVERED-BASELINE-MANIFEST.json), [final exact comparison](ROOT-FINAL-PRESERVATION.json): identyczne81records/84keys, Guest, fences, goals/plans/progress/settings, SDK undetermined/0; dark/Large przywrócone i odczytane.79raw+2ograniczone redacted projections;3metadata values unread — bez whole-store claim. |
| Semantics i callbacki | [Wykonane kontrole](ROOT-CHECKS.json):27 unikalnych focused cases PASS, typecheck PASS, recovery inventory/boundaries PASS. VoiceOver nie testowano. |

## Runtime i nieudane obserwacje

Przed UI zweryfikowano źródła16bindings recovery review i zapisano [atomową akceptację addendum](ROOT-RUNTIME-RECOVERY-ACCEPTANCE.json). Cached CLI15.30.1 nieoczekiwanie pobrał wybrany Firestore1.22.0 i usunął1.21.0. Root zatrzymał wyłącznie własne procesy. [Niezależnie zrecenzowana rewizja](RUNTIME-RECOVERY-REVISION.json) dopuściła wyłącznie ponowne uruchomienie już istniejącego, zgodnego z CLI/hash cached jar; bez dalszych pobrań/aktualizacji. Jeden Auth19099/Firestore18081, expired dev:smoke8080 i Metro8081 przeszedł readiness. Pierwszy snapshot odmówił odczytu w trakcie ładowania; świeży odczyt po GCPHome był zgodny z zachowanym checksum. Nie odtworzono utraconych plików ani nie ominięto probes.

Nieudane guards banner/translation/viewport, source-before-load, return-position oraz kierunek UP po remount są opisane w receipts i [capture corrections](CAPTURE-CORRECTIONS.md). Nie są oznaczone jako defekty produktu. Nieskuteczne hipotezy szerokości i direct-row mają osobne superseded receipts. Zakończona diagnostyka native jest zachowana jako jawny eksperyment; tymczasowy logger usunięto przed końcowymi dowodami.

## Ograniczenia i następny krok

Pakiet nie zamyka pełnego Q12 ani BIZQ-01: pozostają commonQ01–Q13/iOS, long repaired options/Premium oraz rzeczywisty active package updateQ13. Nie oceniono skuteczności edukacyjnej, zakupu/RevenueCat, notification delivery ani release readiness. OOD/admission23/24 pozostają odebrane bez ponawiania. Następny pakiet należy wybrać z jedynej kanonicznej kolejki według dostępnej luki mechanizmu, uwzględniając osobny plan/preservation dla autoryzowanego lokalnego authenticated Premium path i zależnego Q13. Push nie uzasadnia zmiany obszaru.
