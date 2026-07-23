import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { canStartCanonicalSimulationMutation, CanonicalProductContractValidationError, CanonicalUserFacingTaskReadinessError, getCanonicalRequirementTestCoverage, isDeclaredCanonicalSessionTransition, loadCanonicalProductContract, parseCanonicalProductContract, resolveCanonicalUserFacingTaskDesignReference } from "../scripts/validateCanonicalProductContract";

const validContract = readFileSync("docs/canonical-product-contract.yaml", "utf8");

test("parses the canonical product contract", () => {
  const contract = loadCanonicalProductContract();
  assert.equal(contract.version, 1);
  assert.equal(contract.authority.normativeSource, "canonical-product-contract");
  assert.equal(contract.authority.narrativeDocuments, "non-normative");
});

test("keeps mode matrices and fixed configuration values out of narrative docs", () => {
  const narrativeDocs = [
    "docs/03-navigation-and-flows.md",
    "docs/00-overview.md",
    "docs/04-data-model.md",
    "docs/05-design-system.md",
    "docs/06-branding-and-style-direction.md",
    "docs/08-storage-and-offline.md",
    "docs/11-implementation-guidelines.md",
    "docs/12-testing-strategy.md",
    "docs/15-certification-track-learning-system.md",
    "docs/16-leetcode-like-learning-system.md",
    "docs/17-training-runtime-and-interaction-spec.md",
    "docs/designs/README.md",
    "docs/designs/algorithms_stage3_ui/DESIGN.md",
  ];
  const removedMatrixConstructs = [
    /\|\s*Mode\s*\|\s*Default length\s*\|/,
    /Supported requested lengths/,
    /Algorithms supports exactly these modes:/,
    /Certification supports exactly these modes:/,
    /Algorithms has exactly these user-facing modes:/,
    /Reinsert is enabled only (?:for|in):/,
    /at least three other (?:durable )?submitted items/,
    /three-item gap/,
    /maximum-one (?:rule|reinsert)/,
    /prefer a reviewed variant of the same mechanism/,
    /exact source item is used only when no compatible reviewed variant exists/,
    /45-minute (?:foreground|active-foreground) countdown/,
    /exactly 40 (?:unique )?(?:items|occurrences)/,
    /max\(0, 45 minutes - canonicalActiveForegroundMs\)/,
  ];

  for (const path of narrativeDocs) {
    const source = readFileSync(path, "utf8");
    for (const construct of removedMatrixConstructs) {
      assert.doesNotMatch(source, construct, `${path} must not maintain ${construct}`);
    }
  }
});

test("maps every canonical requirement to real tests and rejects incomplete or invalid mappings", () => {
  const contract = loadCanonicalProductContract();
  assert.deepEqual(
    getCanonicalRequirementTestCoverage(contract).map(({ requirementId, tests }) => [requirementId, tests.map((test) => test.id)]),
    [
      ["CONTRACT-AUTHORITY-001", ["canonical-contract-authority"]],
      ["ALGORITHMS-MODE-MATRIX-001", ["canonical-algorithms-mode-matrix"]],
      ["ALGORITHMS-CUSTOM-PRACTICE-001", ["canonical-custom-practice-contract"]],
      ["ALGORITHMS-REINSERT-POLICY-001", ["canonical-algorithms-reinsert-policy"]],
      ["CERTIFICATION-MODE-MATRIX-001", ["canonical-certification-mode-matrix"]],
      ["USER-COMMAND-MODEL-001", ["canonical-session-command-model"]],
      ["USER-COMMAND-RESUME-001", ["canonical-session-command-model"]],
      ["SESSION-STATE-MACHINE-001", ["canonical-session-state-machine"]],
      ["SIMULATION-CONCURRENCY-001", ["canonical-simulation-concurrency"]],
      ["SIMULATION-TIMER-CADENCE-001", ["canonical-simulation-timer-cadence"]],
      ["NARRATIVE-DOCS-CANONICALIZATION-001", ["canonical-narrative-docs"]],
      ["DESIGN-REFERENCE-REGISTRY-001", ["canonical-design-reference-readiness"]],
    ],
  );
  assert.throws(
    () => parseCanonicalProductContract(validContract.replace("id: canonical-algorithms-mode-matrix", "id: canonical-contract-authority")),
    /Duplicate canonical requirement test identifier: canonical-contract-authority/,
  );
  assert.throws(
    () => parseCanonicalProductContract(validContract.replace("requirementIds: [CONTRACT-AUTHORITY-001]", "requirementIds: [UNKNOWN-REQUIREMENT-001]")),
    /Canonical requirement test references an unknown requirement: canonical-contract-authority -> UNKNOWN-REQUIREMENT-001/,
  );
  assert.throws(
    () => parseCanonicalProductContract(validContract.replace("requirementIds: [CONTRACT-AUTHORITY-001]", "requirementIds: [USER-COMMAND-MODEL-001]")),
    /Canonical requirement has no mapped test: CONTRACT-AUTHORITY-001/,
  );
});

test("defines canonical user commands and maps every session CTA to its one application command", () => {
  const contract = loadCanonicalProductContract();

  assert.deepEqual(contract.requirements.find((requirement) => requirement.id === "USER-COMMAND-MODEL-001"), {
    id: "USER-COMMAND-MODEL-001",
    statement: "Every canonical session CTA maps to exactly one declared application command; save-and-continue is declared only as the atomic save-and-advance intent and has no CTA or implementation in this contract change.",
  });
  assert.deepEqual(contract.requirements.find((requirement) => requirement.id === "USER-COMMAND-RESUME-001"), {
    id: "USER-COMMAND-RESUME-001",
    statement: "Resume is distinct from recover because a user-facing Resume CTA restores an active session, while recover replays a pending durable mutation.",
  });
  assert.deepEqual(contract.userCommands, {
    commands: [
      { id: "submit" }, { id: "next" }, { id: "save" }, { id: "save-and-continue" }, { id: "navigator-jump" },
      { id: "finish" }, { id: "leave-resumable" }, { id: "abandon" }, { id: "recover" }, { id: "resume" },
    ],
    sessionCtaMappings: [
      { ctaId: "practice-submit", commandId: "submit" },
      { ctaId: "practice-next", commandId: "next" },
      { ctaId: "practice-finish", commandId: "finish" },
      { ctaId: "practice-leave-resumable", commandId: "leave-resumable" },
      { ctaId: "practice-abandon", commandId: "abandon" },
      { ctaId: "practice-recover", commandId: "recover" },
      { ctaId: "simulation-save", commandId: "save" },
      { ctaId: "simulation-navigator-jump", commandId: "navigator-jump" },
      { ctaId: "simulation-finish", commandId: "finish" },
      { ctaId: "simulation-leave-resumable", commandId: "leave-resumable" },
      { ctaId: "simulation-abandon", commandId: "abandon" },
      { ctaId: "simulation-recover", commandId: "recover" },
      { ctaId: "session-resume", commandId: "resume" },
    ],
  });
});

test("locks FIFO serialization for every simulation mutation of one active session", () => {
  const contract = loadCanonicalProductContract();
  assert.deepEqual(contract.simulationConcurrency, {
    scope: "oneActiveSession", queueDiscipline: "fifo", maxInFlight: 1, revalidateActiveSessionAtExecution: true,
    mutationKinds: ["save", "navigation", "timer-checkpoint", "foreground-transition", "finalization", "abandonment"],
  });
  assert.deepEqual(contract.requirements.find((requirement) => requirement.id === "SIMULATION-CONCURRENCY-001"), {
    id: "SIMULATION-CONCURRENCY-001",
    statement: "A simulation has one active session mutation lane: save, navigation, timer checkpoint, foreground transition, finalization, and abandonment are FIFO-serialized with at most one in flight, and revalidate the active session immediately before execution.",
  });
  assert.throws(() => parseCanonicalProductContract(validContract.replace("mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization, abandonment]", "mutationKinds: [save, save, timer-checkpoint, foreground-transition, finalization, abandonment]")), CanonicalProductContractValidationError);

  const table = [
    ...contract.simulationConcurrency.mutationKinds.map((kind) => ({ label: `${kind} starts when the lane is empty`, input: { kind, inFlightKinds: [] }, expected: true })),
    ...contract.simulationConcurrency.mutationKinds.flatMap((kind) => contract.simulationConcurrency.mutationKinds.map((inFlightKind) => ({
      label: `${kind} cannot run concurrently with ${inFlightKind}`,
      input: { kind, inFlightKinds: [inFlightKind] },
      expected: false,
    }))),
    { label: "unknown mutations cannot enter the lane", input: { kind: "unknown", inFlightKinds: [] }, expected: false },
    { label: "a known mutation cannot enter behind an unknown in-flight mutation", input: { kind: "save", inFlightKinds: ["unknown"] }, expected: false },
  ] as const;
  for (const { label, input, expected } of table) {
    assert.equal(canStartCanonicalSimulationMutation(contract, input), expected, label);
  }
});

test("defines the versioned simulation timer cadence without per-refresh durable writes", () => {
  const contract = loadCanonicalProductContract();
  assert.deepEqual(contract.requirements.find((requirement) => requirement.id === "SIMULATION-TIMER-CADENCE-001"), {
    id: "SIMULATION-TIMER-CADENCE-001",
    statement: "Simulation timer projections refresh every second without a durable write; durable checkpoints occur every 15 seconds with at most one second of drift and at every declared lifecycle checkpoint.",
  });
  assert.deepEqual(contract.simulationTimerCadence, {
    version: 1,
    uiRefreshIntervalMs: 1_000,
    uiRefreshWritesDurably: false,
    durableCheckpointIntervalMs: 15_000,
    maxDurableCheckpointDriftMs: 1_000,
    lifecycleCheckpoints: ["foreground-enter", "foreground-leave", "draft-save", "finalization", "expiry"],
  });
});

test("requires a registered APPROVED design reference before a user-facing task is ready", () => {
  const sourceWithApprovedReference = validContract.replace(
    "  references: []\n",
    "  references:\n    - id: algorithms-stage3-ui-reference-packet\n      screenStateTarget: algorithms-practice-and-interview-simulation\n      patternPath: docs/designs/algorithms_stage3_ui/DESIGN.md\n      version: 1\n      approvalStatus: APPROVED\n      owner: product-owner\n",
  );
  const approvedContract = parseCanonicalProductContract(sourceWithApprovedReference);
  const approvedReference = resolveCanonicalUserFacingTaskDesignReference(approvedContract, {
    status: "ready",
    designReferenceId: "algorithms-stage3-ui-reference-packet",
  });

  assert.deepEqual(approvedReference, {
    id: "algorithms-stage3-ui-reference-packet",
    screenStateTarget: "algorithms-practice-and-interview-simulation",
    patternPath: "docs/designs/algorithms_stage3_ui/DESIGN.md",
    version: 1,
    approvalStatus: "APPROVED",
    owner: "product-owner",
  });
  assert.deepEqual(approvedContract.designReferences.uiOwnership, []);
  assert.equal(resolveCanonicalUserFacingTaskDesignReference(approvedContract, { status: "not-ready" }), undefined);
  assert.throws(
    () => resolveCanonicalUserFacingTaskDesignReference(approvedContract, { status: "ready" }),
    (error: unknown) => error instanceof CanonicalUserFacingTaskReadinessError && /must name a design reference/.test(error.message),
  );
  assert.throws(
    () => resolveCanonicalUserFacingTaskDesignReference(approvedContract, { status: "ready", designReferenceId: "unknown-reference" }),
    (error: unknown) => error instanceof CanonicalUserFacingTaskReadinessError && /unknown design reference/.test(error.message),
  );

  const pendingContract = parseCanonicalProductContract(sourceWithApprovedReference.replace("approvalStatus: APPROVED", "approvalStatus: PENDING"));
  assert.throws(
    () => resolveCanonicalUserFacingTaskDesignReference(pendingContract, { status: "ready", designReferenceId: "algorithms-stage3-ui-reference-packet" }),
    (error: unknown) => error instanceof CanonicalUserFacingTaskReadinessError && /requires an APPROVED design reference/.test(error.message),
  );
});

test("defines the closed durable session state machines and accepts only declared triggered transitions", () => {
  const contract = loadCanonicalProductContract();
  const lifecycleSource = readFileSync("src/application/trainingLifecycle/TrainingLifecycleUseCases.ts", "utf8");

  assert.deepEqual(contract.requirements.find((requirement) => requirement.id === "SESSION-STATE-MACHINE-001"), {
    id: "SESSION-STATE-MACHINE-001",
    statement: "Practice and simulation expose only their declared durable operation states and triggered transitions; recovery returns only the state declared for the recovered durable mutation.",
  });
  assert.deepEqual(contract.sessionStateMachine.practice.states, [
    "unanswered", "submitting_before_journal", "submit_journal_failed", "commit_pending", "commit_materialization_failed", "commit_verification_failed", "verified_pending_clear", "recovery_required", "feedback", "advancing", "advance_failed", "completing", "completion_failed", "completed", "abandoning", "abandonment_failed_before_journal", "abandonment_recovery_required", "abandoned",
  ]);
  assert.deepEqual(contract.sessionStateMachine.simulation.states, [
    "editable", "saving", "save_failed", "stale_revision", "navigating", "navigation_failed", "frozen", "finalization_journal_pending", "finalization_journal_failed", "materializing", "materialization_failed", "verifying", "verification_failed", "verified_pending_clear", "recovery_required", "timer_recovery_failed", "missing_draft", "version_mismatch", "corrupt_state", "abandoning", "abandonment_failed_before_journal", "abandonment_recovery_required", "abandoned", "completed",
  ]);

  const machines = [
    { family: "practice" as const, machine: contract.sessionStateMachine.practice },
    { family: "simulation" as const, machine: contract.sessionStateMachine.simulation },
  ];
  for (const { family, machine } of machines) {
    const declared = new Set(machine.transitions.map((transition) => `${transition.from}:${transition.trigger}:${transition.condition ?? "none"}:${transition.to}`));
    const triggers = [...new Set(machine.transitions.map((transition) => transition.trigger))];
    for (const from of machine.states) for (const trigger of triggers) for (const condition of [undefined, "durable_state_not_durable", "journal_status_durable", "journal_status_materialized", "journal_status_verified_pending_clear", "recovered_active_session"] as const) for (const to of machine.states) {
      const input = { family, from, trigger, condition, to } as Parameters<typeof isDeclaredCanonicalSessionTransition>[1];
      assert.equal(isDeclaredCanonicalSessionTransition(contract, input), declared.has(`${from}:${trigger}:${condition ?? "none"}:${to}`), `${family} ${from} --${trigger}/${condition ?? "none"}--> ${to}`);
    }
    for (const transition of machine.transitions) {
      assert.equal(isDeclaredCanonicalSessionTransition(contract, { family, ...transition } as Parameters<typeof isDeclaredCanonicalSessionTransition>[1]), true);
    }
  }
  assert.equal(isDeclaredCanonicalSessionTransition(contract, { family: "practice", from: "unanswered", trigger: "unknown" as never, to: "feedback" }), false);
  assert.equal(isDeclaredCanonicalSessionTransition(contract, { family: "simulation", from: "editable", trigger: "unknown" as never, to: "completed" }), false);

  assert.match(lifecycleSource, /pending\?\.operation === "submit_training_outcome" \? practice\("feedback"\) : practice\("unanswered"\)/);
  assert.match(lifecycleSource, /simulation\("navigation_failed", operationError\("simulation_navigation", error instanceof MutationCommitFailure \? error\.durableState : "not_durable", error instanceof MutationCommitFailure && error\.durableState !== "not_durable" \? "recover" : "retry_same_command"\)\)/);
  assert.match(lifecycleSource, /const state = pending\s+\? simulationSession \? simulationPendingFor\(pending\.status\)/);
  assert.match(lifecycleSource, /if \(status === "journal_durable"\) return simulation\("materializing"\);\s+if \(status === "materialized"\) return simulation\("verifying"\);\s+return simulation\("verified_pending_clear"/);
  assert.match(lifecycleSource, /if \(!verified\) \{\s+this\.operationStates\.clear\(active\.id\);\s+return;\s+}\s+const simulationSession = verified\.configurationSnapshot\.submission === "manualOrForegroundTimeout";\s+this\.operationStates\.publish\(verified\.id, simulationSession \? simulation\("editable"\)/);
  assert.equal(contract.sessionStateMachine.simulation.transitions.some((transition) => transition.from === "navigation_failed" && transition.trigger === "recover"), false);
  assert.equal(contract.sessionStateMachine.simulation.transitions.some((transition) => transition.from === "abandonment_recovery_required" && transition.trigger === "recover"), false);
  assert.doesNotMatch(lifecycleSource, /practice\("(?:completing|completion_failed)"\)/);
  assert.doesNotMatch(lifecycleSource, /this\.operationStates\.set\(session\.id, simulation\("(?:materializing|verifying)"\)/);
});

test("defines exactly the complete canonical Algorithms mode matrix", () => {
  const contract = loadCanonicalProductContract();

  assert.deepEqual(contract.algorithms.modes, [
    {
      id: "algorithms-learn-approach", label: "Learn Approach", lengths: { default: 10, supported: [10] }, scope: "oneMentalUnit", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: false,
    },
    {
      id: "algorithms-guided-practice", label: "Guided Practice", lengths: { default: 20, supported: [10, 20, 40] }, scope: "oneMentalUnit", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: true,
    },
    {
      id: "algorithms-custom-practice", label: "Custom Practice", lengths: { default: 20, supported: [10, 20, 40] }, scope: "guidedPracticeBlueprintForSelectedMentalUnit", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer", "atSessionEnd"] }, timer: { kind: "elapsedForeground" }, reinsert: true,
    },
    {
      id: "algorithms-recognize-patterns", label: "Recognize Patterns", lengths: { default: 20, supported: [10, 20, 40] }, scope: "declaredRecognitionSet", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: false,
    },
    {
      id: "algorithms-contrast-practice", label: "Contrast Practice", lengths: { default: 20, supported: [10, 20, 40] }, scope: "declaredContrastSet", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: false,
    },
    {
      id: "algorithms-weak-area-review", label: "Weak Area Review", lengths: { default: 10, supported: [10, 20] }, scope: "eligibleDueReviewOrCompletedSessionMisses", shortening: "allowed",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: true,
    },
    {
      id: "algorithms-independent-practice", label: "Independent Practice", lengths: { default: 20, supported: [10, 20, 40] }, scope: "declaredInterleavedScope", shortening: "blueprintControlled",
      feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer"] }, timer: { kind: "elapsedForeground" }, reinsert: false,
    },
    {
      id: "algorithms-interview-simulation", label: "Interview Simulation", lengths: { default: 40, supported: [40] }, scope: "fixedSimulationBlueprint", shortening: "prohibited",
      feedback: { default: "atSessionEnd", supported: ["atSessionEnd"] }, timer: { kind: "countdownForeground", durationMs: 2_700_000 }, reinsert: false,
    },
  ]);
});

test("locks the Custom Practice contract required by ALGORITHMS-CUSTOM-PRACTICE-001", () => {
  const contract = loadCanonicalProductContract();
  const customPractice = contract.algorithms.modes.find((mode) => mode.id === "algorithms-custom-practice");

  assert.deepEqual(
    contract.requirements.find((requirement) => requirement.id === "ALGORITHMS-CUSTOM-PRACTICE-001"),
    {
      id: "ALGORITHMS-CUSTOM-PRACTICE-001",
      statement: "Custom Practice accepts only 10, 20, or 40 items and explicit afterEachAnswer or atSessionEnd feedback, uses the Guided Practice blueprint for an explicitly selected mental unit, and shares the one-active-session lifecycle with profile-owned reinsert.",
    },
  );
  assert.deepEqual(customPractice, {
    id: "algorithms-custom-practice", label: "Custom Practice", lengths: { default: 20, supported: [10, 20, 40] }, scope: "guidedPracticeBlueprintForSelectedMentalUnit", shortening: "allowed",
    feedback: { default: "afterEachAnswer", supported: ["afterEachAnswer", "atSessionEnd"] }, timer: { kind: "elapsedForeground" }, reinsert: true,
  });
  assert.deepEqual(contract.algorithms.customPractice, {
    modeId: "algorithms-custom-practice",
    contentBlueprintModeId: "algorithms-guided-practice",
    mentalUnitSelection: "explicit",
    reinsertOwnership: "profile",
    lifecycle: "sharedOneActiveSession",
  });
});

test("locks the versioned Algorithms reinsert placement policy", () => {
  const contract = loadCanonicalProductContract();

  assert.deepEqual(contract.requirements.find((requirement) => requirement.id === "ALGORITHMS-REINSERT-POLICY-001"), {
    id: "ALGORITHMS-REINSERT-POLICY-001",
    statement: "Algorithms reinsert permits one eligible incorrect or partial source attempt after at least three intervening durable submissions, preferring a compatible reviewed variant then an exact-source fallback, and skips when no valid slot exists.",
  });
  assert.deepEqual(contract.algorithms.reinsertPolicy, {
    version: 1,
    eligibleResultKinds: ["incorrect", "partial"],
    maxReinsertsPerSource: 1,
    minInterveningDurableSubmissions: 3,
    variantSelectionOrder: ["compatibleReviewedVariant", "exactSourceFallback"],
    missingValidSlot: "skip",
  });
  assert.throws(
    () => parseCanonicalProductContract(validContract.replace("minInterveningDurableSubmissions: 3", "minInterveningDurableSubmissions: 2")),
    /must be equal to constant/,
  );
  assert.throws(
    () => parseCanonicalProductContract(validContract.replace("variantSelectionOrder: [compatibleReviewedVariant, exactSourceFallback]", "variantSelectionOrder: [exactSourceFallback, compatibleReviewedVariant]")),
    /must be equal to constant/,
  );
});

test("defines exactly the complete declared Certification mode matrix", () => {
  const contract = loadCanonicalProductContract();

  assert.deepEqual(
    contract.requirements.find((requirement) => requirement.id === "CERTIFICATION-MODE-MATRIX-001"),
    {
      id: "CERTIFICATION-MODE-MATRIX-001",
      statement: "Certification exposes exactly seven declared modes, each owned by the certification family and cloud-certification track with explicit contract, implementation, and verification status.",
    },
  );
  assert.deepEqual(contract.certification.modes, [
    { id: "certification-diagnostic-baseline", label: "Diagnostic Baseline", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "unavailable", verification: "unverified" } },
    { id: "certification-focus-practice", label: "Focus Practice", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "unavailable", verification: "unverified" } },
    { id: "certification-scenario-practice", label: "Scenario Practice", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "unavailable", verification: "unverified" } },
    { id: "certification-weak-area-review", label: "Weak Area Review", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "unavailable", verification: "unverified" } },
    { id: "certification-mixed-practice", label: "Mixed Practice", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "unavailable", verification: "unverified" } },
    { id: "certification-quick-review", label: "Quick Review", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "unavailable", verification: "unverified" } },
    { id: "certification-exam-simulation", label: "Exam Simulation", owner: { familyId: "certification", trackId: "cloud-certification" }, status: { contract: "declared", implementation: "unavailable", verification: "unverified" } },
  ]);
});

test("rejects canonical product contracts with unknown fields, missing version, empty requirements, or duplicate requirement identifiers", () => {
  const cases: readonly [string, string, RegExp][] = [
    ["unknown field", `${validContract}unexpected: value\n`, /must NOT have additional properties/],
    ["missing version", validContract.replace("version: 1\n", ""), /must have required property 'version'/],
    ["empty requirements", validContract.replace(/requirements:\n(?:  - .*\n    .*\n)+/, "requirements: []\n"), /must NOT have fewer than 1 items/],
    ["duplicate identifier", validContract.replace("    statement: Product behavior is normative only when defined by this contract.\n", "    statement: Product behavior is normative only when defined by this contract.\n  - id: CONTRACT-AUTHORITY-001\n    statement: A second requirement with the same identifier.\n"), /Duplicate canonical product contract requirement identifier/],
    ["missing user commands", validContract.replace(/userCommands:[\s\S]*?\nsessionStateMachine:/, "sessionStateMachine:"), /must have required property 'userCommands'/],
    ["unknown user command field", validContract.replace("    - id: submit\n", "    - id: submit\n      extra: value\n"), /must NOT have additional properties/],
    ["duplicate user command identifier", validContract.replace("    - id: next\n", "    - id: submit\n"), /Duplicate canonical product contract user command identifier/],
    ["duplicate session CTA identifier", validContract.replace("    - ctaId: practice-next\n", "    - ctaId: practice-submit\n"), /Duplicate canonical product contract session CTA identifier/],
    ["session CTA with undeclared command", validContract.replace("    - ctaId: practice-recover\n      commandId: recover\n", "    - ctaId: practice-recover\n      commandId: submit-recovery\n"), /Canonical session CTA must reference a declared user command: practice-recover/],
    ["missing canonical session CTA", validContract.replace("    - ctaId: simulation-recover\n      commandId: recover\n", ""), /Canonical session CTA is missing exactly one command mapping: simulation-recover/],
    ["session CTA mapped to the wrong command", validContract.replace("    - ctaId: session-resume\n      commandId: resume\n", "    - ctaId: session-resume\n      commandId: recover\n"), /Canonical session CTA command mapping does not match its intent: session-resume/],
    ["missing session state machine", validContract.replace(/sessionStateMachine:[\s\S]*?\nalgorithms:/, "algorithms:"), /must have required property 'sessionStateMachine'/],
    ["unknown session state machine field", validContract.replace("    initialState: unanswered\n", "    initialState: unanswered\n    extra: value\n"), /must NOT have additional properties/],
    ["unknown practice state", validContract.replace("states: [unanswered,", "states: [unknown_state,"), /must be equal to one of the allowed values/],
    ["missing durable practice state", validContract.replace(", abandoned]\n    transitions:", "]\n    transitions:"), /must NOT have fewer than 18 items/],
    ["undeclared practice transition", validContract.replace("- { from: unanswered, trigger: abandon, to: abandoning }", "- { from: unanswered, trigger: abandon, to: completed }"), /Canonical Practice session state machine must declare exactly its allowed triggered transitions/],
    ["undeclared simulation transition", validContract.replace("- { from: editable, trigger: finish, to: frozen }", "- { from: editable, trigger: finish, to: completed }"), /Canonical Simulation session state machine must declare exactly its allowed triggered transitions/],
    ["navigation retry without durability condition", validContract.replace("condition: durable_state_not_durable, to: navigating", "to: navigating"), /Canonical Simulation session state machine must declare exactly its allowed triggered transitions/],
    ["missing simulation concurrency contract", validContract.replace(/simulationConcurrency:[\s\S]*?\nalgorithms:/, "algorithms:"), /must have required property 'simulationConcurrency'/],
    ["unknown simulation concurrency field", validContract.replace("  maxInFlight: 1\n", "  maxInFlight: 1\n  extra: value\n"), /must NOT have additional properties/],
    ["changed simulation queue discipline", validContract.replace("  queueDiscipline: fifo\n", "  queueDiscipline: lifo\n"), /must be equal to constant/],
    ["missing serialized simulation mutation", validContract.replace("mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization, abandonment]", "mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization]"), /must NOT have fewer than 6 items/],
    ["duplicate serialized simulation mutation", validContract.replace("mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization, abandonment]", "mutationKinds: [save, save, timer-checkpoint, foreground-transition, finalization, abandonment]"), /must NOT have duplicate items/],
    ["unknown serialized simulation mutation", validContract.replace("mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization, abandonment]", "mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization, unknown]"), /must be equal to one of the allowed values/],
    ["reordered serialized simulation mutations", validContract.replace("mutationKinds: [save, navigation, timer-checkpoint, foreground-transition, finalization, abandonment]", "mutationKinds: [navigation, save, timer-checkpoint, foreground-transition, finalization, abandonment]"), /Canonical Simulation concurrency contract must declare exactly its serialized mutation kinds in canonical order/],
    ["missing simulation timer cadence", validContract.replace(/simulationTimerCadence:[\s\S]*?\nalgorithms:/, "algorithms:"), /must have required property 'simulationTimerCadence'/],
    ["unknown simulation timer cadence field", validContract.replace("  uiRefreshIntervalMs: 1000\n", "  uiRefreshIntervalMs: 1000\n  extra: value\n"), /must NOT have additional properties/],
    ["missing timer cadence version", validContract.replace("  version: 1\n  uiRefreshIntervalMs: 1000\n", "  uiRefreshIntervalMs: 1000\n"), /must have required property 'version'/],
    ["changed timer cadence version", validContract.replace("  version: 1\n  uiRefreshIntervalMs: 1000\n", "  version: 2\n  uiRefreshIntervalMs: 1000\n"), /must be equal to constant/],
    ["UI refresh writes durably", validContract.replace("  uiRefreshWritesDurably: false\n", "  uiRefreshWritesDurably: true\n"), /must be equal to constant/],
    ["changed UI refresh interval", validContract.replace("  uiRefreshIntervalMs: 1000\n", "  uiRefreshIntervalMs: 2000\n"), /must be equal to constant/],
    ["changed durable checkpoint interval", validContract.replace("  durableCheckpointIntervalMs: 15000\n", "  durableCheckpointIntervalMs: 1000\n"), /must be equal to constant/],
    ["missing durable checkpoint drift", validContract.replace("  maxDurableCheckpointDriftMs: 1000\n", ""), /must have required property 'maxDurableCheckpointDriftMs'/],
    ["changed durable checkpoint drift", validContract.replace("  maxDurableCheckpointDriftMs: 1000\n", "  maxDurableCheckpointDriftMs: 2000\n"), /must be equal to constant/],
    ["missing lifecycle checkpoint", validContract.replace("[foreground-enter, foreground-leave, draft-save, finalization, expiry]", "[foreground-enter, foreground-leave, draft-save, finalization]"), /must NOT have fewer than 5 items/],
    ["reordered lifecycle checkpoints", validContract.replace("[foreground-enter, foreground-leave, draft-save, finalization, expiry]", "[foreground-leave, foreground-enter, draft-save, finalization, expiry]"), /Canonical Simulation timer cadence must declare exactly its lifecycle checkpoints in canonical order/],
    ["missing design reference registry", validContract.replace(/designReferences:[\s\S]*?\nalgorithms:/, "algorithms:"), /must have required property 'designReferences'/],
    ["unknown design reference field", validContract.replace("  references: []\n", "  references: []\n  extra: value\n"), /must NOT have additional properties/],
    ["missing design reference UI ownership", validContract.replace("  uiOwnership: []\n", ""), /must have required property 'uiOwnership'/],
    ["missing design reference approval status", validContract.replace("  references: []\n", "  references:\n    - id: algorithms-stage3-ui-reference-packet\n      screenStateTarget: algorithms-practice-and-interview-simulation\n      patternPath: docs/designs/algorithms_stage3_ui/DESIGN.md\n      version: 1\n      owner: product-owner\n"), /must have required property 'approvalStatus'/],
    ["missing design reference pattern", validContract.replace("  references: []\n", "  references:\n    - id: algorithms-stage3-ui-reference-packet\n      screenStateTarget: algorithms-practice-and-interview-simulation\n      patternPath: docs/designs/algorithms_stage3_ui/missing.md\n      version: 1\n      approvalStatus: APPROVED\n      owner: product-owner\n"), /pattern path does not resolve to a file/],
    ["design reference pattern escapes design registry", validContract.replace("  references: []\n", "  references:\n    - id: algorithms-stage3-ui-reference-packet\n      screenStateTarget: algorithms-practice-and-interview-simulation\n      patternPath: docs/designs/../plan.md\n      version: 1\n      approvalStatus: APPROVED\n      owner: product-owner\n"), /must resolve within docs\/designs/],
    ["duplicate design reference identifier", validContract.replace("  references: []\n", "  references:\n    - id: algorithms-stage3-ui-reference-packet\n      screenStateTarget: algorithms-practice-and-interview-simulation\n      patternPath: docs/designs/algorithms_stage3_ui/DESIGN.md\n      version: 1\n      approvalStatus: APPROVED\n      owner: product-owner\n    - id: algorithms-stage3-ui-reference-packet\n      screenStateTarget: algorithms-practice-and-interview-simulation\n      patternPath: docs/designs/algorithms_stage3_ui/DESIGN.md\n      version: 1\n      approvalStatus: APPROVED\n      owner: product-owner\n"), /Duplicate canonical design reference identifier/],
    ["design reference UI ownership with an unknown reference", validContract.replace("  uiOwnership: []\n", "  uiOwnership:\n    - sourcePathPrefix: src/features/\n      designReferenceId: unknown-reference\n"), /Canonical design reference UI ownership names an unknown reference: unknown-reference/],
    ["design reference UI ownership without a directory boundary", validContract.replace("  uiOwnership: []\n", "  uiOwnership:\n    - sourcePathPrefix: src/features\n      designReferenceId: unknown-reference\n"), /must match pattern/],
    ["design reference UI ownership without a trailing directory boundary", validContract.replace("  uiOwnership: []\n", "  uiOwnership:\n    - sourcePathPrefix: src/features/foo\n      designReferenceId: unknown-reference\n"), /must match pattern/],
    ["duplicate Algorithms mode identifier", validContract.replace("    - id: algorithms-guided-practice", "    - id: algorithms-learn-approach"), /Duplicate canonical product contract Algorithms mode identifier/],
    ["mismatched Algorithms mode label", validContract.replace("label: Learn Approach", "label: Interview Simulation"), /Algorithms mode label does not match its identifier/],
    ["missing Algorithms mode field", validContract.replace("      reinsert: false\n", ""), /must have required property 'reinsert'/],
    ["duplicate supported length", validContract.replace("supported: [10]", "supported: [10, 10]"), /must NOT have duplicate items/],
    ["duplicate supported feedback", validContract.replace("supported: [afterEachAnswer]", "supported: [afterEachAnswer, afterEachAnswer]"), /must NOT have duplicate items/],
    ["unsupported default length", validContract.replace("      label: Guided Practice\n      lengths:\n        default: 20\n        supported: [10, 20, 40]", "      label: Guided Practice\n      lengths:\n        default: 20\n        supported: [10]"), /Algorithms mode default length must be supported/],
    ["unsupported default feedback", validContract.replace("        default: atSessionEnd\n        supported: [atSessionEnd]", "        default: atSessionEnd\n        supported: [afterEachAnswer]"), /Algorithms mode default feedback must be supported/],
    ["missing Custom Practice contract", validContract.replace("  customPractice:\n    modeId: algorithms-custom-practice\n    contentBlueprintModeId: algorithms-guided-practice\n    mentalUnitSelection: explicit\n    reinsertOwnership: profile\n    lifecycle: sharedOneActiveSession\n", ""), /must have required property 'customPractice'/],
    ["unknown Custom Practice contract field", validContract.replace("    lifecycle: sharedOneActiveSession\n", "    lifecycle: sharedOneActiveSession\n    extra: value\n"), /must NOT have additional properties/],
    ["changed Custom Practice mental-unit selection", validContract.replace("mentalUnitSelection: explicit", "mentalUnitSelection: inferred"), /must be equal to constant/],
    ["changed Custom Practice feedback options", validContract.replace("supported: [afterEachAnswer, atSessionEnd]", "supported: [afterEachAnswer]"), /Custom Practice mode must preserve its declared lengths, feedback, Guided Practice mental-unit blueprint, and reinsert profile/],
    ["missing Certification contract", validContract.replace(/certification:\n(?:  .*\n|    .*\n|      .*\n|        .*\n)+$/, ""), /must have required property 'certification'/],
    ["duplicate Certification mode identifier", validContract.replace("    - id: certification-focus-practice", "    - id: certification-diagnostic-baseline"), /Duplicate canonical product contract Certification mode identifier/],
    ["mismatched Certification mode label", validContract.replace("label: Diagnostic Baseline", "label: Exam Simulation"), /Certification mode label does not match its identifier/],
    ["missing Certification mode owner", validContract.replace("      owner:\n        familyId: certification\n        trackId: cloud-certification\n", ""), /must have required property 'owner'/],
    ["changed Certification implementation status", validContract.replace("        implementation: unavailable", "        implementation: available"), /must be equal to constant/],
  ];

  for (const [label, source, message] of cases) {
    assert.throws(() => parseCanonicalProductContract(source), (error: unknown) => error instanceof CanonicalProductContractValidationError && message.test(error.message), label);
  }
});
