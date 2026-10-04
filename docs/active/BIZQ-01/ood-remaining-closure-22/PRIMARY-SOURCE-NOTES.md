# Primary-source checks for N06 authoring

Checked 2026-10-04. These notes support technical boundaries; hypothetical scenario facts still require explicit wording in each question. They do not accept a proposed item or dictate a product policy.

- [Microsoft .NET Observer documentation](https://learn.microsoft.com/en-us/dotnet/standard/events/observer-design-pattern) describes subscriber registration and unsubscription via the returned `IDisposable`. It expressly leaves observer notification order undefined and identifies simpler local alternatives. Therefore a question requiring effective revision order must state its extra ordering protocol; Observer alone does not provide FIFO, durable delivery or exactly-once behavior. Applicable to B04, especially the existing platform-change gap.
- [Microsoft domain-events design documentation](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation) describes dispatch before or after transaction commit and synchronous or asynchronous execution. Those choices determine transaction/consistency boundaries. Therefore B09 must state the required boundary rather than treating after-commit dispatch as universal; the pattern alone establishes no durable delivery or exactly-once guarantee. B03/B10 must similarly distinguish command intent, local undo, compensation and actual transactional guarantees using stated facts.
- [OMG UML 2.5.1 specification landing page](https://www.omg.org/spec/UML/2.5.1/About-UML) was inspected to identify its normative PDF. The PDF was not reviewed here; this check supports no detailed UML semantic claim.

Root sent the two technical cautions to the respective authors before their proposals. Use additional applicable primary sources for any concrete language/framework claim not covered here. No external code or content was copied.

## Additional actual primary-source reads — B06/B07

Root opened the current [Microsoft Template Method episode description](https://learn.microsoft.com/en-us/shows/visual-studio-toolbox/design-patterns-template-method). The description defines an operation's algorithm skeleton with some steps deferred to subclasses. The video and sample implementation were not inspected. This supports reviewing whether B07 actually trains the fixed skeleton/overridable step distinction; it does not mandate inheritance in unrelated questions or prove a proposed object meets the unit objective.

Root also opened the [publisher book page](https://www.informit.com/store/design-patterns-elements-of-reusable-object-oriented-9780321770462), confirming the authors, description and table of contents including Chain of Responsibility and Template Method. The chapter bodies were not read. Book presence is not proof of scenario-specific routing, ordering, payment or persistence guarantees.

## B10: Microsoft Saga reference, actual read 2026-10-04

[Microsoft Learn — Saga distributed transactions pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga), article sections Solution, Key concepts, Orchestration, Problems and considerations were actually read through the web reader. It distinguishes reversible compensation, a committed/pivot boundary and retryable subsequent operations. Orchestration coordinates participants and recovery. Compensation can fail, and a saga does not provide built-in isolation across services.

Application to proposed N06-B10 is conditional: releasing a stated temporary hold is compensation; a permitted projection delay after an accepted fact is a retry issue. Do not infer atomic cross-service commit, guaranteed compensation, exactly-once external delivery or race-free access from merely sequencing calls. Several examples are local workflow decisions, so the reference does not mandate a distributed Saga for them. No video, linked implementation sample or service was executed.
