import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadCanonicalRuntimeCatalog } from "./canonical/runtimeCatalog";
import { scoreCanonicalQuestion } from "./canonical/questionScoring";
import { buildCanonicalInteractionViewModel, composeCanonicalFeedback } from "../application/canonical/canonicalInteractionPresentation";
import { canonicalJsonValueText, toCanonicalQuestionViewModel } from "../features/practice/canonicalQuestionViewModel";
import type { Question, CanonicalFeedbackMessage } from "./canonical/questionTypes";

// Fixed answer identities from independently reviewed proposal v5, not inferred from the bundled answer.
// Source/presentation evidence does not claim these seed units are eligible for a prepared session.
const TRACK = "backend-system-design-interview";
const BINDINGS = [
  {
    "oldId": "besd-n02-b01-i001",
    "newId": "besd-n02-b01-i018",
    "unitId": "BESD-N02-B01",
    "answerId": "besd-n02-b01-i018_asset_resource_read",
    "optionIds": [
      "besd-n02-b01-i018_asset_resource_read",
      "besd-n02-b01-i018_refresh_on_read",
      "besd-n02-b01-i018_storage_row_contract"
    ]
  },
  {
    "oldId": "besd-n02-b01-i003",
    "newId": "besd-n02-b01-i019",
    "unitId": "BESD-N02-B01",
    "answerId": "besd-n02-b01-i019_shipment_event_identity_revision",
    "optionIds": [
      "besd-n02-b01-i019_shipment_event_identity_revision",
      "besd-n02-b01-i019_broker_delivery_once",
      "besd-n02-b01-i019_arrival_timestamp_order"
    ]
  },
  {
    "oldId": "besd-n02-b01-i004",
    "newId": "besd-n02-b01-i020",
    "unitId": "BESD-N02-B01",
    "answerId": "besd-n02-b01-i020_conditional_document_update",
    "optionIds": [
      "besd-n02-b01-i020_conditional_document_update",
      "besd-n02-b01-i020_unconditional_replace",
      "besd-n02-b01-i020_compare_then_write_client"
    ]
  },
  {
    "oldId": "besd-n02-b01-i005",
    "newId": "besd-n02-b01-i021",
    "unitId": "BESD-N02-B01",
    "answerId": "besd-n02-b01-i021_atomic_stock_reservation",
    "optionIds": [
      "besd-n02-b01-i021_atomic_stock_reservation",
      "besd-n02-b01-i021_read_then_reserve",
      "besd-n02-b01-i021_cache_as_capacity"
    ]
  },
  {
    "oldId": "besd-n02-b01-i006",
    "newId": "besd-n02-b01-i022",
    "unitId": "BESD-N02-B01",
    "answerId": "besd-n02-b01-i022_completion_state_resource",
    "optionIds": [
      "besd-n02-b01-i022_completion_state_resource",
      "besd-n02-b01-i022_increment_progress",
      "besd-n02-b01-i022_client_suppress_retries"
    ]
  },
  {
    "oldId": "besd-n02-b01-i007",
    "newId": "besd-n02-b01-i023",
    "unitId": "BESD-N02-B01",
    "answerId": "besd-n02-b01-i023_quote_pinned_price_revision",
    "optionIds": [
      "besd-n02-b01-i023_quote_pinned_price_revision",
      "besd-n02-b01-i023_always_current_price",
      "besd-n02-b01-i023_client_amount_authority"
    ]
  },
  {
    "oldId": "besd-n02-b01-i008",
    "newId": "besd-n02-b01-i024",
    "unitId": "BESD-N02-B01",
    "answerId": "besd-n02-b01-i024_revocation_epoch_contract",
    "optionIds": [
      "besd-n02-b01-i024_revocation_epoch_contract",
      "besd-n02-b01-i024_async_best_effort_revoke",
      "besd-n02-b01-i024_client_logout_only"
    ]
  },
  {
    "oldId": "besd-n02-b01-i009",
    "newId": "besd-n02-b01-i025",
    "unitId": "BESD-N02-B01",
    "answerId": "besd-n02-b01-i025_propagated_route_deadline",
    "optionIds": [
      "besd-n02-b01-i025_propagated_route_deadline",
      "besd-n02-b01-i025_unbounded_rpc",
      "besd-n02-b01-i025_durable_job_for_preview"
    ]
  },
  {
    "oldId": "besd-n02-b01-i010",
    "newId": "besd-n02-b01-i026",
    "unitId": "BESD-N02-B01",
    "answerId": "besd-n02-b01-i026_server_evaluated_feature_decision",
    "optionIds": [
      "besd-n02-b01-i026_server_evaluated_feature_decision",
      "besd-n02-b01-i026_ship_rule_to_each_client",
      "besd-n02-b01-i026_client_random_assignment"
    ]
  },
  {
    "oldId": "besd-n02-b01-i011",
    "newId": "besd-n02-b01-i027",
    "unitId": "BESD-N02-B01",
    "answerId": "besd-n02-b01-i027_half_open_offset_interval",
    "optionIds": [
      "besd-n02-b01-i027_half_open_offset_interval",
      "besd-n02-b01-i027_local_time_without_zone",
      "besd-n02-b01-i027_inclusive_both_ends"
    ]
  },
  {
    "oldId": "besd-n02-b01-i012",
    "newId": "besd-n02-b01-i028",
    "unitId": "BESD-N02-B01",
    "answerId": "besd-n02-b01-i028_snapshot_bound_search_cursor",
    "optionIds": [
      "besd-n02-b01-i028_snapshot_bound_search_cursor",
      "besd-n02-b01-i028_offset_live_index",
      "besd-n02-b01-i028_client_deduplicate"
    ]
  },
  {
    "oldId": "besd-n02-b01-i013",
    "newId": "besd-n02-b01-i029",
    "unitId": "BESD-N02-B01",
    "answerId": "besd-n02-b01-i029_bounded_tenant_admission",
    "optionIds": [
      "besd-n02-b01-i029_bounded_tenant_admission",
      "besd-n02-b01-i029_unbounded_wait_queue",
      "besd-n02-b01-i029_global_limit_only"
    ]
  },
  {
    "oldId": "besd-n02-b01-i014",
    "newId": "besd-n02-b01-i030",
    "unitId": "BESD-N02-B01",
    "answerId": "besd-n02-b01-i030_typed_payment_problem",
    "optionIds": [
      "besd-n02-b01-i030_typed_payment_problem",
      "besd-n02-b01-i030_parse_detail_text",
      "besd-n02-b01-i030_success_with_error_body"
    ]
  },
  {
    "oldId": "besd-n02-b01-i015",
    "newId": "besd-n02-b01-i031",
    "unitId": "BESD-N02-B01",
    "answerId": "besd-n02-b01-i031_additive_case_schema",
    "optionIds": [
      "besd-n02-b01-i031_additive_case_schema",
      "besd-n02-b01-i031_reuse_status_enum",
      "besd-n02-b01-i031_require_atomic_cutover"
    ]
  },
  {
    "oldId": "besd-n02-b01-i016",
    "newId": "besd-n02-b01-i032",
    "unitId": "BESD-N02-B01",
    "answerId": "besd-n02-b01-i032_pinned_payroll_export_snapshot",
    "optionIds": [
      "besd-n02-b01-i032_pinned_payroll_export_snapshot",
      "besd-n02-b01-i032_recompute_latest",
      "besd-n02-b01-i032_client_snapshot_only"
    ]
  },
  {
    "oldId": "besd-n04-b01-i001",
    "newId": "besd-n04-b01-i020",
    "unitId": "BESD-N04-B01",
    "answerId": "besd-n04-b01-i020_private_client_preference_cache",
    "optionIds": [
      "besd-n04-b01-i020_private_client_preference_cache",
      "besd-n04-b01-i020_shared_edge_preference_cache",
      "besd-n04-b01-i020_durable_client_authority"
    ]
  },
  {
    "oldId": "besd-n04-b01-i003",
    "newId": "besd-n04-b01-i021",
    "unitId": "BESD-N04-B01",
    "answerId": "besd-n04-b01-i021_revision_fence",
    "optionIds": [
      "besd-n04-b01-i021_revision_fence",
      "besd-n04-b01-i021_evict_only",
      "besd-n04-b01-i021_wait_for_ttl"
    ]
  },
  {
    "oldId": "besd-n04-b01-i004",
    "newId": "besd-n04-b01-i022",
    "unitId": "BESD-N04-B01",
    "answerId": "besd-n04-b01-i022_content_version_tenant_cache",
    "optionIds": [
      "besd-n04-b01-i022_content_version_tenant_cache",
      "besd-n04-b01-i022_filename_global_cache",
      "besd-n04-b01-i022_cache_only_job_id"
    ]
  },
  {
    "oldId": "besd-n04-b01-i005",
    "newId": "besd-n04-b01-i023",
    "unitId": "BESD-N04-B01",
    "answerId": "besd-n04-b01-i023_versioned_layout_live_availability",
    "optionIds": [
      "besd-n04-b01-i023_versioned_layout_live_availability",
      "besd-n04-b01-i023_cache_combined_seat_map",
      "besd-n04-b01-i023_fetch_layout_every_view"
    ]
  },
  {
    "oldId": "besd-n04-b01-i006",
    "newId": "besd-n04-b01-i024",
    "unitId": "BESD-N04-B01",
    "answerId": "besd-n04-b01-i024_candidate_cache_reauthorize_content",
    "optionIds": [
      "besd-n04-b01-i024_candidate_cache_reauthorize_content",
      "besd-n04-b01-i024_cache_final_agent_results",
      "besd-n04-b01-i024_key_by_agent_forever"
    ]
  },
  {
    "oldId": "besd-n04-b01-i007",
    "newId": "besd-n04-b01-i025",
    "unitId": "BESD-N04-B01",
    "answerId": "besd-n04-b01-i025_short_cache_validator_recheck",
    "optionIds": [
      "besd-n04-b01-i025_short_cache_validator_recheck",
      "besd-n04-b01-i025_long_mutable_edge_ttl",
      "besd-n04-b01-i025_unconditional_origin_fetch"
    ]
  },
  {
    "oldId": "besd-n04-b01-i008",
    "newId": "besd-n04-b01-i026",
    "unitId": "BESD-N04-B01",
    "answerId": "besd-n04-b01-i026_firmware_manifest_shared_cache",
    "optionIds": [
      "besd-n04-b01-i026_firmware_manifest_shared_cache",
      "besd-n04-b01-i026_cache_by_model_only",
      "besd-n04-b01-i026_cache_device_snapshot"
    ]
  },
  {
    "oldId": "besd-n04-b01-i009",
    "newId": "besd-n04-b01-i027",
    "unitId": "BESD-N04-B01",
    "answerId": "besd-n04-b01-i027_local_draft_with_base_revision",
    "optionIds": [
      "besd-n04-b01-i027_local_draft_with_base_revision",
      "besd-n04-b01-i027_publish_local_as_current",
      "besd-n04-b01-i027_discard_offline_draft"
    ]
  },
  {
    "oldId": "besd-n04-b01-i010",
    "newId": "besd-n04-b01-i028",
    "unitId": "BESD-N04-B01",
    "answerId": "besd-n04-b01-i028_versioned_graph_separate_closures",
    "optionIds": [
      "besd-n04-b01-i028_versioned_graph_separate_closures",
      "besd-n04-b01-i028_cache_combined_route",
      "besd-n04-b01-i028_disable_topology_cache"
    ]
  },
  {
    "oldId": "besd-n04-b01-i011",
    "newId": "besd-n04-b01-i029",
    "unitId": "BESD-N04-B01",
    "answerId": "besd-n04-b01-i029_scoped_versioned_forecast_cache",
    "optionIds": [
      "besd-n04-b01-i029_scoped_versioned_forecast_cache",
      "besd-n04-b01-i029_cache_by_report_name",
      "besd-n04-b01-i029_live_recompute_every_read"
    ]
  },
  {
    "oldId": "besd-n04-b01-i012",
    "newId": "besd-n04-b01-i030",
    "unitId": "BESD-N04-B01",
    "answerId": "besd-n04-b01-i030_versioned_catalog_private_progress",
    "optionIds": [
      "besd-n04-b01-i030_versioned_catalog_private_progress",
      "besd-n04-b01-i030_cache_combined_payload",
      "besd-n04-b01-i030_cache_mutable_course_alias"
    ]
  },
  {
    "oldId": "besd-n04-b01-i013",
    "newId": "besd-n04-b01-i031",
    "unitId": "BESD-N04-B01",
    "answerId": "besd-n04-b01-i031_edge_price_revision_checkout_revalidate",
    "optionIds": [
      "besd-n04-b01-i031_edge_price_revision_checkout_revalidate",
      "besd-n04-b01-i031_mutable_price_long_cache",
      "besd-n04-b01-i031_purge_is_authority"
    ]
  },
  {
    "oldId": "besd-n04-b01-i014",
    "newId": "besd-n04-b01-i032",
    "unitId": "BESD-N04-B01",
    "answerId": "besd-n04-b01-i032_bounded_fail_closed_auth_cache",
    "optionIds": [
      "besd-n04-b01-i032_bounded_fail_closed_auth_cache",
      "besd-n04-b01-i032_long_lived_positive_cache",
      "besd-n04-b01-i032_unbounded_fail_open"
    ]
  },
  {
    "oldId": "besd-n04-b01-i015",
    "newId": "besd-n04-b01-i033",
    "unitId": "BESD-N04-B01",
    "answerId": "besd-n04-b01-i033_content_addressed_transcode_cache",
    "optionIds": [
      "besd-n04-b01-i033_content_addressed_transcode_cache",
      "besd-n04-b01-i033_cache_by_asset_name",
      "besd-n04-b01-i033_cache_job_response"
    ]
  },
  {
    "oldId": "besd-n04-b01-i016",
    "newId": "besd-n04-b01-i034",
    "unitId": "BESD-N04-B01",
    "answerId": "besd-n04-b01-i034_bounded_edge_config_ttl",
    "optionIds": [
      "besd-n04-b01-i034_bounded_edge_config_ttl",
      "besd-n04-b01-i034_fetch_every_request",
      "besd-n04-b01-i034_serve_stale_enabled"
    ]
  },
  {
    "oldId": "besd-n04-b01-i017",
    "newId": "besd-n04-b01-i035",
    "unitId": "BESD-N04-B01",
    "answerId": "besd-n04-b01-i035_provider_window_availability_cache",
    "optionIds": [
      "besd-n04-b01-i035_provider_window_availability_cache",
      "besd-n04-b01-i035_cache_booking_authority",
      "besd-n04-b01-i035_global_calendar_key"
    ]
  },
  {
    "oldId": "besd-n04-b01-i018",
    "newId": "besd-n04-b01-i036",
    "unitId": "BESD-N04-B01",
    "answerId": "besd-n04-b01-i036_per_key_refresh_coalescing",
    "optionIds": [
      "besd-n04-b01-i036_per_key_refresh_coalescing",
      "besd-n04-b01-i036_independent_refresh_per_request",
      "besd-n04-b01-i036_single_global_result"
    ]
  }
] as const;
const UNITS = [
  {
    "unitId": "BESD-N02-B01",
    "sourceFile": "content/backend-system-design-interview/api_contracts_service_boundaries_and_request_flows/BESD-N02-B01.json",
    "count": 16,
    "preservedId": "besd-n02-b01-i017"
  },
  {
    "unitId": "BESD-N04-B01",
    "sourceFile": "content/backend-system-design-interview/caching_read_scaling_search_and_content_delivery/BESD-N04-B01.json",
    "count": 18,
    "preservedId": "besd-n04-b01-i019"
  }
] as const;
function isSingleChoice(question: Question): question is Extract<Question, { interaction: { type: "choice_single" } }> {
  return question.interaction.type === "choice_single" && question.answer.type === "choice_single";
}
function sourceQuestions(sourceFile: string): readonly Question[] {
  return JSON.parse(readFileSync(path.resolve("../patternly-content", sourceFile), "utf8")) as readonly Question[];
}

test("BESD14 exact two-unit payloads and preserved items match sources with retired identities absent", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
  for (const unit of UNITS) {
    const source = sourceQuestions(unit.sourceFile);
    assert.equal(source.length, unit.count);
    const preserved = source.find(question => question.questionId === unit.preservedId);
    assert.ok(preserved);
    assert.deepEqual(track.getQuestion(unit.preservedId), preserved);
    for (const binding of BINDINGS.filter(item => item.unitId === unit.unitId)) {
      const question = track.getQuestion(binding.newId);
      assert.ok(question, `bundled content contains ${binding.newId}`);
      assert.deepEqual(question, source.find(item => item.questionId === binding.newId));
      assert.equal(question.mentalUnitId, unit.unitId);
      assert.equal(track.getQuestion(binding.oldId), undefined);
      assert.equal(source.some(item => item.questionId === binding.oldId), false);
    }
  }
});

test("BESD14 real pre-answer view models expose authored facts and controls without feedback or answer fields", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
  for (const binding of BINDINGS) {
    const question = track.getQuestion(binding.newId);
    assert.ok(question);
    assert.ok(isSingleChoice(question));
    const view = toCanonicalQuestionViewModel(question);
    assert.deepEqual(Object.keys(view).sort(), ["constraints", "interaction", "itemId", "prompt"]);
    assert.equal(view.prompt, question.prompt);
    assert.deepEqual(view.constraints, question.constraints ?? []);
    assert.equal(view.constraints.some(text => /the\s+primary\s+decision\s+is/iu.test(text)), false);
    const order = [...binding.optionIds].reverse();
    const presentation = buildCanonicalInteractionViewModel(question, null, order);
    assert.equal(presentation.renderer.kind, "choice");
    if (presentation.renderer.kind !== "choice") throw new Error("Expected reviewed choice renderer");
    assert.deepEqual(presentation.renderer.options.map(option => option.id), order);
    for (const control of presentation.accessibility.controls) {
      assert.equal(control.role, "radio");
      assert.equal(control.checked, false);
      assert.equal(control.label, question.interaction.options.find(option => option.optionId === control.id)?.text);
    }
  }
});

test("BESD14 fixed-ID scoring and authored Reason, Details and diagnostics survive every option and reversed order", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
  let responses = 0;
  for (const binding of BINDINGS) {
    const question = track.getQuestion(binding.newId);
    assert.ok(question);
    assert.ok(isSingleChoice(question));
    assert.equal(question.answer.optionId, binding.answerId);
    assert.deepEqual(question.interaction.options.map(option => option.optionId), binding.optionIds);
    assert.equal(typeof question.feedback.details, "string");
    assert.equal(canonicalJsonValueText(question.feedback.details), question.feedback.details);
    const reversed: Extract<Question, { interaction: { type: "choice_single" } }> = {
      ...question, interaction: { ...question.interaction, options: [...question.interaction.options].reverse() }
    };
    for (const optionId of binding.optionIds) {
      const response = { type: "choice_single", optionId } as const;
      const correct = optionId === binding.answerId;
      const score = scoreCanonicalQuestion(question, response);
      assert.equal(score.kind, correct ? "correct" : "incorrect");
      assert.equal(score.earnedPoints, correct ? 1 : 0);
      assert.deepEqual(scoreCanonicalQuestion(reversed, response), score);
      const feedback = composeCanonicalFeedback(question, response);
      assert.equal(feedback.reason, question.feedback.reason);
      assert.deepEqual(feedback.details, question.feedback.details);
      if (correct) assert.deepEqual(feedback.messages, []);
      else {
        const authored: CanonicalFeedbackMessage | undefined = question.feedback.messages?.find(message => message.kind === "wrong_option" && message.targetId === optionId);
        assert.ok(authored);
        assert.deepEqual(feedback.messages, [authored]);
      }
      responses += 1;
    }
  }
  assert.equal(responses, 96);
});
