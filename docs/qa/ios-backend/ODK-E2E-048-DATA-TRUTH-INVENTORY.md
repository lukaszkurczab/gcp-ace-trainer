# ODK-E2E-048 — inwentarz prawdy o danych

Status: VERIFIED_CLOSED

## Model danych

| Zakres | Lokalnie | Chmura / sync | Eksport |
| --- | --- | --- | --- |
| Wybrany track | Tak | Tak | W synced progress/context |
| Ukończone sesje, wyniki, próby, review | Tak | Tak dla konta | Tak |
| Aktywna sesja, draft i timer | Tak | Nie | Nie |
| Cele, preferencje i reminders | Tak | Nie | Nie |
| Profil i stan konta | Wiązanie lokalne | Tak | Tak |
| Content reports | Lokalny outbox do potwierdzenia | Powiązane raporty | Tak |
| Access, entitlements i devices | Nie jako learning snapshot | Tak | Tak |
| Legal, purchase, sync i consumer-case context | Nie jako learning snapshot | Tak | Tak |

Lokalny store jest szyfrowanym MMKV. Sync ma allowlistę wspieranych rekordów. Nie ma importu pliku `account-data-export-v1`.

## Ocena aktualnego copy

| Twierdzenie | Ocena | Wniosek |
| --- | --- | --- |
| Learning data is stored locally | Niepełne dla konta | Wspierane ukończone rekordy mogą być też w chmurze. |
| Download synced account data | Prawda, skrótowa | Operacja tworzy JSON, otwiera share/save sheet i usuwa plik cache. |
| Zakres eksportu | Niepełny | Backend dodaje więcej account context niż wymienia ekran. |
| Account records restore only through adoption | Mylące | Zwykły sync odtwarza cloud records. Adoption scala postęp gościa. |
| Active sessions, drafts, settings i local-only data są pominięte | Prawda | Zgodne z allowlistą sync i manifestem eksportu. |
| Guest może użyć publicznego kanału | Prawda | Ekran otwiera skonfigurowany support URL. |
| Guest może usunąć dane lokalnie | Prawda o systemie, brak akcji na ekranie | Kanoniczny reset istnieje, ale Your data go nie wywołuje. |
| Non-auth = guest | Fałszywe uproszczenie | Kod obejmuje też signed-out, loading, blocked, deletion-pending i revoked. |

## Reset, usunięcie i retencja

- Lokalny reset usuwa wspierany stan nauki. Nie usuwa wszystkich preferencji.
- Sign-out najpierw synchronizuje oczekujące zmiany, potem czyści wiązanie i account-owned local data.
- Account deletion synchronizuje, usuwa dane zdalne, weryfikuje proof i czyści lokalny zakres konta.
- Backend zachowuje ograniczony tombstone oraz dowód usunięcia zgodnie z polityką prywatności.
- Szczegółowe okresy retencji mają kanoniczne źródło w Privacy Policy. Krótki ekran nie powinien ich duplikować bez potrzeby.

## Zadania następcze

- ODK-E2E-104: zagnieżdżone tłumaczenia.
- ODK-E2E-105: local/cloud i restore/adoption copy.
- ODK-E2E-106: jawne stany sesji.
- ODK-E2E-107: lokalny reset.
- ODK-E2E-108: zakres oraz nazwa akcji eksportu.

## Decyzje PO po audycie zbiorczym

- `106=A`: ekran pokazuje jawne stany sesji i bezpieczne akcje.
- `107=A`: Your data udostępnia kanoniczny lokalny reset z potwierdzeniem i opisem zakresu.
- `108=A`: eksport używa krótkiego pełniejszego opisu oraz nazwy „Share or download”.

Liczniki tych decyzji pozostają 0/5. Zadania pozostają aktywne do implementacji i retestu.
