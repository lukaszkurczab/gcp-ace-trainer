# Independent semantic review — N05-B05 proposal v1

**Verdict: REVISE B05 i006 and i014 before acceptance.** The other fifteen objects fit Decorator/Proxy behavior and present visible, case-specific wrapper triggers or boundaries. One object has a missing decisive premise; another asks for an Adapter decision under the Decorator/Proxy learning unit and reuses its old question ID.

## Frozen inputs and scope

- Proposal `proposals/N05-B05.json`: SHA-256 `b623a7aad4d0dc9f6e4e6ce1eea8321dff7e3bc3b8eb193e7c12ad4c07a48c3c`
- `N05-MANIFEST.json`: SHA-256 `bdef2880a62de54f54e3c06cb9ffc9bd5c900be31c6135d7a0b16c7583ab320a`
- `N05-CONTRACT.json`: SHA-256 `f1252079b899164632accbf4168e5c77c46fb004879a6865f218c8f5707a53f2`
- Canonical `docs/07-content-guidelines.md`: SHA-256 `5a949d18184d4713642eff447821c7b06aae04304454c72226372c4fd8b268af`

I compared all 17 full B05 before objects to their corresponding proposal objects, including every answer option, Reason, all five Details fields, stable-ID feedback, source references, and the unchanged/current question IDs. I checked technical framing against the cited pattern references and the actual BIZQ-01 §4.1/§4.3/§4.4 criteria. This is a staged B05 verdict only.

## Blocking item findings

| Item | Finding | Smallest coherent correction |
| --- | --- | --- |
| `ood-n05-b05-i006` | The key and Details say the seal result returns the exact revision identity, but the prompt only says the service accepts an immutable revision and produces a seal. That result field is a new decisive fact first introduced in Details, so the proposed “audit the returned identity” answer is not uniquely established by the prompt. | State that the seal response includes the immutable revision identity, or make the decision audit the prompt-visible input identity only after successful sealing. Keep the same ID if this remains the same decorator/audit decision. |
| `ood-n05-b05-i014` | The key’s primary operation is protocol translation: “Adapt carrier protocol at the integration boundary.” No decorator-added policy/access behavior or proxy access is needed. That is the Adapter learning objective in N05-B04, not this N05-B05 Decorator/Proxy item. The proposal nevertheless retains i014. | Rewrite to a real wrapper/decorator/proxy case under B05 and preserve i014 if its original wrapper meaning remains. If the primary Adapter decision is retained, it requires an identity change and does not meet this unit’s objective as currently written. |

## Per-item dispositions

| Item | Current primary decision | Review |
| --- | --- | --- |
| i001 | Decorate shared connector boundary with consent policy before delegation | PASS; scope and trigger visible |
| i002 | Virtual proxy defers archived attempt load until data access | PASS; stable interface and expensive unused data are explicit |
| i003 | Protection proxy rejects revoked credential before approval service | PASS; access policy is distinct from approval validity |
| i004 | Lazy media proxy preserves stable segment IDs and defers playback load | PASS; identity and access conditions visible |
| i005 | Per-call expiry protection proxy around stable role operation | PASS; envelope expiry is explicitly separate from approval state |
| i006 | Decorator records identity of revision actually sealed | REVISE; returned identity is unstated in prompt |
| i007 | Best-effort metrics decorator does not alter idempotent payout result | PASS; prompt makes telemetry failure independent |
| i008 | Per-channel delivery proxy preserves service-assigned sequence and retries | PASS; sequence ownership and retry scope are stated |
| i009 | Shared overlap invariant remains atomic in reservation owner, not wrapper-only | PASS; tests the limit of proxy authority with multiple processes |
| i010 | Session proxy pins one provider behind the stable stream contract | PASS; lifecycle boundary is explicit |
| i011 | Authorization proxy delegates unchanged atomic pair swap | PASS; separates caller access from domain transition |
| i012 | Remote proxy preserves domain conflicts and separate transport failures | PASS; prompt’s outage/conflict distinction is decisive |
| i013 | Decorator audits successful grant without taking eligibility/mutation | PASS; acceptance depends on returned operation outcome |
| i014 | Adapter translates carrier protocol behind a stable port | REVISE; wrong learning unit and current identity retained despite different objective |
| i015 | Preview uses a calculation-only, nonmutating contract rather than wrapping a command | PASS; a useful proxy-boundary case; no claim that a proxy can erase target side effects |
| i016 | Access proxy guards official while bracket owns legal state transition | PASS; access and transition are distinct |
| i017 | Decorator observes classification without granting refund authority | PASS; boundary between classification and refund is visible |

For the other items, wrong-option feedback points to the current option IDs and matches the respective mistaken action. Reason and Details usually derive the keyed boundary from prompt-visible facts. The questions use varied proxy roles (virtual, protection, remote, session-bound) and decorator roles (consent, audit, metrics); repeated use of those core mechanisms is legitimate practice, not itself a duplicate finding.

## Source and identity notes

The GoF *Design Patterns* reference is applicable to the generic decorator/proxy concepts. Fowler’s [Lazy Load](https://martinfowler.com/eaaCatalog/lazyLoad.html) specifically describes a virtual proxy with the same interface that loads and delegates on first access, supporting i002/i004. Microsoft’s [`RealProxy`](https://learn.microsoft.com/en-us/dotnet/api/system.runtime.remoting.proxies.realproxy?view=netframework-4.5) reference documents call forwarding in that .NET Framework API; this review does not infer a current-runtime requirement from it. Fowler’s [Gateway](https://martinfowler.com/eaaCatalog/gateway.html) describes translating specialized external APIs behind a regular interface, which reinforces why i014 is an Adapter/Gateway-style decision rather than a B05 wrapper-policy case.

The old B05 keyed option is a wrapper rule: wrap a stable contract when adding separable policy/access behavior without changing the underlying obligation. The current items generally repair that same objective with visible triggers, so their existing IDs may remain. i014 is the exception: if its Adapter decision stays, it has changed the primary meaning and cannot retain the old question ID under the manifest/canonical identity rule. The simplest correction is to return i014 to B05 Decorator/Proxy behavior and preserve its ID.

## Acceptance boundary

These findings do not authorize source changes or question-map activation. B05 can be accepted after i006’s missing prompt fact is made visible and i014 tests the declared unit objective with a consistent identity action. The other 15 whole objects may then reuse this review if their bytes remain identical. Final acceptance still requires all nine N05 units and the planned cross-unit/current N01–N04 comparison.
