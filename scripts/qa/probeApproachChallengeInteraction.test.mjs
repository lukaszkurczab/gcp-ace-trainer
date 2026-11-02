import assert from 'node:assert/strict';
import test from 'node:test';
import { probeApproachChallengeInteraction } from './probeApproachChallengeInteraction.mjs';

test('interaction probe rejects unknown actions and non-local origins before discovery or invocation', async () => {
  await assert.rejects(probeApproachChallengeInteraction('http://localhost:8081', 'delete'), /action_rejected/u);
  for (const origin of ['https://localhost:8081', 'http://example.com:8081', 'http://localhost:8081/private', 'http://user:secret@localhost:8081']) {
    await assert.rejects(probeApproachChallengeInteraction(origin, 'submit'), /origin_rejected/u);
  }
});
