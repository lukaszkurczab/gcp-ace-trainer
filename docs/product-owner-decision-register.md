# Patternly — bieżący rejestr decyzji właściciela produktu

## Zakres i zasada cleanupu

Ten dokument nie jest archiwum decyzji, dziennikiem rozmów ani katalogiem
odrzuconych opcji. Zawiera wyłącznie decyzje właściciela, które nadal wymagają
wyboru, autoryzacji albo zewnętrznego gate'u.

- Gdy decyzja zostaje podjęta, pytanie, alternatywy i wątpliwość znikają z tego
  rejestru.
- Gdy decyzja zostaje zastąpiona, poprzedni wpis znika; nie utrzymujemy
  `superseded` kopii ani historycznych tabel w aktywnym rejestrze.
- Gdy decyzja została zaimplementowana i jest już realną architekturą,
  zachowuje ją kod, kontrakt, manifest albo evidence — nie ten rejestr.
- Unikalne provenance/release/legal/security evidence pozostaje w swoim
  właściwym repozytorium evidence, ale nie jest przez to decyzją właściciela.
- Każdy cleanup musi usunąć z rejestru wpisy resolved, implemented, historical,
  superseded, duplicate oraz wszystkie macierze opcji, które nie prowadzą już do
  bieżącego wyboru.

`docs/canonical-product-contract.yaml` jest autorytetem dla ustalonego zachowania
produktu. `docs/launch-completion-plan.md` jest autorytetem kolejności prac i
statusu. Ten rejestr wskazuje wyłącznie pozostałe decyzje/gate'y właściciela.

## Aktualne decyzje wymagające właściciela lub zewnętrznego gate'u

| Gate | Status | Pozostały wybór lub autoryzacja | Blokuje |
| --- | --- | --- | --- |
| Flagged/new content review | `owner-decision-required` | Outcome dla nowych lub materialnie zmienionych elementów: approved, needs change albo rejected. | Tylko odpowiadający item/release. |
| Figma semantic approval | `owner-decision-required` | Owner approval wyłącznie dla nierozstrzygniętej semantyki lub realnego konfliktu z kontraktem. Geometria nie otwiera nowej decyzji. | Odpowiadający UI slice. |
| Commerce offer | `owner-decision-required` | Dokładne SKU, ceny, recurring period, product names i promocje. | Store/provider setup. |
| Store/provider release setup | `external-gate` | Apple, Google, RevenueCat, EAS, signing, store products i produkcyjna konfiguracja. | Commerce/release evidence. |
| Backend/provider operations | `external-gate` | Firebase, backend, App Check, IAM, deploy, billing, retention i recovery configuration. | Production operations. |
| Public origins | `external-gate` | Domain, DNS, email sender i public URLs. | Public/auth/legal release surfaces. |
| Legal/privacy | `owner-decision-required` | Final legal/privacy review and required disclosures. | Public release. |
| Organic beta feedback | `owner-decision-required` | Organic tester recruitment and feedback, without paid research. | Adoption confidence only. |
| Final release decision | `owner-decision-required` | Explicit owner GO/NO-GO after internal and external evidence is complete. | Launch. |

Brak wpisu dla ustalonego scope'u, baseline'u contentu, profile-specific session
lengths, Content Review Console boundary, product positioning, Premium modelu,
braku AI mock interview, solo operating modelu albo cleanup rule nie oznacza
braku decyzji. Te rzeczy są już zakodowane w kontrakcie, architekturze i planie;
nie wolno ponownie otwierać ich jako pytań właściciela.
