# Author notes — OOD N02 closure17, B01–B04

These notes describe the exact 76 serialized proposal objects. `questionId` is the fixed replacement ID; all original B01–B04 objects remain bound in the packet manifest. The answer text, closest distractor, and feedback target are read back from the proposal JSON rather than reconstructed from an outline. Scenario facts are authored premises; the references support only the general modeling concepts cited, not product-specific policies.

## Cross-unit and accepted-neighbor review map

- **B01:** The unit asks which behavior should travel with the state/facts that make its result meaningful. Nearest accepted N01 topics include bundle pricing (N01-B06-i033), room capacity (N01-B06-i022), and captured attempt policy (N01-B04-i026); these proposals use different object state/facts and do not ask the accepted questions’ pricing composition, cross-object capacity comparison, or attempt submission decision. B01-to-B03 examples may reuse an entity name, but B01 tests data/behavior cohesion while B03 tests replacing a caller-side branch with an operation.
- **B02:** The unit asks which lifecycle outcome is valid for the stated precondition/result. Potential nearest N01 decisions include permits (N01-B04-i023), referral consent (N01-B04-i025), pinned attempt policy/late submission (N01-B04-i026), digest-confirmed sealing (N01-B04-i030), and accepted response to a recipient handoff (N01-B04-i019). In this proposal these map to B02 i030, i032, i033, i037, and i023; i023 is the distinct stale-proposal correlation case: a delayed P1 acceptance cannot publish or clear P2 after P2 replaces it, while a response matching the current proposal remains applicable. Other N01 transitions are explicitly surfaced for independent overlap review. B02-to-B03 lesson retirement and publication items share contexts, but B02 tests transition result while B03 tests where a caller’s state-dependent rule should execute.
- **B03:** The unit asks where a caller-side state read and branch should become behavior, not which transition outcome is valid. Potential nearest N01 decisions include command blocking in maintenance (N01-B06-i023), referral consent (N01-B04-i025), pinned attempt scoring (N01-B04-i026), and digest-confirmed sealing (N01-B04-i030); in this proposal these map to B03 i024, i032, i033, and i037 and require explicit reviewer comparison. The closest B02 pairs are distinguished by outcome-vs-placement lens, not domain name.
- **B04:** The unit asks which responsibility should change when its stated independent trigger changes. It contrasts cohesive state with protocol, transport, rendering, or provider mapping changes; it does not ask the layer placement or interaction reachability questions from N01-B07/B08. Revised i020 tests whether reservation and capacity-hold state with one atomic booking rule should be split from an independent email provider. Revised i030 tests whether grant fields with one shared revision/review lifecycle should be split by field. A reviewer should compare those distinct change causes against neighboring responsibility questions, not infer uniqueness from domain names.

## Object-level decision records

### B01

#### ood-n02-b01-i020

- **Learning objective:** Choose where billable-mass calculation belongs when callers must share one result derived from shipment measures and carrier class.
- **Visible facts and asked decision:** A parcel quote has 3 measured dimensions and a carrier class divisor. The quoted billable mass is used by two callers; neither caller owns measurement rules. Choose where billable-mass calculation belongs when callers must share one result derived from shipment measures and carrier class.
- **Key decision:** Let the ParcelQuote calculate billable mass from its dimensions and selected carrier class.
- **Closest alternative and diagnosis:** Have each checkout caller calculate billable mass from the exposed dimensions. — A second caller can use a different rounding or divisor rule, so identical parcel state can yield conflicting quotes.
- **Reversal / boundary:** If carrier policy becomes independently versioned, inject a policy value; do not duplicate the arithmetic in each caller.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b01-i021

- **Learning objective:** Choose how the session should report remaining places when confirmation status changes.
- **Visible facts and asked decision:** A workshop session stores confirmed attendee IDs and has a visible capacity. Waitlisted people are not confirmed. Choose how the session should report remaining places when confirmation status changes.
- **Key decision:** Have WorkshopSession compute remaining places from its confirmed attendee set and capacity.
- **Closest alternative and diagnosis:** Maintain a separate remainingPlaces counter that each registration caller increments or decrements. — A cancellation path can update membership but miss the counter, so the displayed number no longer describes the stored attendees.
- **Reversal / boundary:** A reporting projection may cache the result, but its source must remain this confirmed-membership rule.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b01-i022

- **Learning objective:** Choose how an issued line should calculate its amount after catalog prices change.
- **Visible facts and asked decision:** An invoice line captures quantity and unit price at issue time. The catalog price may later change; old invoices must still show the issued amount. Choose how an issued line should calculate its amount after catalog prices change.
- **Key decision:** Let InvoiceLine compute its amount from its captured quantity and unit price.
- **Closest alternative and diagnosis:** Copy the invoice amount into every screen-specific presenter and treat each copy as authoritative. — The same issued line can then display different totals depending on which screen recalculated it.
- **Reversal / boundary:** A tax policy can remain an explicit collaborator if the invoice also captures the applicable policy version.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b01-i023

- **Learning objective:** Choose where scaling belongs so one batch can change without altering the master recipe.
- **Visible facts and asked decision:** A recipe batch stores ingredient quantities for its selected serving count. The master recipe remains unchanged when a cook scales one batch. Choose where scaling belongs so one batch can change without altering the master recipe.
- **Key decision:** Let RecipeBatch calculate its ingredient quantities from its own serving count and the selected recipe revision.
- **Closest alternative and diagnosis:** Let each shopping-list screen independently multiply the master values by the requested servings. — Different consumers can apply different rounding and forget batch-specific adjustments.
- **Reversal / boundary:** If a recipe revision changes, use its explicit revision rather than mutating batches already prepared from an earlier one.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b01-i024

- **Learning objective:** Choose how the playlist should expose its total runtime when tracks are reordered or replaced.
- **Visible facts and asked decision:** A playlist stores an ordered set of tracks. Track durations come from the playlist’s selected track versions; duration is not manually editable. Choose how the playlist should expose its total runtime when tracks are reordered or replaced.
- **Key decision:** Have Playlist compute runtime from its ordered selected track versions.
- **Closest alternative and diagnosis:** Have each playback screen sum whichever current track versions its own cache returns. — The playlist’s displayed runtime can depend on unrelated cache freshness instead of its selected members.
- **Reversal / boundary:** A separately materialized search index may lag, but it should be labeled as a projection rather than the playlist’s authoritative runtime.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b01-i025

- **Learning objective:** Choose how a historical corrected value should be obtained after the device is recalibrated.
- **Visible facts and asked decision:** A sensor reading stores the raw measurement and the calibration revision used when it was taken. Later recalibration must not rewrite historical readings. Choose how a historical corrected value should be obtained after the device is recalibrated.
- **Key decision:** Have SensorReading apply its captured calibration revision to its raw measurement.
- **Closest alternative and diagnosis:** Apply whichever calibration is currently active whenever any screen opens the old reading. — That reinterprets an old measurement using state that did not apply when it was captured.
- **Reversal / boundary:** If policy requires restating history, model that as an explicit restatement instead of silently changing display behavior.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b01-i026

- **Learning objective:** Choose how the allowance should expose its remaining accepted balance.
- **Visible facts and asked decision:** A monthly allowance stores a period limit and accepted charges for that period. Draft charges do not reduce available balance. Choose how the allowance should expose its remaining accepted balance.
- **Key decision:** Let MonthlyAllowance subtract its accepted charges from its period limit.
- **Closest alternative and diagnosis:** Keep a cached balance that every charge editor changes before the charge is accepted. — A rejected draft could reduce the balance despite not being part of accepted charges.
- **Reversal / boundary:** A ledger may independently record accounting entries, but the allowance balance must use the defined accepted set.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b01-i027

- **Learning objective:** Choose how bounds validation should stay consistent across preview and export.
- **Visible facts and asked decision:** A crop stores an image size and a rectangle. A crop must remain inside the image; the editor previews the same rectangle that export uses. Choose how bounds validation should stay consistent across preview and export.
- **Key decision:** Have ImageCrop validate a proposed rectangle against its stored image dimensions.
- **Closest alternative and diagnosis:** Allow callers to mutate rectangle coordinates directly and repair them on the next render. — The object can persist an invalid crop before that later render occurs.
- **Reversal / boundary:** A separate image decoder may validate file format, but it does not replace this geometric check.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b01-i028

- **Learning objective:** Choose how meeting duration should be calculated for attendees in different zones.
- **Visible facts and asked decision:** A meeting stores start and end instants. Each attendee sees those instants in their own time zone; the event does not store a single local wall-clock label. Choose how meeting duration should be calculated for attendees in different zones.
- **Key decision:** Have Meeting calculate elapsed duration from its stored start and end instants.
- **Closest alternative and diagnosis:** Store a separate duration that organizers can edit independently of both instants. — That number can contradict the actual interval represented by the event.
- **Reversal / boundary:** If the product asks for scheduled wall-clock hours, model that separate business quantity explicitly.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b01-i029

- **Learning objective:** Choose how the stay should report its number of nights.
- **Visible facts and asked decision:** A hotel stay stores check-in and check-out calendar dates in the hotel’s local calendar. A stay crossing midnight counts each occupied night; time-zone conversion is not part of this contract. Choose how the stay should report its number of nights.
- **Key decision:** Have HotelStay count the hotel-local dates from check-in up to but not including check-out.
- **Closest alternative and diagnosis:** Convert both dates to the traveler’s device zone and subtract elapsed hours divided by 24. — The prompt defines hotel-local calendar nights, not elapsed 24-hour periods.
- **Reversal / boundary:** If a business adopts a different date-counting rule, represent that policy explicitly rather than hiding it in a screen.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b01-i030

- **Learning objective:** Choose how boundary membership should be evaluated consistently wherever bands are used.
- **Visible facts and asked decision:** A temperature band has inclusive lower and upper bounds. A reading belongs to the band when it is equal to either endpoint or between them. Choose how boundary membership should be evaluated consistently wherever bands are used.
- **Key decision:** Have TemperatureBand answer whether a reading is within its inclusive bounds.
- **Closest alternative and diagnosis:** Store an isInside flag on each reading and update it whenever any band changes. — Membership then depends on stale derived state rather than the selected band.
- **Reversal / boundary:** If different alert policies require different thresholds, each band instance should carry its own stated bounds.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b01-i031

- **Learning objective:** Choose how the board should determine the number of ready tasks after a dependency is edited.
- **Visible facts and asked decision:** A project board stores tasks and dependency links. A task is ready only when all its recorded prerequisites are complete; the board can change links. Choose how the board should determine the number of ready tasks after a dependency is edited.
- **Key decision:** Have ProjectBoard evaluate readiness from its current tasks and dependency links.
- **Closest alternative and diagnosis:** Have the dashboard keep its own dependency graph copy and compute readiness there. — That copy can disagree with the board after a link edit.
- **Reversal / boundary:** For very large graphs, a computed index may help, but it must be derived from the authoritative board graph.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b01-i032

- **Learning objective:** Choose how the risk band should stay aligned with reviewer edits to severity and likelihood.
- **Visible facts and asked decision:** An inspection finding stores severity and likelihood. The published risk band is the cell in a fixed matrix selected by those two values; reviewers cannot edit the band separately. Choose how the risk band should stay aligned with reviewer edits to severity and likelihood.
- **Key decision:** Have InspectionFinding select its risk band from its severity, likelihood, and the fixed matrix.
- **Closest alternative and diagnosis:** Let reviewers edit a risk label independently after changing severity. — The label can describe a different pair of inputs from the saved finding.
- **Reversal / boundary:** If the matrix itself becomes versioned, capture the matrix revision with the finding.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b01-i033

- **Learning objective:** Choose how to keep itinerary travel time accurate when one leg is rebooked.
- **Visible facts and asked decision:** A rental itinerary stores travel legs in sequence. Its displayed travel time is the sum of each leg’s booked duration; waiting time is shown separately. Choose how to keep itinerary travel time accurate when one leg is rebooked.
- **Key decision:** Have RentalItinerary sum the booked durations of its current legs.
- **Closest alternative and diagnosis:** Include connection waiting time in each leg’s duration when rendering the itinerary. — The prompt defines waiting time as a separate quantity, so that changes the meaning of travel time.
- **Reversal / boundary:** If the product later defines door-to-door journey time, add that as a distinct measure.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b01-i034

- **Learning objective:** Choose how the activation screen should display the deadline after a permitted edit.
- **Visible facts and asked decision:** A service window stores a start instant and an allowed duration. The deadline is start plus that duration; support staff may change either input before activation. Choose how the activation screen should display the deadline after a permitted edit.
- **Key decision:** Have ServiceWindow calculate its deadline from its start and allowed duration.
- **Closest alternative and diagnosis:** Have the activation screen independently add a default duration to the displayed start. — A different screen may use another default and show another deadline.
- **Reversal / boundary:** Once activated, if the contract freezes the deadline, capture the resulting instant as an explicit lifecycle fact.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b01-i035

- **Learning objective:** Choose how to show proposed ingredient quantities without changing stored batch state.
- **Visible facts and asked decision:** A compost batch stores ingredient proportions and a target quantity. Operators can request a proposed batch size; the batch is not changed until the proposal is accepted. Choose how to show proposed ingredient quantities without changing stored batch state.
- **Key decision:** Have CompostBatch calculate a proposal from its proportions and requested target without mutating itself.
- **Closest alternative and diagnosis:** Let the proposal screen overwrite the batch quantities while the operator is still reviewing. — That changes accepted state before the prompt’s explicit acceptance point.
- **Reversal / boundary:** If proposals become independently saved records, model their own lifecycle rather than treating previews as accepted batches.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b01-i036

- **Learning objective:** Choose how an existing case should continue to report its due instant after policy changes.
- **Visible facts and asked decision:** A support case stores its opened instant and response window. The due instant is fixed when the case is created; later policy edits affect new cases only. Choose how an existing case should continue to report its due instant after policy changes.
- **Key decision:** Have SupportCase retain and report the due instant calculated from its captured response window at creation.
- **Closest alternative and diagnosis:** Recalculate the due instant from the policy currently published whenever a case is reopened. — That replaces the case’s stated captured deadline with a later policy value.
- **Reversal / boundary:** A deliberate migration of open cases would be a separate explicit operation.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b01-i037

- **Learning objective:** Choose how a new temperature reading should affect the zone’s heating state near the target.
- **Visible facts and asked decision:** A thermostat zone stores its target and current mode. Hysteresis keeps heating active until the measured temperature reaches the upper cutoff, rather than toggling at the target. Choose how a new temperature reading should affect the zone’s heating state near the target.
- **Key decision:** Have ThermostatZone apply the reading using its target, mode, and hysteresis band.
- **Closest alternative and diagnosis:** Store the previous reading in each callback instance and let callbacks decide independently. — Multiple callbacks can disagree about the zone’s current mode and cutoff behavior.
- **Reversal / boundary:** A sensor adapter can normalize units, but the zone still evaluates its state-dependent rule.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b01-i038

- **Learning objective:** Choose how the preview should recalculate sheets after paper or duplex settings change.
- **Visible facts and asked decision:** A print job stores page count, paper size, and duplex setting. A fixed estimator maps those values to sheet count; users may change the settings before submission. Choose how the preview should recalculate sheets after paper or duplex settings change.
- **Key decision:** Have PrintJob calculate its estimated sheet count from its page count, paper size, and duplex setting.
- **Closest alternative and diagnosis:** Let the preview store an independently editable sheet count next to the settings. — A setting change can leave the estimate stale even though it is presented as current.
- **Reversal / boundary:** A device-specific physical estimate may be a separate collaborator if the prompt later adds device behavior.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

### B02

#### ood-n02-b02-i020

- **Learning objective:** Choose the retirement transition that preserves the stated enrollment and progress behavior.
- **Visible facts and asked decision:** A course lesson has states Draft, Published, and Retired. Retirement prevents new enrollment, while existing learners keep their progress record linked to the lesson ID. Choose the retirement transition that preserves the stated enrollment and progress behavior.
- **Key decision:** Have Lesson.retire stop new enrollment and mark the lesson retired without changing its stable ID.
- **Closest alternative and diagnosis:** Delete the lesson row and let progress records recreate it if a learner opens an old course. — Deletion removes the referent the prompt says existing progress must continue to use.
- **Reversal / boundary:** If historical records need a display snapshot, that can be added without replacing the lesson identity.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b02-i021

- **Learning objective:** Choose how a room move should handle one accepted input and one rejected input.
- **Visible facts and asked decision:** A studio booking may move from Requested to Confirmed only after the room and time are both accepted. A rejected move must leave the previous confirmed slot intact. Choose how a room move should handle one accepted input and one rejected input.
- **Key decision:** Keep the confirmed slot and reject the move.
- **Closest alternative and diagnosis:** Write the new room immediately, then keep the old time if the time check fails. — That leaves a mixed slot that was never accepted as a room-and-time pair.
- **Reversal / boundary:** If the system later permits partial holds, represent that as a separate state with its own meaning.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b02-i022

- **Learning objective:** Choose the transition after an export attempt reports a failure.
- **Visible facts and asked decision:** A whiteboard session can be Open, Closing, or Closed. Export is available only after all accepted strokes are included; a failed export keeps the session Closing and retryable. Choose the transition after an export attempt reports a failure.
- **Key decision:** Stay Closing and retry; close only after a complete export.
- **Closest alternative and diagnosis:** Mark the session Closed before export starts, then discard it if the writer fails. — The state claims completion even though the required export did not complete.
- **Reversal / boundary:** If export is optional, the state machine can be simpler; this prompt makes it a close precondition.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b02-i023

- **Learning objective:** Apply an asynchronous acceptance only to the exact proposal that is still pending; preserve the active package and newer proposal after a stale response.
- **Visible facts and asked decision:** In a curriculum publishing desk, proposal P1 is pending while the current package remains active. An editor replaces P1 with P2 before P1’s delayed acceptance arrives. A response must affect publication only if it names the proposal currently pending; a stale response must not publish its old package or clear P2. What should the response handler do?
- **Key decision:** Apply only a response for the current pending proposal; mark delayed P1 stale.
- **Closest alternative and diagnosis:** Ignore every acceptance after a replacement is submitted, including one that matches the current pending proposal. — A matching acceptance for current P2 is valid under the prompt; discarding all responses would block the current transition too.
- **Reversal / boundary:** If the editor had not replaced P1, an acceptance that still matches pending P1 could be applied. The rule is correlation, not rejection of every delayed response.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b02-i024

- **Learning objective:** Choose the publish behavior when the stock count is negative.
- **Visible facts and asked decision:** A produce listing can be Draft or Published. Publishing requires a nonnegative price and stock count; failed validation must leave the draft editable. Choose the publish behavior when the stock count is negative.
- **Key decision:** Reject publication and leave the listing Draft with its entered fields available for correction.
- **Closest alternative and diagnosis:** Set the listing Published, then hide it if a later page notices the negative stock. — The public state is reached before the stated publication condition is checked.
- **Reversal / boundary:** A separate moderation state is only needed if the product actually distinguishes pending review.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b02-i025

- **Learning objective:** Choose what approval should do when one requested quantity exceeds delivery.
- **Visible facts and asked decision:** A return request lists item quantities already delivered. Approval is allowed only when each requested quantity is at most the delivered quantity; rejection leaves the request editable. Choose what approval should do when one requested quantity exceeds delivery.
- **Key decision:** Reject approval while preserving the editable request so the quantity can be corrected.
- **Closest alternative and diagnosis:** Approve the lines that fit and silently remove the excess quantity from the other line. — That changes the customer’s requested return instead of reporting that its precondition failed.
- **Reversal / boundary:** If partial approval is a product behavior, it needs an explicit result the customer can review.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b02-i026

- **Learning objective:** Choose how to respond when Plot B becomes occupied before the transfer commits.
- **Visible facts and asked decision:** A garden plot reservation moves from Plot A to Plot B. Plot B must be vacant at commit time; a denied transfer must preserve Plot A and its approval history. Choose how to respond when Plot B becomes occupied before the transfer commits.
- **Key decision:** Keep the reservation on Plot A and reject the transfer because Plot B is no longer vacant.
- **Closest alternative and diagnosis:** Remove the reservation from Plot A first, then ask the steward to choose another destination later. — A failed transfer is required to preserve the Plot A reservation and its approval history.
- **Reversal / boundary:** If the business supports a temporary unassigned state, it must be specified separately.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b02-i027

- **Learning objective:** Choose what activation should do if the third component is no longer active.
- **Visible facts and asked decision:** A regional bundle is Draft until all three component offers are active for the chosen region. Component availability can change while the draft is being reviewed. Choose what activation should do if the third component is no longer active.
- **Key decision:** Keep the bundle Draft and report the unavailable component; activate only when all three are active.
- **Closest alternative and diagnosis:** Activate the bundle from the earlier review result and let checkout discover the missing component. — The component can change during review, so the old check does not satisfy the activation condition.
- **Reversal / boundary:** If a component can be optional, model that selection explicitly before activation.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b02-i028

- **Learning objective:** Choose the state when the expiry instant passes and no vehicle connected.
- **Visible facts and asked decision:** A charging controller records a connector as Available, Reserved, or Charging. A reservation expires at its stated instant unless a vehicle has connected. Choose the state when the expiry instant passes and no vehicle connected.
- **Key decision:** Change the connector from Reserved to Available when its reservation expires without connection.
- **Closest alternative and diagnosis:** Change it directly to Charging because the reserved driver may arrive later. — A reservation without a connection is not evidence that charging began.
- **Reversal / boundary:** A late arrival may request a new reservation; it does not revive the expired one implicitly.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b02-i029

- **Learning objective:** Choose how to commit the merge without losing the source descriptions.
- **Visible facts and asked decision:** A photo archive merges two metadata records for the same asset. The curator selects the winning title, while both original source descriptions must remain inspectable. Choose how to commit the merge without losing the source descriptions.
- **Key decision:** Store the selected title as current metadata and retain both original descriptions as merge provenance.
- **Closest alternative and diagnosis:** Keep both metadata records active and make each screen choose whichever title it prefers. — The merge would not establish one selected current title as requested.
- **Reversal / boundary:** If provenance is stored in a separate immutable record, that is still part of the merge transition’s result.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b02-i030

- **Learning objective:** Choose how to handle a request to change the territory of an approved permit.
- **Visible facts and asked decision:** A machine-use permit moves from Draft to Approved only when both territory and expiry are present. Once approved, those fields cannot be edited; a correction requires a new draft. Choose how to handle a request to change the territory of an approved permit.
- **Key decision:** Keep the approved permit unchanged and create a new draft for the corrected territory.
- **Closest alternative and diagnosis:** Edit the territory on the approved permit and keep its old approval timestamp. — The approval would now refer to a territory that was never reviewed.
- **Reversal / boundary:** If revocation is needed, model revocation explicitly rather than rewriting the approved record.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b02-i031

- **Learning objective:** Choose the result when the proposed replacement is incompatible.
- **Visible facts and asked decision:** A drone maintenance job assigns a replacement battery to one aircraft. The old battery must be returned to Available only after the new battery passes the aircraft’s compatibility check. Choose the result when the proposed replacement is incompatible.
- **Key decision:** Reject the replacement and leave the current battery assignment unchanged.
- **Closest alternative and diagnosis:** Release the current battery first, then report that the new battery is incompatible. — The aircraft loses its valid assignment even though no replacement can be made.
- **Reversal / boundary:** A separate diagnostic record can explain the failed proposal without changing the assignment.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b02-i032

- **Learning objective:** Choose the transition after consent has been revoked but before dispatch.
- **Visible facts and asked decision:** A referral moves from Ready to Sent only when consent is active at dispatch. If consent is revoked before dispatch, no specialist receives the referral. Choose the transition after consent has been revoked but before dispatch.
- **Key decision:** Keep the referral Ready or mark it blocked; do not transition to Sent or disclose it.
- **Closest alternative and diagnosis:** Send the referral without details so the specialist can request the missing information. — Even a minimal external disclosure is prohibited by the stated no-send condition.
- **Reversal / boundary:** If consent is restored later, dispatch can be reconsidered under the then-current state.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b02-i033

- **Learning objective:** Choose how a late submission should be recorded.
- **Visible facts and asked decision:** A timed exercise attempt changes from InProgress to Submitted. The submitted attempt pins its exercise revision and scoring policy; late submission is allowed but marked late. Choose how a late submission should be recorded.
- **Key decision:** Submit the attempt with its pinned revision and policy and mark its result late.
- **Closest alternative and diagnosis:** Rescore it using the policy currently published when the learner submits. — That replaces the policy the attempt pinned when it began.
- **Reversal / boundary:** A new attempt may use a newer revision; this attempt does not change retroactively.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b02-i034

- **Learning objective:** Choose what a delegate’s approval action should do.
- **Visible facts and asked decision:** A procurement exception moves to Approved only after the named manager signs it. A delegate may prepare the request but cannot approve it. Choose what a delegate’s approval action should do.
- **Key decision:** Leave the exception Pending until the named manager signs.
- **Closest alternative and diagnosis:** Mark it Approved because the delegate completed all required form fields. — Preparation completeness does not satisfy the stated signer requirement.
- **Reversal / boundary:** If delegation authority is later granted, it must be an explicit authorization fact.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b02-i035

- **Learning objective:** Choose the booking state while the refund provider is still processing.
- **Visible facts and asked decision:** A room booking moves from Confirmed to Cancelled when the organizer cancels. Cancellation frees the room immediately and creates a cancellation record; a separate payment provider may take time to return any refundable amount. Choose the booking state while the refund provider is still processing.
- **Key decision:** Mark the booking Cancelled; track any refund separately.
- **Closest alternative and diagnosis:** Delete the booking and its history when cancellation is requested. — The cancellation record is required and should survive the separate refund outcome.
- **Reversal / boundary:** If a refund fails, report that financial result without silently restoring the canceled room booking.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b02-i036

- **Learning objective:** Choose how denial should affect the pending grant.
- **Visible facts and asked decision:** A temporary role grant moves from Pending to Active only after the reviewer approves it. Its expiry remains scheduled from the approved start time; denial leaves an audit record. Choose how denial should affect the pending grant.
- **Key decision:** Mark it Denied and retain the audit record.
- **Closest alternative and diagnosis:** Delete the pending grant so the user can no longer see what was decided. — The prompt requires an audit record of the denial.
- **Reversal / boundary:** A later request should have a new review identity rather than altering the denied decision.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b02-i037

- **Learning objective:** Choose what to do when the document changes after confirmation but before sealing.
- **Visible facts and asked decision:** A notarization request seals a document revision only after the signer confirms the displayed digest. A changed revision has a different digest. Choose what to do when the document changes after confirmation but before sealing.
- **Key decision:** Do not seal; require confirmation of the changed revision’s digest.
- **Closest alternative and diagnosis:** Seal the latest revision using the earlier confirmation because the document ID is unchanged. — The confirmation is for a different digest, even though the document identity stayed the same.
- **Reversal / boundary:** A user can review and confirm the new revision to continue.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b02-i038

- **Learning objective:** Choose how to handle a timeout when the release outcome is not yet visible to the caller.
- **Visible facts and asked decision:** A seller payout moves from Ready to Released after settlement. A release request may be retried after a timeout; the payment provider returns the same transfer reference for a repeated request ID. Choose how to handle a timeout when the release outcome is not yet visible to the caller.
- **Key decision:** Retry with the same payout request ID and reconcile the returned transfer reference before reporting Released.
- **Closest alternative and diagnosis:** Create a new request ID so the provider can attempt the payout again immediately. — A second identity can request a second transfer while the first result is unknown.
- **Reversal / boundary:** If the provider does not guarantee repeated request identity, the scenario needs a different reconciliation contract.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

### B03

#### ood-n02-b03-i020

- **Learning objective:** Choose how the caller should request the reorder.
- **Visible facts and asked decision:** A playlist caller reads the ordered tracks, checks whether the first track is marked as an intro, then rebuilds the list to move a song. Only the Playlist knows its locked prefix rule. Choose how the caller should request the reorder.
- **Key decision:** Ask Playlist.moveTrack to perform the reorder; it checks the locked intro prefix and updates its ordered tracks.
- **Closest alternative and diagnosis:** Add a generic ListEditor that accepts raw tracks and makes no reference to the Playlist rule. — The helper lacks the context needed to determine which member positions are protected.
- **Reversal / boundary:** A UI helper may collect the requested destination but should not decide playlist validity.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b03-i021

- **Learning objective:** Choose where the extension eligibility decision should be made.
- **Visible facts and asked decision:** A library page reads a loan’s due date, compares it to today, and decides whether an extension is allowed. The loan stores its due date and the number of extensions already used. Choose where the extension eligibility decision should be made.
- **Key decision:** Ask Loan.requestExtension(today) to evaluate its due date and extension count before changing the loan.
- **Closest alternative and diagnosis:** Create a policy service that receives a copied due date but not the loan’s extension history. — That service cannot decide from the full state the prompt says controls eligibility.
- **Reversal / boundary:** A calendar collaborator may supply today’s date, but the loan applies its own extension rule.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b03-i022

- **Learning objective:** Choose how a work-order caller should obtain the labor plan.
- **Visible facts and asked decision:** A repair job stores the machine, observed symptoms, and confirmed diagnosis. The caller currently asks for all three, chooses labor steps, then writes them back. The job’s procedure varies by diagnosis. Choose how a work-order caller should obtain the labor plan.
- **Key decision:** Ask RepairJob.planLabor() to use its confirmed diagnosis and symptoms to produce the job’s required steps.
- **Closest alternative and diagnosis:** Store a labor plan copied from the caller without checking whether it matches the job diagnosis. — The copied plan can contradict the diagnosis that the job itself records.
- **Reversal / boundary:** A technician can still choose execution details that the job’s rules do not determine.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b03-i023

- **Learning objective:** Choose where the joint move eligibility decision belongs.
- **Visible facts and asked decision:** A rehearsal rescheduling screen reads attendee count, destination-room capacity, and accessibility flags, then decides whether a move is valid. A Room knows capacity; the Rehearsal knows its attendees and requirements. Choose where the joint move eligibility decision belongs.
- **Key decision:** Use a named rescheduling operation with both Rehearsal and Room facts to decide and apply the move.
- **Closest alternative and diagnosis:** Put the check only on Room and pass it a count, discarding the rehearsal’s accessibility requirements. — The room-capacity check would omit the rehearsal-specific requirement that also governs the move.
- **Reversal / boundary:** Keep the room’s capacity fact on Room; the joint operation coordinates rather than copying it.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b03-i024

- **Learning objective:** Choose how both panels should submit commands.
- **Visible facts and asked decision:** An exhibit command handler reads the controller’s maintenance flag and command type, then blocks unsafe commands. The rule is part of the exhibit’s accepted operating behavior and is used by both remote and local panels. Choose how both panels should submit commands.
- **Key decision:** Ask ExhibitController.execute(command) to evaluate maintenance state and apply the command rule.
- **Closest alternative and diagnosis:** Let the network gateway decide whether a command is safe based only on the request name. — The gateway lacks the controller’s current maintenance state.
- **Reversal / boundary:** Transport authentication can stay at the gateway; it does not replace the controller’s behavior rule.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b03-i025

- **Learning objective:** Choose how the caller should initiate retirement.
- **Visible facts and asked decision:** A course administrator retires a lesson. The caller currently reads learner-progress links and manually marks each one preserved before changing the lesson’s status. Lesson identity and retirement rules are owned by the library model. Choose how the caller should initiate retirement.
- **Key decision:** Ask Lesson.retire() to change availability while preserving its stable identity for linked progress.
- **Closest alternative and diagnosis:** Let each admin screen query progress links and decide how to adjust lesson fields. — A second retirement path can alter the ID or fail to preserve one kind of progress link.
- **Reversal / boundary:** The screen can still show affected learner counts as confirmation information.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b03-i026

- **Learning objective:** Choose a case operation that prevents callers from applying only part of reassignment.
- **Visible facts and asked decision:** A customer-support case stores its current assignee, queue, and response deadline. Reassignment must preserve that deadline. The controller checks whether a destination queue is active and then updates assignment fields. Choose a case operation that prevents callers from applying only part of reassignment.
- **Key decision:** Ask SupportCase.reassign(queue) to check the destination and update its assignment as one behavior.
- **Closest alternative and diagnosis:** Expose assignee and queue setters and let controllers choose which one to call. — A controller can update the queue while leaving the old assignee in place.
- **Reversal / boundary:** The queue can report whether it is active; the case still applies its related field change.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b03-i027

- **Learning objective:** Choose how publication should be invoked so every entry point enforces the same rule.
- **Visible facts and asked decision:** A listing stores price and stock. The market’s policy rejects publication when either is invalid; the publish page currently fetches fields and branches before setting Published. Choose how publication should be invoked so every entry point enforces the same rule.
- **Key decision:** Ask Listing.publish() to validate its price and stock before changing its status.
- **Closest alternative and diagnosis:** Put publication status on a separate flag object that receives no price or stock values. — That object cannot evaluate the stated publication rule.
- **Reversal / boundary:** A dedicated price policy can be consulted if the prompt later introduces varying price rules.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b03-i028

- **Learning objective:** Choose how a caller should request readiness.
- **Visible facts and asked decision:** A shipment has packed parcels and an order quantity. The shipping caller reads parcel totals, checks the remaining quantity, and then marks the shipment ready. A shipment can be ready only when every ordered unit is assigned. Choose how a caller should request readiness.
- **Key decision:** Ask Shipment.markReady() to compare assigned parcel quantities with the order quantity before changing status.
- **Closest alternative and diagnosis:** Let each shipping screen total the parcel list and set Ready through a status setter. — One screen can miss a parcel or use a different total before setting the same status.
- **Reversal / boundary:** An order service may provide the target quantity, but Shipment coordinates its parcel state.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b03-i029

- **Learning objective:** Choose how to make the merge decision and resulting update consistent.
- **Visible facts and asked decision:** An archive record has a selected title and several source descriptions. The merge screen reads every description, chooses a winner, then writes the title and provenance list separately. Choose how to make the merge decision and resulting update consistent.
- **Key decision:** Ask ArchiveRecord.mergeDescriptions(selection) to set the selected title and retain the other descriptions as provenance.
- **Closest alternative and diagnosis:** Let each merge screen update the title first and save provenance only if its next request succeeds. — A failure between writes can produce a title without the source history the merge must retain.
- **Reversal / boundary:** The curator remains the human decision maker about which description is preferred.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b03-i030

- **Learning objective:** Choose how a permit should answer a usage request.
- **Visible facts and asked decision:** A permit stores granted territories and expiry. A caller checks whether a requested usage fits those fields, then writes an approval. The same permit is evaluated in both review and renewal flows. Choose how a permit should answer a usage request.
- **Key decision:** Ask Permit.authorizes(territory, instant) to evaluate its granted territory and expiry.
- **Closest alternative and diagnosis:** Have every caller read territories and expiry and reimplement the comparison. — Review and renewal can disagree about whether the same usage is authorized.
- **Reversal / boundary:** A policy service may determine the grant inputs; the permit evaluates its own recorded grant.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b03-i031

- **Learning objective:** Place a replacement operation with the maintenance job that owns the current aircraft assignment and has the compatibility facts needed to change it safely.
- **Visible facts and asked decision:** A maintenance job is opened to replace the battery on one aircraft. It references that aircraft’s current battery assignment and stores the compatibility rule and a candidate battery. Callers currently fetch IDs and decide whether to release the old battery. Which operation should the caller request?
- **Key decision:** Ask MaintenanceJob.replaceBattery(candidate) to check compatibility before changing the aircraft assignment.
- **Closest alternative and diagnosis:** Have the battery decide whether the aircraft can accept it without knowing the maintenance job’s current assignment. — The battery alone cannot coordinate replacing the aircraft’s existing resource.
- **Reversal / boundary:** A hardware adapter can report physical fit; the job applies the domain replacement outcome.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b03-i032

- **Learning objective:** Choose how dispatch should be expressed.
- **Visible facts and asked decision:** A referral has consent status and a selected specialist. The caller reads both, branches, then serializes the referral for dispatch. Dispatch must consult the current consent status. Choose how dispatch should be expressed.
- **Key decision:** Ask Referral.prepareDispatch() to check current consent and return a dispatchable referral only when permitted.
- **Closest alternative and diagnosis:** Let the caller cache consent at screen open and send later based on that cached value. — Consent can change between screen open and dispatch, so the cached branch may be stale.
- **Reversal / boundary:** The transport layer can still encode the permitted payload without deciding whether disclosure is allowed.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b03-i033

- **Learning objective:** Choose how scoring should be shared across result and export paths.
- **Visible facts and asked decision:** A learning attempt stores an answer and its pinned scoring policy. A result screen currently reads both and applies scoring; exports use a second copy of the formula. Choose how scoring should be shared across result and export paths.
- **Key decision:** Ask LearningAttempt.score() to apply its pinned policy to its stored answer for both result and export consumers.
- **Closest alternative and diagnosis:** Replace the pinned policy with the current global score formula whenever a result is requested. — That changes how an existing attempt is interpreted despite its captured policy.
- **Reversal / boundary:** A formatter can present the result differently without changing its calculation.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b03-i034

- **Learning objective:** Choose how the exception should handle an approval attempt.
- **Visible facts and asked decision:** A purchasing exception contains requested amount and control category. The caller reads both and decides whether a manager’s approval can be recorded. The category determines the required approval authority. Choose how the exception should handle an approval attempt.
- **Key decision:** Ask Exception.recordApproval(actor) to verify the actor against its amount and control category before recording approval.
- **Closest alternative and diagnosis:** Have the actor’s profile mark the exception approved whenever the actor has a manager role. — The actor profile does not contain this exception’s amount or control category.
- **Reversal / boundary:** An authorization provider may resolve identity, but the exception applies its request-specific rule.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b03-i035

- **Learning objective:** Choose how a replacement should be applied.
- **Visible facts and asked decision:** An episode stores a recording and annotation offsets. A replacement tool returns a proposed offset mapping; callers currently swap the recording first and then update annotations. Choose how a replacement should be applied.
- **Key decision:** Ask Episode.replaceRecording(recording, mapping) to validate and apply the recording and mapped annotations together.
- **Closest alternative and diagnosis:** Let the mapping tool own the Episode and change its recording without validating the proposed annotation set. — The tool computes mappings but does not own the episode’s accepted state.
- **Reversal / boundary:** The tool can remain a collaborator that supplies the mapping result.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b03-i036

- **Learning objective:** Choose how permission access should be requested.
- **Visible facts and asked decision:** A role grant stores permissions, expiry, and review status. The caller currently checks that the grant is Active, then returns its permission set. Revoked grants must return no permissions. Choose how permission access should be requested.
- **Key decision:** Ask RoleGrant.effectivePermissions(now) to return permissions only when its status and expiry permit them.
- **Closest alternative and diagnosis:** Have each API handler read status and expiry before returning the raw permission set. — A handler can forget expiry while another checks it, producing inconsistent access.
- **Reversal / boundary:** The authorization boundary still decides whether a caller may inspect the grant at all.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b03-i037

- **Learning objective:** Choose the model operation that best expresses the seal action.
- **Visible facts and asked decision:** A document revision stores text and a digest. A sealing flow asks the revision for its digest, compares it to the signer’s confirmation, and then sends a seal command. Choose the model operation that best expresses the seal action.
- **Key decision:** Ask DocumentRevision.sealIfConfirmed(digest) to compare against its current digest before recording the seal.
- **Closest alternative and diagnosis:** Let the signer confirmation object set the revision’s sealed state without checking its current digest. — The confirmation object does not own the document revision being sealed.
- **Reversal / boundary:** Signature verification can be delegated while this object checks its own content version.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b03-i038

- **Learning objective:** Choose how to prevent different callers from deriving different release amounts.
- **Visible facts and asked decision:** A payout holds a requested amount and settlement status. The caller reads status, computes the transferable amount, and updates payout state; retries use the same payout request. Choose how to prevent different callers from deriving different release amounts.
- **Key decision:** Ask Payout.releaseAmount() or release() to derive the permitted amount from its own request and settlement state.
- **Closest alternative and diagnosis:** Let the settlement feed update the payout’s requested amount whenever it publishes a new total. — The feed reports settlement facts but does not own the amount the seller requested.
- **Reversal / boundary:** A currency conversion policy can be an explicit collaborator if the scenario introduces conversion.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

### B04

#### ood-n02-b04-i020

- **Learning objective:** Keep the reservation and capacity hold under one booking lifecycle because they change atomically under the same rule; isolate independently changing email delivery.
- **Visible facts and asked decision:** A theater booking stores a confirmed seat reservation and the capacity hold that protects that seat. The booking rule requires both to change together: a confirmed reservation cannot exist without its hold, and releasing the hold cancels that reservation. Venue confirmation emails use a provider that changes independently. Which responsibility split fits these change causes?
- **Key decision:** Keep reservation and capacity-hold transitions together in SeatReservation; send confirmations through a separate notifier.
- **Closest alternative and diagnosis:** Give the hold an independent lifecycle and let callers coordinate it with SeatReservation after each update. — The prompt requires the reservation and hold to change together; independent caller coordination can expose the half-updated state the booking rule forbids.
- **Reversal / boundary:** If the venue later gives capacity holds an independently managed lifecycle, that new ownership fact could justify a separate boundary. It is explicitly absent here.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles](https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b04-i021

- **Learning objective:** Choose how to isolate the independent time-source change.
- **Visible facts and asked decision:** A tournament match tracks score and whether it is forfeited. The forfeit rule is set by the tournament format; the time source adapter changes when the venue changes its clock hardware. Choose how to isolate the independent time-source change.
- **Key decision:** Have Match apply the forfeit rule to time from ClockSource.
- **Closest alternative and diagnosis:** Create a separate service for every score field so the match object has no state. — That fragments one match outcome without any separate change trigger in the scenario.
- **Reversal / boundary:** If tournament formats become independently configurable, supply the selected format as explicit match context.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles](https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b04-i022

- **Learning objective:** Choose how to keep a camera replacement from changing return classification behavior.
- **Visible facts and asked decision:** A returns record stores a classification and inspector notes. Classification criteria are revised by the product-safety committee; camera file formats change when inspection tablets are replaced. Choose how to keep a camera replacement from changing return classification behavior.
- **Key decision:** Keep criteria on ReturnInspection; translate tablet files in a media adapter.
- **Closest alternative and diagnosis:** Duplicate classification rules in each tablet integration so each device can tune its own result. — The committee owns one stated criteria set, so duplicated copies can diverge without a product reason.
- **Reversal / boundary:** If a safety committee changes an input field, update the classification rule at its owner rather than the decoder.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles](https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b04-i023

- **Learning objective:** Choose the boundary that preserves scientific meaning across a renderer update.
- **Visible facts and asked decision:** A research notebook publishes a result snapshot. Scientific inclusion rules change when a study protocol changes; the PDF rendering library changes when the publishing platform updates. Choose the boundary that preserves scientific meaning across a renderer update.
- **Key decision:** Let Notebook select the snapshot; let a renderer encode the PDF.
- **Closest alternative and diagnosis:** Let the PDF renderer choose which observations count as the result while it formats the page. — A rendering-library change would then change scientific inclusion semantics.
- **Reversal / boundary:** A renderer may report that it cannot represent a value, but it should not decide whether that value belongs in the study result.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles](https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b04-i024

- **Learning objective:** Choose how to isolate the mail-provider revision.
- **Visible facts and asked decision:** A review workspace accepts a comment into an article thread and notifies the assigned author. Acceptance rules change with editorial policy; notification-provider APIs change when the mail vendor changes. Choose how to isolate the mail-provider revision.
- **Key decision:** Let ReviewThread accept comments; let a notifier send the author message.
- **Closest alternative and diagnosis:** Move comment acceptance into the mail adapter because it knows the assigned author’s address. — Changing mail delivery should not change which comments the editorial policy accepts.
- **Reversal / boundary:** Notification failure can be handled separately from whether the comment was accepted.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles](https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b04-i025

- **Learning objective:** Choose how to limit changes caused by a new offline transport protocol.
- **Visible facts and asked decision:** A field inspection app stores observations and an inspector’s signed submission. Conflict resolution rules change when the inspection program changes; the offline transport protocol changes with mobile platform releases. Choose how to limit changes caused by a new offline transport protocol.
- **Key decision:** Keep inspection reconciliation with its program rule; encode queued edits separately.
- **Closest alternative and diagnosis:** Let the sync adapter decide which conflicting observation is authoritative based on arrival order. — Transport arrival order changes with connectivity and is not the stated inspection-program rule.
- **Reversal / boundary:** If the program changes how conflicts are resolved, revise that rule independently of queue serialization.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles](https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b04-i026

- **Learning objective:** Choose how to handle a partner layout revision.
- **Visible facts and asked decision:** An invoice exchange owns invoice lines and tax totals. Tax rules change when jurisdiction policy changes; document layout changes when a trading partner revises its required file format. Choose how to handle a partner layout revision.
- **Key decision:** Have Invoice calculate tax; map it into each partner file separately.
- **Closest alternative and diagnosis:** Build one formatter that hard-codes every partner layout and tax rule into the invoice object. — The invoice would change for unrelated external partner formats as well as tax policy.
- **Reversal / boundary:** A tax rule update may affect many partner outputs, but does not require changing each mapping.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles](https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b04-i027

- **Learning objective:** Choose a boundary for the new lock vendor integration.
- **Visible facts and asked decision:** An access controller records badge grants and revocations. Revocation policy changes with facility rules; lock-device command framing changes when a door vendor is replaced. Choose a boundary for the new lock vendor integration.
- **Key decision:** Keep grant revocation with AccessGrant; isolate lock-device translation.
- **Closest alternative and diagnosis:** Embed each lock vendor’s command format in AccessGrant so it can send hardware instructions directly. — A hardware replacement would force grant lifecycle changes unrelated to revocation policy.
- **Reversal / boundary:** The adapter may report device failure, but that does not reverse the access decision automatically.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles](https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b04-i028

- **Learning objective:** Choose what should change when a carrier adds a required label field.
- **Visible facts and asked decision:** A shipment owns its destination and shipping status. Carrier label APIs add fields on their own schedule; fulfillment changes when operations revise the handoff rule. Choose what should change when a carrier adds a required label field.
- **Key decision:** Keep handoff status on Shipment; map its facts in a carrier adapter.
- **Closest alternative and diagnosis:** Add every carrier-specific field to Shipment and make the shipment object construct each carrier request. — A carrier-specific API revision would force the domain shipment model to change for an external format.
- **Reversal / boundary:** If the fulfillment rule itself changes, that is a separate domain change to Shipment.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles](https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b04-i029

- **Learning objective:** Choose how to respond to a new localized time format.
- **Visible facts and asked decision:** A rehearsal schedule checks room availability and renders start times in a chosen locale. Room-capacity policy changes when the venue updates safety limits; time formatting changes when localization rules or supported languages change. Choose how to respond to a new localized time format.
- **Key decision:** Keep capacity checks in Schedule; localize start times in a presenter.
- **Closest alternative and diagnosis:** Move capacity checks into the locale formatter because it already receives the room and start time. — A translation change should not alter whether the venue has enough capacity.
- **Reversal / boundary:** If time-zone interpretation affects the actual scheduled instant, model that scheduling fact separately from display formatting.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles](https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b04-i030

- **Learning objective:** Keep grant fields under one lifecycle responsibility when they change only through the same reviewed revision, rather than splitting by field name.
- **Visible facts and asked decision:** A temporary access grant records role, territory, expiry, and review status. A reviewer amends those fields only through one grant revision; role, territory, and expiry cannot be edited independently, and each accepted revision receives one review decision. No separate team or interface administers a field alone. Which object responsibility best fits those facts?
- **Key decision:** Keep role, territory, expiry, and review status within AccessGrant’s single revision lifecycle.
- **Closest alternative and diagnosis:** Create separate mutable classes for role, territory, and expiry, then let callers coordinate their revisions. — The prompt says those facts cannot be revised separately; independent classes force callers to coordinate a partial revision.
- **Reversal / boundary:** If a field later acquires an independent owner or change process, that concrete change trigger could justify a new responsibility.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles](https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b04-i031

- **Learning objective:** Choose how to accommodate a streaming vendor API change.
- **Visible facts and asked decision:** A lesson library stores stable lesson identity and learner progress. Course content editors revise lesson text; video-host APIs change when the streaming vendor changes. Choose how to accommodate a streaming vendor API change.
- **Key decision:** Keep progress linked to Lesson identity; isolate video-host translation.
- **Closest alternative and diagnosis:** Put video-host request fields directly on Lesson and update the domain model whenever the vendor adds one. — A vendor API change is independent of the lesson and progress relationship.
- **Reversal / boundary:** A content edit may create a new content revision without changing the lesson identity if that is the library’s rule.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles](https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b04-i032

- **Learning objective:** Choose how to prepare for a new archive schema.
- **Visible facts and asked decision:** A whiteboard session owns accepted strokes and a closing state. The export archive format changes when storage vendors revise their file schema; the collaboration rule changes when product policy changes how concurrent strokes are resolved. Choose how to prepare for a new archive schema.
- **Key decision:** Have WhiteboardSession supply accepted strokes; serialize them to the chosen archive format.
- **Closest alternative and diagnosis:** Move concurrent-stroke acceptance into the serializer so it can write whichever format is current. — A storage schema revision would then change which participant strokes become accepted.
- **Reversal / boundary:** If conflict policy changes, update the session’s collaboration behavior independently.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles](https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b04-i033

- **Learning objective:** Choose how to isolate a messaging vendor replacement.
- **Visible facts and asked decision:** A support case owns assignee and response deadline. Escalation priority changes with support policy; the notification system changes when the messaging vendor changes. Choose how to isolate a messaging vendor replacement.
- **Key decision:** Have SupportCase determine escalation; deliver notices through a notifier adapter.
- **Closest alternative and diagnosis:** Put vendor-specific message fields on SupportCase and update it with each provider contract. — The case lifecycle would change for an unrelated communication format revision.
- **Reversal / boundary:** Notification failure should be observable without silently changing the case’s urgency.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles](https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b04-i034

- **Learning objective:** Choose a design that accommodates a new thumbnail format without moving listing eligibility rules.
- **Visible facts and asked decision:** A produce listing stores price, stock, and publication status. Publication eligibility changes with market rules; image thumbnails change format when the CDN changes. Choose a design that accommodates a new thumbnail format without moving listing eligibility rules.
- **Key decision:** Keep publication rules with Listing; isolate thumbnail transformation.
- **Closest alternative and diagnosis:** Move listing publication into the CDN adapter because it already receives the product image. — A media-format update should not change the market rule for price and stock.
- **Reversal / boundary:** A new market eligibility rule belongs with Listing even if a thumbnail format is unchanged.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles](https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b04-i035

- **Learning objective:** Choose how a clearing-network field addition should affect repayment allocation.
- **Visible facts and asked decision:** A lending ledger stores repayment amount and how it is allocated across loans. The allocation rule changes when a loan contract changes; bank settlement messages change when the clearing network changes. Choose how a clearing-network field addition should affect repayment allocation.
- **Key decision:** Keep allocation with LoanAccount; translate settled transfers separately.
- **Closest alternative and diagnosis:** Move allocation into the clearing adapter so it can populate the network’s new field. — A clearing protocol update would then change a borrower’s contract allocation.
- **Reversal / boundary:** The adapter can report a rejected transfer while the loan records the settlement outcome separately.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles](https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b04-i036

- **Learning objective:** Choose how to accommodate a new map-tile provider.
- **Visible facts and asked decision:** A garden allocation records plot assignment and soil approval. Eligibility criteria change when the community revises its growing rules; map tiles change when the geographic provider changes. Choose how to accommodate a new map-tile provider.
- **Key decision:** Keep eligibility on PlotAssignment; delegate map-provider rendering.
- **Closest alternative and diagnosis:** Let the map adapter decide whether the gardener qualifies because it receives the plot coordinates. — A tile provider’s changes do not define the community’s eligibility criteria.
- **Reversal / boundary:** If plot boundaries change, update the authoritative allocation geometry separately from its rendered tiles.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles](https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b04-i037

- **Learning objective:** Choose a boundary for the catalog search schema revision.
- **Visible facts and asked decision:** A bundle record selects component offers and has a price calculation. Pricing rules change when commercial terms change; search-index fields change when the catalog search vendor revises its schema. Choose a boundary for the catalog search schema revision.
- **Key decision:** Keep Bundle price from selected offers; map search documents separately.
- **Closest alternative and diagnosis:** Move price calculation into the search adapter because it already reads component fields. — A search schema change would then alter the price customers see.
- **Reversal / boundary:** A search projection may be rebuilt from the bundle but should not become a second price authority.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles](https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.

#### ood-n02-b04-i038

- **Learning objective:** Choose how to respond to a billing-provider API change.
- **Visible facts and asked decision:** A charging reservation stores connector, window, and reservation status. Reservation policy changes with utility programs; billing-provider APIs change when payment vendors add fields. Choose how to respond to a billing-provider API change.
- **Key decision:** Keep reservation policy with ChargingReservation; translate billing requests separately.
- **Closest alternative and diagnosis:** Add each provider’s billing fields to ChargingReservation and let it construct vendor-specific requests. — A provider revision would then change the reservation model despite separate change triggers.
- **Reversal / boundary:** The reservation may supply completed usage to the adapter without transferring ownership of its lifecycle.
- **Primary-source coverage:** [https://docs.oracle.com/javase/tutorial/java/concepts/](https://docs.oracle.com/javase/tutorial/java/concepts/); [https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles](https://learn.microsoft.com/dotnet/standard/modern-web-apps-azure-architecture/architectural-principles). These sources support the general concept of object state/behavior and domain-model responsibility; scenario rules are supplied in the prompt.
