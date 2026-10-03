# Independent semantic review — OOD-N01-B07

**PASS for the reviewed 17-item semantic cohort.** Frozen payload [REVIEWED-B07-v1.json](./REVIEWED-B07-v1.json), SHA-256 `a3e7964e959f710e2d2029e8b98c7f3b9135deaee7f98ada02f3862fa60a5e43`.

I reviewed all prompts, keys, alternatives, Reasons, Details, and option-ID messages. Each sequence question supplies the current trace state and names the collaborator that owns the next missing value, result, or decision. The correct next message follows from that state; the wrong-option messages refer to their intended options. Items repeatedly practice trace ordering, as this unit's lens requires, but they use different data dependencies and do not collapse to one repeated primary decision.

| Item | Decisive next step |
|---|---|
| `i018` | Query SeatInventory with section and party size for current candidate seats. |
| `i019` | Ask LibraryCalendar for available pickup windows after the no-loan-conflict result. |
| `i020` | Resolve required coverage with WarrantyLedger before offering appointments. |
| `i021` | Ask RoomAssignment for ready candidates using the loaded booking's room type. |
| `i022` | Pass AccessibilityRules' filtered layout to MapRenderer. |
| `i023` | Obtain the plan-specific amount from RenewalPolicy before charging. |
| `i024` | Query SpecialistDirectory for accepting clinics before delivery. |
| `i025` | Send both resolved records to DuplicateMatcher for comparison. |
| `i026` | Obtain the item/date fee from FeeSchedule before deciding whether to collect it. |
| `i027` | Pass the already-loaded, request-bound approval and destination to Reservation; do not repeat the lookup. |
| `i028` | Send the answer and exercise version to AttemptScorer before ProgressJournal records the result. |
| `i029` | Resolve item IDs to authoritative descriptions and prices in Catalog before formatting. |
| `i030` | Evaluate destination capacity before ScheduleWriter persists the move. |
| `i031` | Load the session through SessionRepository before SnapshotBuilder and ArchiveWriter act. |
| `i032` | Query BadgeQuery for tenant-filtered, active rows before CsvPresenter formats them. |
| `i033` | Load ordered deployment events before SummaryComposer constructs a narrative. |
| `i034` | Ask RefundPolicy to evaluate classification against the sale record before presenting the result. |

One alternative in `i021` mentions an unlisted `Housekeeping` collaborator. It is plainly outside the trace contract and is weaker than the other role/sequence distractors, but it does not create ambiguity in the keyed choice; it is an optional distractor refinement, not a blocker. The repeated boundary caveat in Details is acceptable here because it explicitly prevents sequence traces from implying unstated atomicity, timing, or delivery behavior.

The Microsoft DDD source supports separation of domain, application, and infrastructure responsibilities; the concrete participant ownership/order facts come from the prompts, not a claim that every real system uses these collaborators ([Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice)). Correct options are longest or tied in 4/17 questions, so the cohort does not signal a systematic longest-choice shortcut. This is semantic source QA only, not implementation, admission, renderer, native, or full-area acceptance.
