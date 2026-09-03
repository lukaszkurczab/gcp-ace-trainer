import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { formatSessionTopic } from "../../features/exam/sessionResultPresentation";
import { getTrackRoadmapCatalog } from "../../features/practice/trackRoadmapCatalog";

const source = readFileSync("src/features/exam/ResultScreen.tsx", "utf8");
const trackId = "google-cloud-associate-cloud-engineer" as const;

test("Certification result keeps truthful session metrics and routes Focus domains through the canonical formatter", () => {
  assert.match(source, /Promise\.all\(\[useCases\.loadSummary\(capturedRequestKey\), useCases\.loadSessionRecord\(capturedRequestKey\)\]\)/);
  assert.match(source, /<SessionResultOverview/);
  assert.match(source, /normalizeSessionResultDetails\(result\.evidence\.details, answeredCount, summary\.certificationMaxPoints \?\? undefined\)/);
  assert.match(source, /session\.requestedLength/);
  assert.match(source, /session\.actualLength/);
  assert.match(source, /answeredCount/);
  assert.match(source, /result\.unansweredOccurrenceIds\.length/);
  assert.match(source, /formatElapsed\(session\.activeForegroundMs\)/);
  assert.match(source, /formatMode\(session\.modeId\)/);
  assert.match(source, /formatSessionTopic\(session\.trackId, session\.configurationSnapshot\.domain, t\)/);
  assert.match(source, /formatDomains\(session\.configurationSnapshot\.sectionPresentation\)/);
});

test("Certification Focus domain formatter resolves only a canonical roadmap node", () => {
  const node = getTrackRoadmapCatalog(trackId)[0]!;
  const identity = (value: string) => value;

  assert.equal(formatSessionTopic(trackId, node.id, identity), node.title);
  assert.equal(formatSessionTopic(trackId, undefined, identity), "Unavailable");
  assert.equal(formatSessionTopic(trackId, "gcp-ace-standard-domain-1", identity), "Unavailable");
});
