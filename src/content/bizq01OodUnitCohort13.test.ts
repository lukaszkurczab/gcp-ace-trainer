import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
import path from "node:path";
import {loadCanonicalRuntimeCatalog} from "./canonical/runtimeCatalog";
import {scoreCanonicalQuestion} from "./canonical/questionScoring";
import {projectCanonicalChoiceFeedbackMessages} from "../application/canonical/canonicalInteractionPresentation";
import type {Question, CanonicalFeedbackMessage} from "./canonical/questionTypes";

// Fixed identities from the independently reviewed cohort; source is the payload parity oracle.
const BINDINGS = [
  {
    "oldId": "ood-n01-b01-i003",
    "newId": "ood-n01-b01-i020",
    "answerId": "coordinator_exchange_subject",
    "optionIds": [
      "coordinator_exchange_subject",
      "dana_account_actor",
      "volunteers_actor",
      "qualification_checker_actor"
    ]
  },
  {
    "oldId": "ood-n01-b01-i004",
    "newId": "ood-n01-b01-i021",
    "answerId": "sam_two_roles_two_goals",
    "optionIds": [
      "sam_two_roles_two_goals",
      "sam_login_one_actor",
      "beneficiary_roles_actor",
      "campusrecords_actor"
    ]
  },
  {
    "oldId": "ood-n01-b01-i005",
    "newId": "ood-n01-b01-i022",
    "answerId": "clerk_requests_interlibrary",
    "optionIds": [
      "clerk_requests_interlibrary",
      "patron_requests_book",
      "partner_library_primary",
      "partner_catalog_subject"
    ]
  },
  {
    "oldId": "ood-n01-b01-i006",
    "newId": "ood-n01-b01-i023",
    "answerId": "end_subscription_at_boundary",
    "optionIds": [
      "end_subscription_at_boundary",
      "click_cancel",
      "disable_access_now",
      "process_refund"
    ]
  },
  {
    "oldId": "ood-n01-b01-i007",
    "newId": "ood-n01-b01-i024",
    "answerId": "calendar_service_actor",
    "optionIds": [
      "calendar_service_actor",
      "midnight_actor",
      "permit_clerk_actor",
      "deadline_checker_actor"
    ]
  },
  {
    "oldId": "ood-n01-b01-i008",
    "newId": "ood-n01-b01-i025",
    "answerId": "gateway_reconcile_actor",
    "optionIds": [
      "gateway_reconcile_actor",
      "bank_staff_actor",
      "matching_engine_actor",
      "clearing_record_actor"
    ]
  },
  {
    "oldId": "ood-n01-b01-i009",
    "newId": "ood-n01-b01-i026",
    "answerId": "traveler_book_staybook",
    "optionIds": [
      "traveler_book_staybook",
      "payline_subject",
      "reservation_store_subject",
      "payment_approval_is_booking"
    ]
  },
  {
    "oldId": "ood-n01-b01-i010",
    "newId": "ood-n01-b01-i027",
    "answerId": "issue_certified_copy",
    "optionIds": [
      "issue_certified_copy",
      "render_pdf",
      "calculate_seal",
      "get_any_link"
    ]
  },
  {
    "oldId": "ood-n01-b01-i011",
    "newId": "ood-n01-b01-i028",
    "answerId": "shared_fault_report_roles",
    "optionIds": [
      "shared_fault_report_roles",
      "split_by_person_report",
      "tenant_primary_manager_support",
      "stairwell_light_actor"
    ]
  },
  {
    "oldId": "ood-n01-b01-i012",
    "newId": "ood-n01-b01-i029",
    "answerId": "supervisor_readiness_stakeholder",
    "optionIds": [
      "supervisor_readiness_stakeholder",
      "panel_actor_sets_policy",
      "patient_as_actor",
      "reconciliation_as_actor"
    ]
  },
  {
    "oldId": "ood-n01-b01-i013",
    "newId": "ood-n01-b01-i030",
    "answerId": "dispatcher_publish_plan",
    "optionIds": [
      "dispatcher_publish_plan",
      "signal_authority_primary",
      "track_closure_actor",
      "routeboard_actor"
    ]
  },
  {
    "oldId": "ood-n01-b01-i014",
    "newId": "ood-n01-b01-i031",
    "answerId": "boundary_relative_roles",
    "optionIds": [
      "boundary_relative_roles",
      "service_name_fixed_actor",
      "merchant_inside_taxquote",
      "booking_product_still_subject"
    ]
  },
  {
    "oldId": "ood-n01-b01-i015",
    "newId": "ood-n01-b01-i032",
    "answerId": "registrar_request_access",
    "optionIds": [
      "registrar_request_access",
      "conservator_grants_self",
      "approval_record_actor",
      "check_training_only"
    ]
  },
  {
    "oldId": "ood-n01-b01-i016",
    "newId": "ood-n01-b01-i033",
    "answerId": "dispatch_receives_warning",
    "optionIds": [
      "dispatch_receives_warning",
      "no_actor_without_command",
      "internal_threshold_actor",
      "duty_staff_direct_actor"
    ]
  },
  {
    "oldId": "ood-n01-b01-i017",
    "newId": "ood-n01-b01-i034",
    "answerId": "reschedule_appointment",
    "optionIds": [
      "reschedule_appointment",
      "manage_patient_everything",
      "release_old_slot_first",
      "edit_calendar_row"
    ]
  }
] as const;
const TRACK="object-oriented-design-interview";
const MODE="design-interview-learn-framework";
function choice(q:Question):q is Extract<Question,{interaction:{type:"choice_single"}}> {
 return q.interaction.type==="choice_single" && q.answer.type==="choice_single";
}

test("OOD13 exact cohort is source-identical and eligible with retired identities absent",async()=>{
 const track=(await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
 const source=JSON.parse(readFileSync(path.resolve("../patternly-content/content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B01.json"),"utf8")) as readonly Question[];
 assert.equal(source.length,17);
 for(const b of BINDINGS){
  const q=track.getQuestion(b.newId);assert.ok(q,`bundled cohort contains ${b.newId}`);
  assert.deepEqual(q,source.find(x=>x.questionId===b.newId));
  assert.equal(track.getQuestion(b.oldId),undefined);
  assert.ok(!source.some(x=>x.questionId===b.oldId));
  assert.ok(track.getPool(MODE).some(x=>x.questionId===b.newId));
  assert.ok(!track.getPool(MODE).some(x=>x.questionId===b.oldId));
  assert.equal(q.mentalUnitId,"OOD-N01-B01");assert.equal(q.nodeId,"requirements_use_cases_domain_vocabulary_and_model_boundaries");
  assert.equal(q.constraints,undefined,"only neutral decisive facts remain in the authored prompt");
 }
 for(const id of ["ood-n01-b01-i018","ood-n01-b01-i019"]){assert.deepEqual(track.getQuestion(id),source.find(q=>q.questionId===id));assert.ok(track.getQuestion(id));}
});

test("OOD13 reviewed answer identities score independently of option position with exact authored diagnostics",async()=>{
 const track=(await loadCanonicalRuntimeCatalog()).getTrack(TRACK);
 for(const b of BINDINGS){
  const q=track.getQuestion(b.newId);assert.ok(q,`bundled cohort contains ${b.newId}`);assert.ok(choice(q));
  assert.equal(q.answer.optionId,b.answerId);
  assert.deepEqual(q.interaction.options.map(o=>o.optionId),b.optionIds);
  for(const optionId of b.optionIds){
   const response={type:"choice_single",optionId} as const;
   const score=scoreCanonicalQuestion(q,response);assert.equal(score.kind,optionId===b.answerId?"correct":"incorrect");
   assert.equal(score.earnedPoints,optionId===b.answerId?1:0);
   const messages=projectCanonicalChoiceFeedbackMessages(q,response);
   if(optionId===b.answerId)assert.deepEqual(messages,[]);
   else{const authored: CanonicalFeedbackMessage | undefined=q.feedback.messages?.find(m=>m.kind==="wrong_option"&&m.targetId===optionId);assert.ok(authored);assert.deepEqual(messages,[authored]);}
   const reversed: Extract<Question,{interaction:{type:"choice_single"}}>={...q,interaction:{...q.interaction,options:[...q.interaction.options].reverse()}};
   assert.deepEqual(scoreCanonicalQuestion(reversed,response),score,"reversing display order never changes the fixed-ID answer");
  }
 }
});
