# ODK-E2E-080 — informacja przed raportem młodszego gościa

Status: `APPROVED_AND_IMPLEMENTED`

## Fakt architektoniczny

Aplikacja nie zna i nie zapisuje wieku gościa. Ma wyłącznie stan `guest`. Ochronę należy więc stosować do każdego raportu wysyłanego przez gościa, bez pytania o wiek i bez tworzenia nowej kategorii danych.

## Minimalny przepływ

1. Gość wybiera „Zgłoś problem”.
2. Otwiera się od razu jeden formularz. Nad kategorią widnieją dwie krótkie linie informacji oraz link `Pokaż szczegóły`; nie ma dodatkowego ekranu ani kroku „Kontynuuj”.
3. `Pokaż szczegóły` rozwija treść w tym samym arkuszu i zmienia się w `Ukryj szczegóły`. Nie używamy tooltipa: treść jest wtedy przewijalna, dostępna dla czytnika ekranu i nie znika przypadkowo.
4. Opis jest opcjonalny i ma limit 280 znaków. Sama kategoria wystarcza do wysłania raportu.
5. Rozpoznawalny e-mail, numer telefonu, URL, hasło lub kod blokuje zapis do outboxa i wysłanie. Tekst pozostaje do poprawy; aplikacja nie redaguje go po cichu.
6. Tę samą regułę egzekwuje backend, aby bezpośrednie wywołanie API nie omijało ochrony.
7. `Anuluj` zamyka formularz bez zapisu. Bezpieczny raport zachowuje istniejące retry offline.

To informacja przed dobrowolną transmisją, a nie zgoda prawna: nie ma checkboxa ani zapisu akceptacji.

## Hierarchia informacji

### Widoczne od razu

- krótka informacja, jakie grupy danych zostaną wysłane;
- krótkie ostrzeżenie z trzema zrozumiałymi przykładami danych prywatnych;
- `Pokaż szczegóły`;
- zwykły formularz: kategoria, opcjonalny opis, `Wyślij zgłoszenie`, `Anuluj`.

### Ukryte pod `Pokaż szczegóły`

- pełna lista technicznych pól: identyfikator i wersja zadania, ekran, język, wersja aplikacji, platforma i czas;
- informacja, że konto, kontakt i odpowiedź nie są dodawane automatycznie;
- informacja o technicznym użyciu adresu IP do ograniczania powtarzających się zgłoszeń;
- pełniejsza lista danych, których nie należy wpisywać: imię i nazwisko, adres, e-mail, telefon, hasło, kod i link.

## Copy PL

Tytuł formularza pozostaje: `Zgłoś problem z treścią`.

Treść widoczna: `Wyślemy kategorię problemu, opcjonalny opis i dane techniczne o zadaniu.`

Ostrzeżenie widoczne: `Nie wpisuj swojej odpowiedzi ani danych prywatnych, np. e-maila, telefonu lub hasła.`

Szczegóły: `Wysyłamy kategorię problemu, opis tylko jeśli go wpiszesz, identyfikator i wersję zadania, ekran, język, wersję aplikacji, platformę i czas zgłoszenia. Nie dodajemy automatycznie Twojego konta, danych kontaktowych ani odpowiedzi. Połączenie przekazuje serwerowi adres IP; serwer zamienia go na kod używany tylko do ograniczania powtarzających się zgłoszeń. Nie wpisuj imienia i nazwiska, adresu, e-maila, numeru telefonu, hasła, kodu ani linku.`

Akcje: `Pokaż szczegóły`, `Ukryj szczegóły`, `Anuluj`, `Wyślij zgłoszenie`.

Pole: `Dodatkowy opis (opcjonalnie)`; placeholder `Napisz tylko, co jest nie tak z tym zadaniem.`; pomoc `Nie wpisuj danych prywatnych ani swojej odpowiedzi.`

Błąd: `Usuń dane prywatne: e-mail, numer telefonu, link, hasło lub kod.`

## Copy EN

The form title remains: `Report a content issue`.

Visible body: `We send the issue category, an optional note, and technical details about the question.`

Visible warning: `Do not enter your answer or private information, such as an email, phone number, or password.`

Details: `We send the issue category, a note only if you write one, the question ID and version, screen, language, app version, platform, and report time. We do not automatically add your account, contact details, or answer. Your connection gives the server an IP address; the server turns it into a code used only to limit repeated reports. Do not enter your name, address, email, phone number, password, code, or link.`

Actions: `Show details`, `Hide details`, `Cancel`, `Send report`.

Field: `Extra details (optional)`; placeholder `Write only what is wrong with this question.`; help `Do not include private information or your answer.`

Error: `Remove private information: an email address, phone number, link, password, or code.`

## Kryteria akceptacji

- Każdy gość widzi dwie krótkie linie informacji na początku formularza; aplikacja nie pyta o wiek.
- Nie ma dodatkowego kroku ani osobnego ekranu informacyjnego.
- `Pokaż szczegóły` rozwija i zwija pełną informację w tym samym arkuszu.
- Anulowanie nie tworzy raportu ani wpisu lokalnego.
- Rozwinięta warstwa wymienia przekazywane dane i techniczne użycie IP.
- Pusty opis jest dozwolony; opis użytkownika ma maksymalnie 280 znaków.
- Wskazane wzorce danych prywatnych są odrzucane w aplikacji i API przed utrwaleniem.
- Odpowiedź ucznia, pełne wyjaśnienie, konto i e-mail nie są dołączane automatycznie.
- EN/PL oraz istniejące zachowanie offline/retry pozostają kompletne.

Filtr wzorcowy nie gwarantuje rozpoznania każdego imienia lub adresu, dlatego ostrzeżenie pozostaje widoczne i nie opisuje filtra jako pełnej ochrony.

## Zakres po zatwierdzeniu

- Mobile: `ContentReportSheet`, mały kanoniczny helper bezpieczeństwa opisu, EN/PL i testy zachowania.
- Backend: kontrakt raportu i testy odrzucenia niebezpiecznego opisu.
- Privacy Policy: jawna informacja o technicznym użyciu IP do ograniczania nadużyć.

## Uzupełnienia wymagane przez review prawne

Zrealizowane bez dodawania kolejnego ekranu lub kroku:

- widoczna informacja podaje cel poprawy zadania;
- szczegóły wymieniają losowy identyfikator zgłoszenia i token bezpieczeństwa aplikacji oraz zawierają link do istniejącego ekranu Polityki prywatności;
- formularz nie nazywa raportu anonimowym, lecz prawdziwie informuje o braku domyślnego powiązania z kontem i kontaktem;
- lokalne, niepotwierdzone raporty wygasają po 30 dniach;
- Privacy Policy podaje podstawę i interes dla celów raportowania oraz okres aktywnego okna identyfikatora rate-limit jako edytowalną zmienną.

## Ocena przed wdrożeniem

- Dopasowanie do celu i architektury: 0,94 — ochrona obejmuje właściwy stan bez zbierania wieku.
- Prostota: 0,96 — informacja mieści się w istniejącym formularzu; nie powstaje nowy krok ani ekran.
- Ryzyko: 0,86 — filtr wzorcowy ogranicza oczywiste dane, ale nie zastępuje ostrzeżenia.
- Utrzymywalność: 0,92 — ta sama reguła jest sprawdzana na obu granicach transmisji.
