import assert from "node:assert/strict";
import test from "node:test";

import { getTrackRoadmapCatalog, titleForNode } from "./trackRoadmapCatalog";
import { BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID, CODING_INTERVIEW_TRACK_ID } from "../../domain";

test("roadmap chapter labels are readable when a chapter has no curated catalog entry", () => {
  const uncataloguedChapter = "api_contracts_service_boundaries_and_request_flows";
  assert.equal(getTrackRoadmapCatalog(BACKEND_SYSTEM_DESIGN_INTERVIEW_TRACK_ID).some((node) => node.id === uncataloguedChapter), false);
  assert.equal(titleForNode(uncataloguedChapter), "API Contracts Service Boundaries And Request Flows");
  assert.equal(titleForNode("network_cost_optimization_nat_connectivity_routing_and_delivery"), "Network Cost Optimization NAT Connectivity Routing And Delivery");
});

test("curated roadmap titles retain their authored wording", () => {
  const chapter = getTrackRoadmapCatalog(CODING_INTERVIEW_TRACK_ID).find((node) => node.id === "complexity_and_constraints");
  assert.equal(chapter?.title, "Complexity and constraints");
});
