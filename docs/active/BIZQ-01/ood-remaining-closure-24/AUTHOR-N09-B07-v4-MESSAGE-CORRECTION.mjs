import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const frozenPath = path.join(here, 'review-inputs', 'N09-B07-v3.json');
const outputPath = path.join(here, 'proposals', 'N09-B07-v4.json');
const expectedFrozenSha256 = '428676e548e3da6ef68e3bfa4530c36818b7650e5c5dd2f5ea9e9c577e872a8a';
const contractModule = pathToFileURL(path.resolve(here, '../../../../../patternly-content/scripts/content/question-contract.mjs')).href;
const { validateQuestion, scoreQuestion } = await import(contractModule);

// Corrections are keyed by the stored option ID, never by option order.
// Each message explains the selected alternative's case-specific failure.
const edits = {
  n09b07_i019_wrong_cost_center: 'The trace assigns 62% of request time to tax-service calls. Replacing the search index leaves those repeated lookups in this response path.',
  n09b07_i019_contract_shortcut: 'A longer timeout changes how long each tax lookup can wait; it does not reduce the number of calls made for the products in this search.',
  n09b07_i019_broad_rewrite: 'The profile measures remote tax-call time, not endpoint CPU. Rewriting the endpoint language alone leaves the per-product calls unchanged.',
  n09b07_i019_assumed_cache: 'Tax rules can change during the day, so an indefinite price cache can return a tax-inclusive total calculated under an earlier rule.',

  n09b07_i020_assumed_cache: 'With only an 8% hit rate, another cache layer is unlikely to avoid much work and adds to the measured 9 ms lookup while the feed already meets its 120 ms target.',
  n09b07_i020_wrong_cost_center: 'Extending the cache lifetime can leave a profile out of date for more than the required two seconds; a higher hit rate would come by violating freshness.',
  n09b07_i020_contract_shortcut: 'The evidence identifies low cache reuse and lookup overhead, not a slow profile store. Replacing that store leaves the unsupported cache layer in the feed path.',
  n09b07_i020_broad_rewrite: 'A startup preload has no stated refresh path to make profile updates visible within two seconds, and it does not establish that the request-time lookup cost disappears.',

  n09b07_i021_assumed_cache: 'Storing every arbitrary resize variant has no bound in this case and can exceed the stated derivative-storage budget.',
  n09b07_i021_wrong_cost_center: 'The measured 71% is CPU spent resizing; adding database capacity does not change the image-resize work on the preview request.',
  n09b07_i021_full_image_not_preview: 'This returns the uploaded original instead of producing the preview the service promises, so it changes the output rather than reducing the measured resize work.',
  n09b07_i021_broad_rewrite: 'The endpoint rewrite is not tied to the 71% resize cost; without a change to the measured resize path, the hot work can remain.',

  n09b07_i022_broad_rewrite: 'Parallel execution can change tie ordering. The displayed prefix must preserve the supplied stable-ID tie-break, which this proposal does not verify.',
  n09b07_i022_assumed_cache: 'Returning an arbitrary ten can omit higher-ranked eligible sessions; sorting only that subset at the client cannot recover the correct top ten.',
  n09b07_i022_wrong_cost_center: 'The stable-ID tie-break is part of the displayed order, including ties at the ten-item cutoff. Dropping it changes which sessions occupy the prefix.',
  n09b07_i022_contract_shortcut: 'Eligibility varies by caller, so one global ordered result can include sessions that are not eligible for this request.',

  n09b07_i023_contract_shortcut: 'The trace attributes time to loading full rows, while the report consumes only tenant, type, and date. Moving date formatting does not remove the extra row data.',
  n09b07_i023_broad_rewrite: 'A larger connection pool can run more queries concurrently, but each report query still loads the same full event rows identified by the trace.',
  n09b07_i023_assumed_cache: 'The report does not filter on display name, so an index there does not target the measured full-row loading or the three fields the report uses.',
  n09b07_i023_wrong_cost_center: 'The report uses three columns for one monthly result; caching full event objects indefinitely retains unrelated fields and supplies no stated freshness or reuse case.',

  n09b07_i024_wrong_cost_center: 'Locale is part of the fixed batch input. Skipping its selection can send recipients the wrong language instead of reusing the correct locale-specific rendering.',
  n09b07_i024_contract_shortcut: 'More workers can render the same template concurrently, but the profile counts one render per recipient. Concurrency does not remove those duplicate render calls.',
  n09b07_i024_broad_rewrite: 'Putting recipients on the template object relocates the list but does not say to reuse one rendered value; the measured render can still run once for every recipient.',
  n09b07_i024_assumed_cache: 'A global entry without locale in its key can return one language’s rendered message to a batch using another locale.',

  n09b07_i025_assumed_cache: 'Yesterday’s quote can miss the unchanged current-price deadline for these parcels, even if it avoids another provider request.',
  n09b07_i025_wrong_cost_center: 'Omitting a carrier quote leaves at least one parcel without the per-parcel quote fields required by the response.',
  n09b07_i025_contract_shortcut: 'The timeout does not change the measured one-call-per-parcel pattern; the provider’s batch operation is the available way to reduce those requests.',
  n09b07_i025_broad_rewrite: 'The address form runs before the parcel set is complete, so it cannot quote the full batch; later parcels would still need additional calls.',

  n09b07_i026_assumed_cache: 'A cache of full reservation objects still loads and counts those objects; it does not use the store’s count operation to return the one value this response needs.',
  n09b07_i026_wrong_cost_center: 'Removing the active filter counts inactive reservations too, so the result no longer answers how many are active.',
  n09b07_i026_contract_shortcut: 'The response is one number, so raising a payload limit cannot remove the measured loading of reservation objects.',
  n09b07_i026_first_page_only: 'Later pages can contain additional active reservations, so counting only the first page understates the total returned by the complete active-status count.',

  n09b07_i027_broad_rewrite: 'The ranker needs reputation scores before it returns the ordered candidates. Fetching author records after that response cannot produce the scored ranking the caller requested.',
  n09b07_i027_assumed_cache: 'The profile service updates reputations, so an eternal entry can rank a candidate using a value older than the service’s current profile.',
  n09b07_i027_wrong_cost_center: 'Returning candidates without reputation scores removes an input to the ranking and changes the order the endpoint is meant to compute.',
  n09b07_i027_contract_shortcut: 'Parallel per-author reads keep the repeated-call pattern and do not use the stated fixed-set batch lookup; the option also leaves the service limit unchecked.',

  n09b07_i028_contract_shortcut: 'Sampling omits some failed runs, although the audit requires every failure. Retaining redundant success traces does not supply the missing failure records.',
  n09b07_i028_broad_rewrite: 'A duplicate table preserves the same rows and adds another copy, so it does not bring storage back under budget.',
  n09b07_i028_assumed_cache: 'Failure frequency does not change the retention rule: every failed run must remain available for the audit.',
  n09b07_i028_wrong_cost_center: 'The required record for a successful batch is its summary. Dropping summaries while keeping unused per-row success traces removes the audit’s needed evidence and retains the redundant rows.',

  n09b07_i029_wrong_cost_center: 'Eligibility is defined against one account snapshot for the whole invoice request. Re-reading the account for each line can mix states if the account changes mid-request.',
  n09b07_i029_contract_shortcut: 'A successful first line does not establish that every later line is eligible; skipping their checks can admit a line that fails the same request snapshot.',
  n09b07_i029_stale_snapshot_reuse: 'The fixed snapshot applies to one invoice request. Reusing its copy for later requests can evaluate a new invoice against older account history.',
  n09b07_i029_assumed_cache: 'A global cache has no refresh boundary for the next invoice and can evaluate that request against account history older than its required snapshot.',

  n09b07_i030_assumed_cache: 'Without the revision ID, a global digest can be reused for different uploaded bytes; the checksum must stay associated with the revision it describes.',
  n09b07_i030_wrong_cost_center: 'Skipping later checksum steps assumes the earlier computation succeeded; it can leave this publish request without a verified checksum for its selected revision.',
  n09b07_i030_contract_shortcut: 'A mutable draft pointer can change after the immutable revision was selected, so its digest may describe different bytes from that revision.',
  n09b07_i030_broad_rewrite: 'Trusting any client-supplied digest does not establish that it matches the immutable revision bytes the service must checksum.',

  n09b07_i031_assumed_cache: 'The response target is already met, while cache invalidation adds known work and no representative hit-rate evidence shows a benefit.',
  n09b07_i031_wrong_cost_center: 'Extending expiration can make a benchmark look faster by serving older feed data; it does not measure whether reuse is worth that freshness trade-off.',
  n09b07_i031_contract_shortcut: 'The measurements do not identify the database as the bottleneck, and the response target is already met. Replacing its tier is not evidence for this cache decision.',
  n09b07_i031_broad_rewrite: 'If representative traffic shows no reuse, retaining the cache keeps its invalidation cost without the benefit needed to justify it.',

  n09b07_i032_broad_rewrite: 'The preview needs only the first 64 KB, so sending the full object from the client repeats the transfer the trace identified as dominant.',
  n09b07_i032_assumed_cache: 'Downloading the full object and discarding the unused bytes still pays the measured full-object transfer cost before the preview can use its prefix.',
  n09b07_i032_wrong_cost_center: 'An unbounded whole-object cache has no stated reuse or freshness case and does not make this preview request transfer only the range it consumes.',
  n09b07_i032_contract_shortcut: 'More preview workers do not reduce the full payload each request transfers; they can increase concurrent load on the same storage path.',

  n09b07_i033_contract_shortcut: 'The page asks for current-release counts and the prompt gives no repeated archive reuse to support a global cache; the separate history view remains the archive path.',
  n09b07_i033_broad_rewrite: 'Returning zero for archived contributions changes the statistics instead of limiting the query to current-release counts.',
  n09b07_i033_assumed_cache: 'The history view is a separate available feature. Removing it to simplify this page query discards that history contract instead of narrowing only the measured page read.',
  n09b07_i033_wrong_cost_center: 'Loading the full archive and filtering it in memory still scans and transfers the history that the page does not use.',

  n09b07_i034_wrong_cost_center: 'The importer must process later partitions too; dropping SKUs after the first hundred omits their stock updates.',
  n09b07_i034_contract_shortcut: 'Retrying updates already reported successful can repeat their effects and increases requests instead of reducing the measured count.',
  n09b07_i034_broad_rewrite: 'Moving the call to the UI thread changes where it runs, not the one-request-per-SKU count in the trace.',
  n09b07_i034_assumed_cache: 'One parallel request per SKU still makes one request per SKU and ignores the remote endpoint’s supported batch limit.',

  n09b07_i035_assumed_cache: 'The regional rate is fixed only for the current request’s policy version; a cache held across requests can use a rate from an older version.',
  n09b07_i035_wrong_cost_center: 'The accepted policy version fixes the rate during this request, so per-line reads repeat the same lookup without observing a permitted mid-request change.',
  n09b07_i035_contract_shortcut: 'Rewriting historical invoice lines changes stored past records; the measured duplication is repeated lookup within this summary request.',
  n09b07_i035_broad_rewrite: 'A prior-month amount is not the rate fixed by this request’s accepted policy version, so it can change the current summary result.',

  n09b07_i036_assumed_cache: 'Sorting every job in the application still loads the completed rows and does not push the measured pending filter or oldest-first order into the query.',
  n09b07_i036_wrong_cost_center: 'Any twenty pending jobs can omit older pending jobs; the dashboard specifically needs the oldest twenty.',
  n09b07_i036_contract_shortcut: 'An indefinite cache of the whole table can show completed or newly changed jobs as though they were current pending work.',
  n09b07_i036_broad_rewrite: 'Loading every job increases the returned set but still does the filter and sort work that the profile measured; the view needs only twenty pending rows.'
};

// These three alternatives were valid under the frozen facts. Replace them
// with concrete violations rather than attaching misleading feedback to them.
const optionReplacements = {
  n09b07_i021_contract_shortcut: {
    questionId: 'ood-n09-b07-i021',
    optionId: 'n09b07_i021_full_image_not_preview',
    text: 'Return the full uploaded image instead of producing a preview.'
  },
  n09b07_i026_broad_rewrite: {
    questionId: 'ood-n09-b07-i026',
    optionId: 'n09b07_i026_first_page_only',
    text: 'Count only the first page of active-reservation IDs as the total.'
  },
  n09b07_i029_broad_rewrite: {
    questionId: 'ood-n09-b07-i029',
    optionId: 'n09b07_i029_stale_snapshot_reuse',
    text: 'Reuse a copied account snapshot from an earlier invoice for later requests.'
  }
};

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

const frozenBytes = await readFile(frozenPath);
const actualFrozenSha256 = sha256(frozenBytes);
if (actualFrozenSha256 !== expectedFrozenSha256) {
  throw new Error(`Frozen v3 SHA mismatch: ${actualFrozenSha256}`);
}
const original = JSON.parse(frozenBytes.toString('utf8'));
const edited = JSON.parse(frozenBytes.toString('utf8'));
if (original.length !== 18 || Object.keys(edits).length !== 72) throw new Error('Unexpected N09-B07 scope');

const changes = [];
const optionChanges = [];
for (const question of edited) {
  const byId = new Map(question.interaction.options.map((option) => [option.optionId, option]));
  for (const [oldId, replacement] of Object.entries(optionReplacements)) {
    if (replacement.questionId !== question.questionId) continue;
    const option = byId.get(oldId);
    if (!option) throw new Error(`Expected option ${oldId} missing from ${question.questionId}`);
    if (question.interaction.options.some((candidate) => candidate.optionId === replacement.optionId)) {
      throw new Error(`Replacement option ID already exists: ${replacement.optionId}`);
    }
    optionChanges.push({ questionId: question.questionId, oldOptionId: oldId, oldText: option.text, newOptionId: replacement.optionId, newText: replacement.text });
    byId.delete(oldId);
    option.optionId = replacement.optionId;
    option.text = replacement.text;
    byId.set(replacement.optionId, option);
    for (const message of question.feedback.messages) {
      if (message.kind === 'wrong_option' && message.targetId === oldId) message.targetId = replacement.optionId;
    }
  }
  for (const message of question.feedback.messages) {
    if (message.kind !== 'wrong_option') continue;
    const next = edits[message.targetId];
    if (!next) continue;
    const option = byId.get(message.targetId);
    if (!option || message.targetId === question.answer.optionId) throw new Error(`Target is not a wrong option: ${message.targetId}`);
    if (message.text === next) throw new Error(`Target already corrected: ${message.targetId}`);
    changes.push({ questionId: question.questionId, targetId: message.targetId, optionText: option.text, oldText: message.text, newText: next });
    message.text = next;
  }
}
if (changes.length !== 72 || new Set(changes.map((change) => change.targetId)).size !== 72) {
  throw new Error(`Expected 72 unique paired wrong-option targets; found ${changes.length}`);
}
if (optionChanges.length !== 3 || new Set(optionChanges.map((change) => change.questionId)).size !== 3) {
  throw new Error(`Expected the three approved viable-alternative corrections; found ${optionChanges.length}`);
}

const changedQuestionIds = new Set(optionChanges.map(({ questionId }) => questionId));
for (const question of edited) {
  const validation = validateQuestion(question);
  if (!validation.valid) throw new Error(`${question.questionId}: ${JSON.stringify(validation.errors)}`);
  const ids = question.interaction.options.map((option) => option.optionId);
  const correct = scoreQuestion(question, { type: 'choice_single', optionId: question.answer.optionId });
  if (correct.status !== 'correct') throw new Error(`${question.questionId}: keyed option did not score correct`);
  for (const id of ids.filter((candidate) => candidate !== question.answer.optionId)) {
    if (scoreQuestion(question, { type: 'choice_single', optionId: id }).status !== 'incorrect') throw new Error(`${question.questionId}: distractor ${id} scored correct`);
  }
  const reversed = { ...question, interaction: { ...question.interaction, options: [...question.interaction.options].reverse() } };
  if (scoreQuestion(reversed, { type: 'choice_single', optionId: question.answer.optionId }).status !== 'correct') throw new Error(`${question.questionId}: reversed options changed key`);
}

const outputBytes = Buffer.from(`${JSON.stringify(edited, null, 2)}\n`, 'utf8');
await writeFile(outputPath, outputBytes);
const reread = JSON.parse((await readFile(outputPath)).toString('utf8'));
if (JSON.stringify(reread) !== JSON.stringify(edited)) throw new Error('Serialized readback differs');

const itemReceipts = reread.map((question, index) => {
  const prior = original[index];
  const changed = question.feedback.messages.flatMap((message, msgIndex) =>
    message.text === prior.feedback.messages[msgIndex].text ? [] : [message.targetId]);
  const withoutMessages = (value) => {
    const clone = JSON.parse(JSON.stringify(value));
    clone.feedback.messages = clone.feedback.messages.map(({ text, ...message }) => message);
    return clone;
  };
  const normalizedQuestion = withoutMessages(question);
  const normalizedPrior = withoutMessages(prior);
  if (changedQuestionIds.has(question.questionId)) {
    const replacementsForQuestion = optionChanges.filter(({ questionId }) => questionId === question.questionId);
    for (const replacement of replacementsForQuestion) {
      const newOption = normalizedQuestion.interaction.options.find((option) => option.optionId === replacement.newOptionId);
      const oldOption = normalizedPrior.interaction.options.find((option) => option.optionId === replacement.oldOptionId);
      if (!newOption || !oldOption) throw new Error(`${question.questionId}: option replacement missing after readback`);
      newOption.optionId = oldOption.optionId;
      newOption.text = oldOption.text;
    }
    for (const message of normalizedQuestion.feedback.messages) {
      const replacement = replacementsForQuestion.find((entry) => entry.newOptionId === message.targetId);
      if (replacement) message.targetId = replacement.oldOptionId;
    }
  }
  if (JSON.stringify(normalizedQuestion) !== JSON.stringify(normalizedPrior)) {
    throw new Error(`${question.questionId}: non-message field changed`);
  }
  return { questionId: question.questionId, changedTargetIds: changed, changedMessageCount: changed.length };
});

const receipt = {
  schemaVersion: 'bizq01-n09-b07-v4-expanded-correction-v2',
  inputPath: path.relative(here, frozenPath),
  inputSha256: actualFrozenSha256,
  outputPath: path.relative(here, outputPath),
  outputSha256: sha256(outputBytes),
  questions: reread.length,
  changedWrongOptionMessages: changes.length,
  changedWrongOptionChoices: optionChanges.length,
  changedOptionIdLeaves: optionChanges.length,
  changedOptionTextLeaves: optionChanges.length,
  changedFeedbackTargetIdLeaves: optionChanges.length,
  changedFeedbackMessageTextLeaves: changes.length,
  changedTotalLeaves: changes.length + optionChanges.length * 3,
  validationPass: 18,
  acceptedAnswerCorrect: 18,
  distractorsIncorrect: 72,
  reversedAnswerCorrect: 18,
  changedTargets: changes,
  changedOptions: optionChanges,
  items: itemReceipts
};
const receiptPath = path.join(here, 'AUTHOR-N09-B07-v4-CHECKS.json');
await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify(receipt, null, 2));
