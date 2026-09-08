# ODK-E2E-049 — inwentarz Legal information

Status: VERIFIED_CLOSED

## Rola ekranu

Legal information jest krótkim przewodnikiem i hubem do przepływów prawnych. Nie jest pełnym dokumentem prawnym. Pełne dokumenty renderują osobne ekrany Privacy Policy i Terms of Service.

## Ocena sekcji

| Powierzchnia | Ocena | Wniosek |
| --- | --- | --- |
| Privacy and study use | Prawda | Trafnie opisuje rolę skrótu. |
| Local storage | Niepełne | Pomija chmurowy sync wspieranych rekordów konta. |
| Limits of protection | Prawda | Nie obiecuje anti-cheat, secure erasure ani ochrony przejętego urządzenia. |
| Independent study use | Prawda | Zgodne z Terms i brakiem oficjalnej certyfikacji. |
| Reset limits | Prawda lokalnie, niepełne globalnie | Nie rozróżnia account deletion, danych chmurowych i retencji dowodów. |
| Public legal links unavailable | Mylące | Niedostępny jest zewnętrzny Support. Lokalne Privacy i Terms działają. |
| Privacy i Terms | Prawda | Prowadzą do pełnych lokalnych dokumentów. |
| Support | Prawda warunkowa | Otwiera wyłącznie zweryfikowany URL; ma jawny błąd otwarcia. |
| Complaint i withdrawal | Prawda, skrótowa | Route i backend istnieją. Termin withdrawal pozostaje w Terms. |
| Data rights | Niepełne | Łączy GDPR/privacy requests z innym `data_recovery`. |
| Suspension appeal | Kontrakt istnieje | Manual review nie ma udowodnionego SLA. |

## Retencja i gotowość dokumentów

Polityka i Terms zawierają właściwe szczegóły retencji, usunięcia, procesorów i praw. `legalVariables.ts` nadal ma dane właściciela oznaczone do uzupełnienia. Ten blocker jest już objęty ODK-E2E-087 i nie został powielony.

## Zadania następcze

- ODK-E2E-109: cloud sync oraz rodzaje usuwania.
- ODK-E2E-110: prawdziwy stan niedostępnego Support.
- ODK-E2E-111: rozdzielenie Data rights i data recovery.
- ODK-E2E-112: decyzja o roli huba, URL-ach i terminach/SLA.
