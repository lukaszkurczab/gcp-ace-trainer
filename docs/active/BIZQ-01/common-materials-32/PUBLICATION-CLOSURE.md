# BIZQ-01 — rozstrzygnięcie publikacji pakietu 32

PO 06.10.2026 wybrał: **obrazy prywatnie; tylko receipts/flows**. Osobno powierzył zależność Guest adoption_pending właścicielowi ARCH-03. [Dokładne decyzje](PO-DECISIONS-2026-10-06.json). Nie skontaktowano właściciela i nie zakłada się jego dostępności.

Pakiet32 ma istniejący niezależny i root PASS wyłącznie dla wykonanego natywnego zachowania i preservation. Niniejsze rozstrzygnięcie pozwala zamknąć publikację ograniczonego pakietu receipts/flows; nie jest nowym runtime testem ani odbiorem Premium/Q13/pełnego BIZQ. Raport, manifest oraz receipts QA zostały zamrożone przed rozstrzygnięciem i zachowują historyczne pending. Ich SHA pozostają niezmienione; aktualny stan publikacji wynika z tego dokumentu i decyzji PO.

Wszystkie9 obrazów oraz surowe logi, hierarchy i snapshoty pozostają poza Git. PRIVATE-SCREENS-MANIFEST wiąże prywatne obrazy ze SHA; checkout sam nie zawiera pikseli, a po utracie prywatnych plików ich osobisty przegląd nie będzie odtwarzalny wyłącznie z Git. Aktualny preflight potwierdził9/9 hashów i17/17 frozenbindings. Nie odtworzono fikcyjnych dowodów.

Do spójnego pakietu dołączane są niejawne receipts30 po pushu, źródłowy plan/review/blocker31 i ograniczony readonly02/12, na które wskazują aktualny stan i rozliczenie dowodów. Brak zmian produktu, schematów, persistence, scoringu, zależności lub runtime; dotychczasowe testy implementacji i CI30 pozostają dowodami swojego zakresu, bez deklaracji rerun. Weryfikacja publikacji obejmuje exact frozenbindings, granice własnych plików, brak prywatnych artefaktów i zachowanie foreignfooter/pozostałych wierszy kolejki.
