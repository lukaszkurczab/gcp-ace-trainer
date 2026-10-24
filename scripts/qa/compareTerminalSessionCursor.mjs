/** Exact pre-sync serialization check for the canonical session builder's field order.
 * Terminal materialization normalizes a non-resumable cursor to actualLength - 1.
 * A match proves every other serialized value is unchanged; it never repairs data. */
export function compareTerminalSessionCursor(session, beforeSha256, hash) {
  const keys = ['id', 'trackId', 'modeId', 'configurationSnapshot', 'caseState', 'caseStates',
    'requestedLength', 'actualLength', 'currentItemIndex', 'itemOrder', 'optionOrderByOccurrence',
    'conditionalReinsertSlots', 'activeForegroundMs', 'contentVersion', 'artifactSha256',
    'taxonomyVersion', 'status', 'startedAt', 'planFingerprint', 'completedAt'];
  if (!session || !['completed', 'abandoned'].includes(session.status)
    || !Number.isSafeInteger(session.actualLength) || session.actualLength <= 0
    || session.itemOrder?.length !== session.actualLength
    || session.currentItemIndex !== session.actualLength - 1
    || Object.keys(session).some(key => !keys.includes(key))
    || !/^[a-f0-9]{64}$/u.test(beforeSha256 ?? '') || typeof hash !== 'function') throw Error('comparison_rejected');
  const matching = [];
  for (let cursor = 0; cursor < session.actualLength; cursor++) {
    const original = Object.fromEntries(keys.filter(key => Object.hasOwn(session, key))
      .map(key => [key, key === 'currentItemIndex' ? cursor : session[key]]));
    if (hash(JSON.stringify(original)) === beforeSha256) matching.push(cursor);
  }
  return { preSyncHashReproduced: matching.length === 1, priorCursor: matching.length === 1 ? matching[0] : null,
    currentCursor: session.currentItemIndex, currentLength: session.actualLength };
}
