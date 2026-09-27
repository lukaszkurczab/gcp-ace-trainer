# Patternly — trwały stan pracy

Aktualny kanoniczny plan: [`docs/PATTERNLY-WORKING-PLAN.md`](../docs/PATTERNLY-WORKING-PLAN.md).

## Obowiązujące decyzje

- Brak realnych użytkowników i danych produkcyjnych: kompatybilność lokalnych buildów sprzed pierwszego wydania nie jest wymaganiem.
- Jeden bieżący Gość; brak selektora i odzyskiwania wielu historycznych profili.
- Lokalne testy iOS na istniejącym iPhonie 17; bez duplikatu urządzenia/aplikacji bez nowej konkretnej potrzeby.
- Częściowo odzyskane poprawne dane pozostają dostępne. Komunikat incydentu można zamknąć trwale, a brakujący plan jest odzyskiwany automatycznie w tle z kontrolowanym backoffem. Dismiss nie zatrzymuje retry.
- Niepewna własność lub nieodseparowalne uszkodzenie pozostają fail-closed.

## Bieżący stan

- PROFILE-01–06, AUD-17 i powiązany historyczny fixture są zamkniętym baseline'em. Nie odtwarzać tych tasków ani ich raportów.
- `RECOVERY-01` jest zamknięte dowodowo i usunięte z aktywnego planu. Read-only retry działa na bootstrapie incydentu, reconnect, foreground i timerze; atomowy merge nie przesuwa globalnej rewizji konta.
- `I18N-01` jest zamknięte dowodowo. Runtime obsługuje siedem locale bez fallbacku, ręczny i systemowy wybór są trwałe, a DE/FR/ES/IT/ET przeszły osobne review i re-review `gpt-6-luna high`. Dokumenty prawne używają bezpośredniej mapy locale; niezatwierdzone drafty są jawne poza release, a release pozostaje fail-closed.
- `UI-26-07` ma gotową implementację i zielone targeted 37/37, typecheck oraz runtime base/error/success/duży tekst, ale niezależny `qa-gate` pozostawił status `BLOCKED`: Apple nie udostępnia VoiceOver w Simulatorze, a plan wymaga rzeczywistego focus/announcement. Cały diff z raportem zachowuje nazwany stash `UI-26-07 awaiting physical VoiceOver 2026-09-27`; wznowić wyłącznie na fizycznym urządzeniu iOS i ponowić QA.
- `UI-26-08` ma gotową implementację, siedem locale, zielone targeted 53/53, typecheck i runtime password base/error/reauth→hold oraz light/duży tekst. Niezależny `qa-gate` pozostawił `BLOCKED` wyłącznie na rzeczywistym VoiceOver; diff i raport zachowuje stash `UI-26-08 awaiting physical VoiceOver 2026-09-27`.
- `UI-26-09` ma gotową implementację, zielone targeted 82/82, typecheck oraz runtime layout dark/standard i light/duży tekst. Niezależny `qa-gate` pozostawił `BLOCKED`: brakuje rzeczywistego retry success/failure, sign-out failure, runtime najdłuższego locale i VoiceOver na fizycznym iOS. Diff, raport i screenshoty zachowuje stash `UI-26-09 awaiting runtime and physical VoiceOver 2026-09-27`.
- `UI-26-10` jest zamknięte dowodowo. Standardowy `Sign in` nie zależy od `pendingRemoteRevokeCount`; usunięto wyłącznie warning i martwe copy, a durable queue pozostała bez zmian. Targeted 54/54, typecheck, realny logout na iPhonie 17 i niezależny `qa-gate` zakończyły się PASS.
- `UI-26-11` ma gotową implementację, presentation/locale 14/14, szerszy subsystem 57/57, typecheck oraz runtime ready dark/standard, light/accessibility-extra-large i rzeczywisty edit/back/accept. Niezależny `qa-gate` pozostawił `BLOCKED`: brakuje runtime shortened/shortfall/loading/stale/unavailable, wariantów 1/7 dni i target present, błędów i rapid tap dla Edit/Accept oraz VoiceOver na fizycznym iOS. Diff, raport i screenshoty zachowuje stash `UI-26-11 awaiting runtime matrix and physical VoiceOver 2026-09-27`.
- `UI-26-02A` jest zamknięte dowodowo. `docs/active/UI-26-02A/CONTRACT.md` definiuje provider-only Sign in, istniejącą i nową identity, dwa osobne działania Terms acceptance/Privacy acknowledgement, atomową rejestrację, fail-closed locale, lifecycle/retry i izolację Gościa. Brief validator Luna High po redesignie: minimum 0,84 APPROVED; niezależny `qa-gate`: PASS. Dokument pozostaje aktywnym wejściem implementacji `UI-26-02B`.
- `UI-26-02B` ma gotową implementację w app oraz test-only backend evidence. App: focused 55/55, szeroki subsystem 237/237, typecheck i diff-check; backend: typecheck oraz izolowane Auth/Firestore exchange 2/2. Maestro na istniejącym iPhonie 17 potwierdziło providery wyłącznie na Sign in; Apple doszedł do systemowego wymagania zalogowania Apple ID. Niezależny końcowy `qa-gate` nie znalazł konkretnego defektu kodu, ale wydał `BLOCKED`: brakuje zintegrowanego runtime mapped-existing, unmapped-provisional i Guest A → account B isolation. App wraz z raportem zachowuje stash `UI-26-02B awaiting provider runtime matrix 2026-09-27`; backend evidence zachowuje stash `UI-26-02B exchange evidence awaiting provider runtime matrix 2026-09-27`.
- `UI-26-01` jest zamknięte dowodowo. Welcome używa zatwierdzonego znaku QA-A w rozmiarze 96, Mint w Dark i navy w Light, ma zatwierdzone EN copy i semantyczne tłumaczenia siedmiu locale. Targeted 38/38, typecheck, Maestro na iPhonie 17 dla Dark/standard i Light/accessibility-extra-large ze scrollem oraz niezależny `qa-gate` zakończyły się PASS; logika trzech wejść pozostała bez zmian.
- `UI-26-03` jest zamknięte dowodowo. Footer wyboru tracku ma jedną akcję `Start track`; usunięto redundantne summary i martwe klucze locale, zachowując radio selection i zapis dokładnego `track.id`. Targeted controller 15/15, niezależne QA 19/19, typecheck, Maestro standard/duży tekst z rzeczywistą zmianą dwóch tracków oraz końcowy `qa-gate` zakończyły się PASS.
- `UI-26-04` jest zamknięte dowodowo. Ikona głównej karty Home jest wyrównana do góry treści w bazowym wierszu; duży tekst zachowuje istniejącą kolumnę `flex-start`, a cztery gałęzie primary action są nietknięte. Testy Home 8/8, typecheck, Maestro i screenshoty standard/duży tekst oraz końcowy `qa-gate` zakończyły się PASS.
- Następne dostępne zadanie zgodnie z kolejką: `UI-26-05`.
- Następna pełna kolejka, kryteria i report targets są wyłącznie w planie.

## Higiena dokumentacji

`docs/active/` przechowuje wyłącznie materiały bieżących zadań. Git jest archiwum zakończonych raportów, screenshotów, manifestów i flow Maestro. Po zamknięciu zadania nie utrzymywać jego statusu w aktywnym planie ani osobnej historycznej kolejki.
