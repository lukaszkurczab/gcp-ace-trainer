# AUD-FIXTURE/B3a — izolowany fixture backendu

**Data:** 24.09.2026. **Status:** `done` dla syntetycznego konta i danych backendowych; natywna atestacja ownera pozostaje `blocked` w B3b/B2b-device.

**Ocena przed zmianą:** niezależny briefing `Cel`, `Ustalenia`, `Podejście` otrzymał 0,90 dla zgodności, architektury, prostoty, ryzyka i utrzymywalności; minimum **0,90**. Test realizuje izolowany zakres backendu, bez obietnicy urządzeniowego E2E.

## Zmiana

Backendowy `tests/isolatedProgressFixture.emulator.test.ts` używa unikalnego projektu `demo-patternly-*`, jawnych uchwytów Admin Auth i Firestore oraz własnego użytkownika. Przez rzeczywisty store postępu zapisuje kanoniczne `training_attempt` i `review_queue_entry`, ponownie tworzy kontekst usługi i dwukrotnie odczytuje identyczne rekordy. Cleanup usuwa tylko `users/<własny uid>` i własne konto Auth; pozostałe kroki cleanup są podejmowane nawet po błędzie jednego z nich. Brak uchwytu lub błąd usuwania jest jawnie zgłaszany. Oba adresy emulatorów muszą wskazywać loopback przed utworzeniem konta. Test nie wywołuje `clearFirestore()` ani nie zapisuje w `patternly-app-sandbox`.

## Weryfikacja i ograniczenie

Na działających lokalnych emulatorach Auth `127.0.0.1:19099` i Firestore `127.0.0.1:18081` ukierunkowany test przeszedł **3/3**; `npm run typecheck` i `git diff --check` **PASS**. Niezależne QA po dwóch korektach: **PASS**. Odrzucono wcześniejszą ścieżkę cleanup, która mogła pominąć dokument po błędzie ponownej inicjalizacji, oraz brak walidacji adresu Auth. Negatywne testy obejmują kontynuację cleanup po błędzie i odrzucenie nielokalnego Auth hosta.

Fixture sprawdza kontrakt store, nie pełną rejestrację HTTP/token verifier ani zachowanie iPhone’a. B3b/B2b-device wymagają wspieranej ścieżki syntetycznego `legacy_owner` na istniejącym iPhonie bez naruszenia bieżącego Guest; [rozpoznanie](B3-FEASIBILITY.md) wskazuje, że takiej ścieżki obecnie nie ma.
