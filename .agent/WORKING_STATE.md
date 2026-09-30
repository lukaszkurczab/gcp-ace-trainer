# Patternly — skrócony stan pracy

Kanoniczna kolejka, decyzje właściciela i acceptance contracts są w [`docs/PATTERNLY-WORKING-PLAN.md`](../docs/PATTERNLY-WORKING-PLAN.md). Zawsze sprawdź bieżący HEAD, working tree, testy i konfigurację przed wznowieniem zadania.

## Aktywne zadania

- `UI-26-11`: implementacja i podstawowy edit/back/accept są gotowe; dokończyć brakujące stany runtime, warianty 1/7 dni i target date, błędy oraz rapid tap. Szczegóły w kanonicznym planie i [`docs/active/UI-26-11/AUDIT.md`](../docs/active/UI-26-11/AUDIT.md).
- `AUD-15`: partial; potrzebny odseparowany fixture dla multi/partial oraz pełny duży tekst bez zapisu do chronionego profilu. Raport częściowy: [`docs/active/AUD-15/REPORT.md`](../docs/active/AUD-15/REPORT.md). VoiceOver nie jest kryterium.
- Android sandbox: email/hasło działa na Redmi Note 11 po naprawie konfiguracji i promocji backendu sandbox. W bieżącym źródle poprawiono początkowy stan automatycznego unieważniania sesji z `signOutPending` na istniejący ekran ładowania; `signOutPending` zostaje przy rzeczywistym błędzie. Testy powiązane i typecheck przeszły, izolowany eksport Android zakończył się powodzeniem. Zachowanie na telefonie nie jest zweryfikowane, bo urządzenie było odłączone. Ta poprawka nie została opublikowana przez EAS; nie publikować w ramach porządków.

## Ochrona pracy

- Zachować wszystkie istniejące zmiany working tree, konta/testy auth, niepowiązane zmiany `AccountEntryScreen` i lokalne stashes. Nie resetować konta, danych profilu ani emulatorowego datastore.
- Zachować stashes: `UI-26-02B`, `UI-26-11`, `UI-26-09`, `UI-26-08`, `UI-26-07`, `I18N01`. Są niezależnymi wersjami zmian i nie zastępują aktualnego diffu.
- Przed testem runtime użyć istniejącego iPhone'a 17 zgodnie z kanonicznym planem. W tym porządkowaniu nie tworzyć urządzeń, nie publikować buildów i nie wykonywać deployów.
