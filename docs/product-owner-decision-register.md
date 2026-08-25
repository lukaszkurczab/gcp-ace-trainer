# Patternly — bieżący rejestr decyzji właściciela produktu

Ten dokument zawiera wyłącznie dane lub zgody, których nie można bezpiecznie
wywnioskować z repozytorium. Zachowanie produktu definiuje
`canonical-product-contract.yaml`; kolejność pracy i status definiuje
`launch-completion-plan.md`.

## Decyzje już przekazane

- Publiczna strona powstaje w lokalnym repozytorium `patternly-web`; nie jest
  teraz publikowana ani wypychana do zdalnego GitHub.
- Jedynym administratorem ma być konto `lukasz.kurczab@gmail.com`. Backend musi
  sprawdzać to po stronie serwera po zweryfikowaniu tożsamości — sama strona nie
  może nadawać uprawnienia.
- Modele tożsamości pozostają zgodne z kontraktem: email/hasło, Apple, Google i
  kody odzyskiwania.
- Sprzedawcą podanym przez właściciela jest Łukasz Kurczab. To nie jest jeszcze
  komplet danych wymaganych do sprzedaży konsumenckiej.
- Kontaktem wsparcia i prywatności ma być `lukasz.kurczab@gmail.com`. Właściciel
  zatwierdza finalne dokumenty konsumenckie i prywatności.
- Pierwszym rynkiem jest Polska. Zwykła retencja zgłoszeń treści i dowodów
  usunięcia wynosi 30 dni, chyba że bezwzględnie obowiązujące prawo wymaga
  dłuższego okresu.
- Ochroną zgłoszeń niepowiązanych z kontem jest Firebase App Check wraz z
  backendowym rate limitingiem.
- Właściciel wybrał Cloud Firestore jako jedyny produkcyjny magazyn danych kont,
  synchronizacji i raportów. Firebase Authentication i App Check pozostają
  granicami tożsamości/ochrony. Obecny backend PostgreSQL ma zostać przepisany
  na Firestore, a nie przykryty adapterem lub utrzymywany równolegle.
- Roboczą architekturą publicznych originów jest `learnpatternly.com`: strona,
  polityka, regulamin, pomoc i usuwanie pod główną domeną, API pod
  `api.learnpatternly.com`, a redirecty uwierzytelniania pod
  `auth.learnpatternly.com`. Domena nie została kupiona ani sprawdzona w rejestrze
  znaków towarowych; nie wolno jej publikować przed tymi kontrolami.
- Jako polska baza cenowa do wdrożenia przyjęto: Premium 30 dni — 49 zł brutto,
  Premium 90 dni — 119 zł brutto oraz Premium roczny odnawialny — 199 zł brutto
  rocznie. Free pozostaje bezpłatny. Konkretne identyfikatory produktów i
  waluty poza Polską są konfiguracją sklepów, nie nową decyzją produktową.

## Otwarte dane właściciela i zewnętrzne gate’y

| Gate | Status | Niezbędny wkład | Blokuje |
| --- | --- | --- | --- |
| Dane sprzedawcy | `owner-decision-required` | Publiczny adres do publikacji oraz potwierdzenie prawnej formy sprzedaży. Właściciel zamierza działać bez rejestrowanej działalności do chwili prawnego obowiązku; przed sprzedażą wymaga to weryfikacji prawnej i podatkowej. | Regulamin, politykę prywatności, checkout i publiczną publikację. |
| Treść prawna i podatkowa | `owner-decision-required` | Właściciel zatwierdza finalny regulamin, prywatność, reklamacje i zasady treści cyfrowych po uzupełnieniu adresu oraz weryfikacji prawnej. | Sprzedaż konsumencką w PL/UE i deklaracje sklepowe. |
| Domeny i nadawca | `external-gate` | Rejestracja i kontrola znaku dla `learnpatternly.com`, DNS, originy auth/support/privacy/deletion i domena nadawcy. | Linki produkcyjne, Apple/Google auth i publiczne dokumenty. |
| Firebase i operacje backendu | `external-gate` | Projekt Firebase, Firestore, App Check, konto usługowe/IAM, wdrożenie, monitoring, retencja, PITR i odzyskiwanie. | Logowanie, synchronizację, admin, raporty i usuwanie kont. |
| Sklepy i billing | `unknown / needs evidence` | Należy ustalić, czy istnieją już konta Apple Developer, App Store Connect, Google Play, RevenueCat i EAS. Są to portale/konta potrzebne do podpisu, publikacji oraz testu zakupu/restore; nie wolno przekazywać sekretów ani tokenów w dokumentacji. | Premium i kandydaty do publikacji. |
| Finalna decyzja wydania | `owner-decision-required` | Jednoznaczne GO/NO-GO po wszystkich dowodach wewnętrznych i zewnętrznych. | Publiczny launch. |

Nie otwieramy ponownie ustalonego scope'u ośmiu ścieżek, guest-first Free,
braku AI mock interview ani modeli Premium. Brak wpisu nie jest brakiem decyzji:
pozostałe ustalenia należą do kontraktu i kodu.
