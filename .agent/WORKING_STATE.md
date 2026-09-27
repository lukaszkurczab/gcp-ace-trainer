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
- Następne dostępne zadanie zgodnie z kolejką: `UI-26-02B`.
- Następna pełna kolejka, kryteria i report targets są wyłącznie w planie.

## Higiena dokumentacji

`docs/active/` przechowuje wyłącznie materiały bieżących zadań. Git jest archiwum zakończonych raportów, screenshotów, manifestów i flow Maestro. Po zamknięciu zadania nie utrzymywać jego statusu w aktywnym planie ani osobnej historycznej kolejki.
