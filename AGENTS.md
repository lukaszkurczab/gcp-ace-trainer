# Agent execution policy

Every delegated implementation, QA, research, review, or release task must use
the Luna model (`gpt-5.6-luna`) with `max` reasoning effort. Do not delegate to
Terra, Sol, or another model. Record the exact model and reasoning effort in
each task's evidence report.

## Independent approach validation

Before implementation, delegate evaluation of the proposed approach to an
independent Luna agent using `gpt-5.6-luna` with `max` reasoning effort. The
validator receives exactly these sections:

1. **Cel** — the intended product or engineering outcome.
2. **Ustalenia** — confirmed facts, constraints, risks, and assumptions already
   established by the primary agent.
3. **Podejście** — the smallest proposed coherent change set.

The validator must return a validation of that briefing only. It must not
inspect, search, read, run, or otherwise re-audit repository code, tests,
configuration, documentation, or external systems. Missing evidence must be
called out as a limitation of the briefing, rather than independently filled
in through a new audit.

The validation must state separate 0–1 scores for consistency, simplicity,
risk, and maintainability, with the final score equal to their minimum;
decisive reasons; material risks; and either approval or a concrete redesign
recommendation. A final score below 0.8 rejects the approach. The primary agent
remains responsible for supplying an accurate briefing and resolving any
recommendation against repository evidence.
