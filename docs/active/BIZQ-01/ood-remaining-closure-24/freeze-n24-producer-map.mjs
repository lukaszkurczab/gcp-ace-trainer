// Prepare the exact reviewed mixed-identity N08/N09 package; never writes canonical source.
// Preparation runs only after the exact final cross-v2 PASS bytes are pinned below.
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { canonicalJson, sha256, validateTrack } from '../../../../../patternly-content/scripts/build.mjs';
import { fileURLToPath } from 'node:url';

const packet = new URL('./', import.meta.url);
const producer = new URL('../../../../../patternly-content/', packet);
const raw = (name) => readFile(new URL(name, packet));
const get = async (name) => JSON.parse(await raw(name));

// This fixed raw-byte binding is the accepted final cross-unit v2 PASS.
const FINAL_CROSS_V2_PATH = 'CROSS-UNIT-N24-CURRENT-v2.json';
const FINAL_CROSS_V2_SHA256 = '877159e4a88953ec4a56e17e7a664aa6f840273e0579821ba8dc0537e0fec347';
if (!/^[a-f0-9]{64}$/.test(FINAL_CROSS_V2_SHA256 ?? '')) {
  throw new Error('FINAL_CROSS_V2_BINDING_REQUIRED: root must supply the exact PASS report SHA before map generation.');
}

const FIXED = Object.freeze({
  manifestPath: 'N08-N09-MANIFEST.json',
  manifestSha256: '0551c85ba24cfad5498425c14aae207b31ef9ec021c81b9ba489b37170e80612',
  registryPath: 'CROSS-UNIT-N24-REVIEW-INPUTS-v2.json',
  registrySha256: '8f563c542bd7f17449a9688cf5da59e30e6f23388dbe3b37d38f9be8a108a9ea',
  parentRegistrySha256: '455be762a24faffde08e2ea6cf1db1a18e8b7b80455d0623ca7923de4c970c16',
  crossAcceptancePath: 'ROOT-CROSS-N24-v2-ACCEPTANCE.json',
  crossAcceptanceSha256: '5fe6de69fb645be927f10d857533544218b2b1a24b9251d1d576f783965ded7a',
  preAuthoringPath: 'ROOT-PRE-AUTHORING-ACCEPTANCE.json',
  preAuthoringSha256: '2f30030e5a70632ac2c7b5b48a57219771c29b6e164b1aeaa185289ac7a14d7f',
  contractPath: 'N08-N09-CONTRACT.json',
  contractSha256: '6119adeddae7817f45c28dac286900619cc559ab588b544bf3e8c5365e106c27',
  briefingPath: 'N08-N09-BRIEFING.md',
  briefingSha256: '89b4549bfbd364ce56f72accb3940fddaeb1072b8e0929e8c08ca921f1d4f12a',
  designPath: 'N08-N09-DESIGN-QA.json',
  designSha256: 'ebeaeb43c6d6a51699166b40355888b59d1507c1ba231b4647c914c5c7da913a',
  beforeContentVersion: 'object-oriented-design-interview-authoring-v2026.10.05-bizq01-23',
  trackId: 'object-oriented-design-interview',
  beforeProducerHead: '9e2d97f5ee28793c14341d031697cd89273fe288',
  beforeQuestionSetSha256: 'cdb6b644d1029b0ffc5d1a09cbaed2aecb3f7785d718bb056c5d6a0cbd5eeefa',
  preservedQuestionCount: 1089,
  preservedQuestionSetSha256: '5e4e334f5acc89f44925c17926dddde2ebb55b6f11cee792c0dc89803da15377',
  currentQuestionCount: 1413,
  contentVersion: 'object-oriented-design-interview-authoring-v2026.10.05-bizq01-24',
  controls: new Set(['ood-n08-b09-i014', 'ood-n09-b01-i001'])
});

const UNITS = Object.freeze([
  ['OOD-N08-B01', 'review-inputs/N08-B01-v4.json', '5c6ed34d5ad4b6873febf875d1ff9fd5b48c7f6826872254370233e4c87b1503', 'ROOT-N08-B01-v4-ACCEPTANCE.json', 'b00e7bcdcbc07fa955496a39166a64850b2e1a2464b1e01322d8c568af858899', 'SEMANTIC-N08-B01-v4-CORRECTION-QA.json', '45e557feab4a529c2205616ec195e308a8240b730ac633d7a38e7f76b718d91f'],
  ['OOD-N08-B02', 'review-inputs/N08-B02-v4.json', '33c0cbc1cd355618a5b55f2cd423e6f66a7014ce61b08fa9cf7fb317f6f09fe8', 'ROOT-N08-B02-v4-ACCEPTANCE.json', '8af013c1b9c4795119aa8993ae1c418a7358645f5a05c068e099db1479e82afe', 'SEMANTIC-N08-B02-v4-CORRECTION-QA.json', '23b9631cf37af65b49487fdf7dbeb6d77e3490a69bec2df4b0d340a140e7df8a'],
  ['OOD-N08-B03', 'review-inputs/N08-B03-v3.json', '74ac35a41d3045172ee281c0aa6819a4fc275b627ee7882ee1d981bb85e6d4a1', 'ROOT-N08-B03-v3-ACCEPTANCE.json', '8fe5704e2d9497cd5bf8ab03d357df69e8690c8c0a87e827e58627eeda9b643d', 'SEMANTIC-N08-B03-v3-CORRECTION-QA.json', '90f09dc3a0fff5e3c04811384b8db701a6ac5daefb94f30c7f06ca7db6c0a7ce'],
  ['OOD-N08-B04', 'review-inputs/N08-B04-v2.json', '4eba890055c2cccd810540df6d47f1f65f2842108683be90c5e632e630a09646', 'ROOT-N08-B04-v2-ACCEPTANCE.json', '04770129d01f5855a159ac63f64dfaba42cbdc56db3d51aecc3f747fe08758ce', 'SEMANTIC-N08-B04-v2-QA.json', 'f7bbab7510533d36c6b5afb3aeec5390f6f98bb07fd85935bfa25f6e840d4560'],
  ['OOD-N08-B05', 'review-inputs/N08-B05-v3.json', 'ba8349e503dcfe6e6c58ef7cb1af63b312d2b8239c4ef0813f14716dede97677', 'ROOT-N08-B05-v3-ACCEPTANCE.json', '31f0a96a8787af7ba86565d261a770ca40da19e38cbc82eea13b31760e79bb10', 'SEMANTIC-N08-B05-v3-CORRECTION-QA.json', '3a7e2e19d7909c49f63530b495e9260e628525f916a678a772490f6fcea1b4c2'],
  ['OOD-N08-B06', 'review-inputs/N08-B06-v4.json', '8ba061292da10875ec6b2c1148b4e249d610daf520894d9ba520dae9e52c433a', 'ROOT-N08-B06-v4-ACCEPTANCE.json', '329202d1e638c62a76268dfb0e49dd117d1044283957d388de278ce85912687a', 'SEMANTIC-N08-B06-v4-CORRECTION-QA.json', '17b6ee7a0a46695a39ebd6dab1c974f1c2272c4866d82b8ca37367ce7c2f6e84'],
  ['OOD-N08-B07', 'review-inputs/N08-B07-v3.json', '0b1a94aa9b8f8eb81d1c270ff8a63dd585a6c85700f5c968a2509ae2920610a6', 'ROOT-N08-B07-v3-ACCEPTANCE.json', '7fd9b21bc2238f764ba0fd20a711df9da03cb578926d38c33bf589afa5522bc6', 'SEMANTIC-N08-B07-v3-CORRECTION-QA.json', '1f1f8e3fed7fe0f71580c103928f004e7a11308e2dfb84c9ba0be0a9c5c5eefd'],
  ['OOD-N08-B08', 'review-inputs/N08-B08-v4.json', '5a535122196cd793b893cf518a1afcac36aa044166cafdfb009260dbed8fd1f2', 'ROOT-N08-B08-v4-ACCEPTANCE.json', 'a8e7a4c6c1af414af7b11e67ecba84284c3e66777aedcd8773d468141f86e16f', 'SEMANTIC-N08-B08-v4-CORRECTION-QA.json', '0a7ee358efbaa118300428b6b79eabd8dc7d0409e1b4f4b0e67ebb6d686d1b64'],
  ['OOD-N08-B09', 'review-inputs/N08-B09-v5.json', '7068f9df47d5576317266e3e549574a4145307cfe211c6df2335b4fdb213032a', 'ROOT-N08-B09-v5-ACCEPTANCE.json', 'e8f9a81ae999d502b1303355a776a23646f0f6949016a39ae0fb4832b49f6bb8', 'SEMANTIC-N08-B09-v5-QA.json', '53ac4e4ec5efef506b601e5806cb1f458f166a02c3ce6c57bf5aeb44da04d94d'],
  ['OOD-N09-B01', 'review-inputs/N09-B01-v2.json', '665d4e8969561a28a36097c9aef64b05efd3b0a32e969c5005e61e4377071e1b', 'ROOT-N09-B01-v2-ACCEPTANCE.json', 'b5c8efb116a04a7baf6036c1c4c77c4985c86c8ce4fbfc51175cd7f7667c20b3', 'SEMANTIC-N09-B01-v2-QA.json', '1bef288ed3dbc83eff3bf52c8cdb141d30ec469079494cd001ce9f3cc35c9963'],
  ['OOD-N09-B02', 'review-inputs/N09-B02-v3.json', 'f38fc1f31683304f145fc6f8fa8739b94ac2368aa79f73b9a152616df45fa305', 'ROOT-N09-B02-v3-ACCEPTANCE.json', 'dd85e8ada8d32721662ac97e0c81a68b2f868210da4f8178a5d17c148a2b437b', 'SEMANTIC-N09-B02-v3-CORRECTION-QA.json', 'a913f3305709e1c78fbb94c3ba659a53deb461168c85d0321719d36a66c90849'],
  ['OOD-N09-B03', 'review-inputs/N09-B03-v3.json', '72e8c15aafaf5e945b7406895c23f57b2926819d16e9b69686aa9f03fb85ceb5', 'ROOT-N09-B03-v3-ACCEPTANCE.json', '3476d9fcbd0e035ae06aeb85e5600deea6a94dbf46ad7e639a9237af43935721', 'SEMANTIC-N09-B03-v3-CORRECTION-QA.json', 'e481264efb7708b195521801878f9249cae0c1c598465d1a7278e8efac371d7a'],
  ['OOD-N09-B04', 'review-inputs/N09-B04-v3.json', '0e20cea69df7dc17306c7180c5a064f2c170fab66a2901a49eaa34f3551e7d8c', 'ROOT-N09-B04-v3-ACCEPTANCE.json', '51058884656efa99ae380806ae64a48b226ef29a9a450282295a60b2ab59b1d8', 'SEMANTIC-N09-B04-v3-CORRECTION-QA.json', 'd6ac66e537c2a886872e12a08e8552d186c33eeaac7968a132e01b6590787d5f'],
  ['OOD-N09-B05', 'review-inputs/N09-B05-v3.json', '079132e8a69a8de0b58dce533c132c60032e5b2a9f1a1e522c08327f700259cc', 'ROOT-N09-B05-v3-ACCEPTANCE.json', '787127b42a664b95c66db242e77c297578dcb6cb0268125d98a81957667d560d', 'SEMANTIC-N09-B05-v3-CORRECTION-QA.json', '08f121ca7b447a6a320ccda5b03e3d2061f6372d66726a5e90cad169116940cc'],
  ['OOD-N09-B06', 'review-inputs/N09-B06-v3.json', 'c1b0d362bc233193eed1095190c2d5302a432b5a7578b9b7e6a0bd45abe52310', 'ROOT-N09-B06-v3-ACCEPTANCE.json', '1aca3e31f4f2201c772a79d589a8212e748390eed38ba946cd453e1cb38bb01d', 'SEMANTIC-N09-B06-v3-CORRECTION-QA.json', '5319bfa367612627894d8648ac8460e3fba971f0a1670018b84e6afc22e94437'],
  ['OOD-N09-B07', 'review-inputs/N09-B07-v6.json', '04f755252b1c41c6137f171a8d757ea9299b051910762d2ec03d13a1e8ccf734', 'ROOT-N09-B07-v6-ACCEPTANCE.json', '89a323fb9cea342322cd52d4d5cbb95d8e7a5a4c85eb567c5db5e161c669fda5', 'SEMANTIC-N09-B07-v6-CORRECTION-QA.json', '140580ff5cc9744c47298f75465788bdb317972a083087bbcbee0d7802bc3430'],
  ['OOD-N09-B08', 'review-inputs/N09-B08-v2.json', 'ab6538525f79d00b794f465bb77f4e02cae7c01200e687cc802ba8b80b09b229', 'ROOT-N09-B08-v2-ACCEPTANCE.json', '60eba0ae237a1bcade3ec3cd3aec72d2db6cc467fffc876892a02f06a8c707c5', 'SEMANTIC-N09-B08-v2-CORRECTION-QA.json', '667c2d4c7ae3a2adee43d20091ad7f484642787486e9a0eff7a202e1c3f7c93a'],
  ['OOD-N09-B09', 'review-inputs/N09-B09-v2.json', '5d5a43477f2347412caaeea2c1885d6d0bcb6881b6e7216cc2d9ce62e26351b6', 'ROOT-N09-B09-v2-ACCEPTANCE.json', '6c439fdf69bc5e4a19c8d6b3b5c9903bc093afa4b2c609b8fb1a08501cd1278b', 'SEMANTIC-N09-B09-v2-CORRECTION-QA.json', '88e7545b1d2784c5b9fb220cf4bffe80ea2ee41cae7d0e66a585e46405ecb1b8']
].map(([unit, proposalPath, proposalSha256, acceptancePath, acceptanceSha256, reviewPath, reviewSha256]) => ({
  unit, proposalPath, proposalSha256, acceptancePath, acceptanceSha256, reviewPath, reviewSha256
})));

function deepHas(value, target) {
  if (value === target) return true;
  if (Array.isArray(value)) return value.some((entry) => deepHas(entry, target));
  if (value && typeof value === 'object') return Object.values(value).some((entry) => deepHas(entry, target));
  return false;
}

async function main() {
  const crossBytes = await raw(FINAL_CROSS_V2_PATH);
  assert.equal(sha256(crossBytes), FINAL_CROSS_V2_SHA256, 'final cross-v2 raw bytes changed');
  const cross = JSON.parse(crossBytes);
  assert.equal(cross.verdict, 'PASS_BOUNDED_CROSS_UNIT_AND_IDENTITY', 'final cross-v2 must be the accepted identity/cross-unit PASS');

  const crossAcceptanceBytes = await raw(FIXED.crossAcceptancePath);
  assert.equal(sha256(crossAcceptanceBytes), FIXED.crossAcceptanceSha256);
  const crossAcceptance = JSON.parse(crossAcceptanceBytes);
  assert.equal(crossAcceptance.verdict, 'PASS');
  assert.equal(crossAcceptance.reportSha256, FINAL_CROSS_V2_SHA256);
  assert.equal(crossAcceptance.verifiedBeforeCurrentWholePairs, 324);
  assert.equal(crossAcceptance.actualPreservedQuestions, FIXED.preservedQuestionCount);
  assert.equal(crossAcceptance.actualPreservedQuestionSetSha256, FIXED.preservedQuestionSetSha256);

  const manifestBytes = await raw(FIXED.manifestPath);
  assert.equal(sha256(manifestBytes), FIXED.manifestSha256);
  const manifest = JSON.parse(manifestBytes);
  assert.equal(manifest.stage, 'source-freeze; identity-actions-undecided');
  assert.equal(manifest.trackId, 'object-oriented-design-interview');
  assert.equal(manifest.contentVersion, FIXED.beforeContentVersion);
  assert.equal(manifest.producerRepositoryHead, FIXED.beforeProducerHead);
  assert.equal(manifest.questionSetSha256, FIXED.beforeQuestionSetSha256);
  assert.equal(manifest.acceptedN01N07QuestionCount, FIXED.preservedQuestionCount);
  assert.equal(manifest.preservedQuestionSetSha256, FIXED.preservedQuestionSetSha256);
  assert.equal(manifest.scopeQuestionCount, 324);
  assert.equal(manifest.units.length, 18);

  const registryBytes = await raw(FIXED.registryPath);
  assert.equal(sha256(registryBytes), FIXED.registrySha256);
  const registry = JSON.parse(registryBytes);
  assert.equal(registry.parentRegistrySha256, FIXED.parentRegistrySha256);
  assert.equal(registry.manifestSha256, FIXED.manifestSha256);
  assert.equal(registry.producerHead, FIXED.beforeProducerHead);
  assert.equal(registry.trackId, FIXED.trackId);
  assert.equal(registry.beforeContentVersion, FIXED.beforeContentVersion);
  assert.equal(registry.beforeQuestionSetSha256, FIXED.beforeQuestionSetSha256);
  assert.equal(registry.preservedQuestionCount, FIXED.preservedQuestionCount);
  assert.equal(registry.preservedQuestionSetSha256, FIXED.preservedQuestionSetSha256);
  assert.equal(registry.questionCount, 324);
  assert.equal(registry.units.length, 18);

  for (const [path, hash] of [
    [FIXED.preAuthoringPath, FIXED.preAuthoringSha256],
    [FIXED.contractPath, FIXED.contractSha256],
    [FIXED.briefingPath, FIXED.briefingSha256],
    [FIXED.designPath, FIXED.designSha256]
  ]) assert.equal(sha256(await raw(path)), hash, `${path} changed after accepted design`);

  // Bind all accepted per-unit whole-object reviews and the corresponding root receipts.
  const unitEvidence = [];
  for (const evidence of UNITS) {
    const input = registry.units.find((unit) => unit.mentalUnitId === evidence.unit);
    const unit = manifest.units.find((candidate) => candidate.mentalUnitId === evidence.unit);
    assert.ok(input && unit, `${evidence.unit} absent from closed 18-unit inputs`);
    assert.equal(input.proposalPath, evidence.proposalPath);
    assert.equal(input.proposalSha256, evidence.proposalSha256);
    assert.equal(input.sourcePath, unit.sourcePath);
    assert.equal(input.beforeSourceSha256, unit.sourceSha256);
    assert.equal(input.questionCount, 18);

    const proposalBytes = await raw(evidence.proposalPath);
    assert.equal(sha256(proposalBytes), evidence.proposalSha256, `${evidence.unit} proposal changed`);
    const proposal = JSON.parse(proposalBytes);
    assert.equal(proposal.length, 18);
    const proposalById = new Map(proposal.map((question) => [question.questionId, question]));
    assert.equal(proposalById.size, 18);

    const reviewBytes = await raw(evidence.reviewPath);
    assert.equal(sha256(reviewBytes), evidence.reviewSha256, `${evidence.unit} independent review changed`);
    const review = JSON.parse(reviewBytes);
    assert.match(review.verdict, /^PASS/, `${evidence.unit} lacks a final semantic PASS`);
    assert.ok(deepHas(review, evidence.proposalSha256), `${evidence.unit} independent review does not bind the exact proposal`);

    const acceptanceBytes = await raw(evidence.acceptancePath);
    assert.equal(sha256(acceptanceBytes), evidence.acceptanceSha256, `${evidence.unit} root receipt changed`);
    const acceptance = JSON.parse(acceptanceBytes);
    assert.match(acceptance.verdict ?? acceptance.independentVerdict ?? '', /^PASS/, `${evidence.unit} lacks a root acceptance receipt`);
    assert.ok(deepHas(acceptance, evidence.reviewSha256), `${evidence.unit} root receipt does not bind its independent report`);
    for (const field of ['sourceActivationAccepted', 'nativeOrPremiumAccepted', 'fullBIZQ01Accepted']) {
      if (Object.hasOwn(acceptance, field)) assert.equal(acceptance[field], false, `${evidence.unit} receipt exceeded its inactive review scope`);
    }

    const itemBindings = input.items;
    assert.equal(itemBindings.length, 18);
    for (const binding of itemBindings) {
      const question = proposalById.get(binding.questionId);
      const crossItem = cross.items.find((item) => item.beforeQuestionId === binding.beforeQuestionId);
      assert.ok(question, `${evidence.unit}/${binding.questionId} absent from frozen proposal`);
      assert.equal(question.answer.optionId, binding.currentAcceptedOptionId);
      assert.equal(question.interaction.options.find((option) => option.optionId === question.answer.optionId)?.text,
        crossItem.currentAcceptedOptionText);
    }

    unitEvidence.push({
      unit: evidence.unit,
      proposal: { path: evidence.proposalPath, sha256: evidence.proposalSha256 },
      independentReview: { path: evidence.reviewPath, sha256: evidence.reviewSha256, verdict: review.verdict },
      rootAcceptance: { path: evidence.acceptancePath, sha256: evidence.acceptanceSha256, verdict: acceptance.verdict ?? acceptance.independentVerdict },
      wholeObjects: 18
    });
  }
  assert.equal(UNITS.length, 18);
  assert.equal(registry.units.map((unit) => unit.mentalUnitId).sort().join(','), UNITS.map((entry) => entry.unit).sort().join(','));

  // Cross-v2 must bind this exact registry and all 324 exact old/current objects.
  assert.ok(deepHas(cross, FIXED.registrySha256), 'final cross-v2 does not bind the frozen registry-v2');
  assert.ok(deepHas(cross, FIXED.manifestSha256), 'final cross-v2 does not bind the frozen source manifest');
  assert.ok(deepHas(cross, FIXED.beforeQuestionSetSha256), 'final cross-v2 does not bind the v23 QSet');
  assert.ok(deepHas(cross, FIXED.preservedQuestionSetSha256), 'final cross-v2 does not bind the accepted 1089 QSet');
  assert.equal(cross.items?.length, 324, 'final cross-v2 must cover all 324 frozen old/current pairs');
  const crossByBefore = new Map(cross.items.map((item) => [item.beforeQuestionId, item]));
  assert.equal(crossByBefore.size, 324, 'cross-v2 before-question bindings must be one-to-one');

  const current = await validateTrack({ rootDirectory: fileURLToPath(producer), trackId: manifest.trackId });
  assert.equal(current.track.contentVersion, FIXED.beforeContentVersion);
  assert.equal(sha256(current.questions), FIXED.beforeQuestionSetSha256);
  assert.equal(current.questions.length, FIXED.currentQuestionCount);
  const currentById = new Map(current.questions.map((question) => [question.questionId, question]));
  assert.equal(currentById.size, current.questions.length);

  const sourceFiles = [];
  const replacements = [];
  const sameIdCorrections = [];
  const registryRows = [];
  const mappingNotes = [];
  const observedQuestionActions = {};
  const observedOptionActions = {};
  const oldIds = new Set();
  const reservedIds = new Set();
  const targetIds = new Set();
  const cohortOldIds = new Set();

  for (const evidence of UNITS) {
    const input = registry.units.find((unit) => unit.mentalUnitId === evidence.unit);
    const unit = manifest.units.find((candidate) => candidate.mentalUnitId === evidence.unit);
    const questions = JSON.parse(await raw(evidence.proposalPath)).sort((a, b) => a.questionId.localeCompare(b.questionId));
    const questionsById = new Map(questions.map((question) => [question.questionId, question]));
    const expectedBeforeSource = JSON.stringify(unit.beforeItems.map((item) => item.beforeQuestion).sort((a, b) => a.questionId.localeCompare(b.questionId)));
    assert.equal(sha256(expectedBeforeSource), unit.sourceSha256, `${evidence.unit} manifest predecessor text mismatch`);
    assert.equal(await rawSourceHash(unit.sourcePath), unit.sourceSha256, `${evidence.unit} current v23 source bytes changed`);

    const sortedSourceText = JSON.stringify(questions);
    const source = {
      sourceFile: unit.sourcePath,
      beforeSourceSha256: unit.sourceSha256,
      sourceSha256: sha256(sortedSourceText),
      nodeId: questions[0].nodeId,
      mentalUnitId: unit.mentalUnitId
    };
    sourceFiles.push(source);

    for (const binding of input.items) {
      const crossRow = crossByBefore.get(binding.beforeQuestionId);
      assert.ok(crossRow, `cross-v2 missing ${binding.beforeQuestionId}`);
      assert.equal(crossRow.unitId ?? crossRow.mentalUnitId, evidence.unit);
      assert.equal(crossRow.sourcePath, unit.sourcePath);
      const beforeEntry = unit.beforeItems.find((item) => item.questionId === binding.beforeQuestionId);
      assert.ok(beforeEntry, `${evidence.unit} manifest missing ${binding.beforeQuestionId}`);
      const before = beforeEntry.beforeQuestion;
      const beforeId = before.questionId;
      const reservedId = beforeEntry.reservedNewQuestionId;
      const questionId = crossRow.currentQuestionId ?? crossRow.questionId;
      const question = questionsById.get(binding.questionId);
      assert.ok(question, `${evidence.unit} proposal missing ${binding.questionId}`);
      assert.equal(binding.beforeQuestionId, beforeId);
      assert.equal(binding.reservedNewQuestionId, reservedId);
      assert.equal(binding.beforeWholeQuestionSha256, sha256(canonicalJson(before)));
      assert.equal(binding.currentWholeQuestionSha256, sha256(canonicalJson(question)));
      assert.equal(crossRow.beforeWholeQuestionSha256 ?? crossRow.beforeWholeObjectSha256, binding.beforeWholeQuestionSha256);
      assert.equal(crossRow.currentWholeQuestionSha256 ?? crossRow.currentWholeObjectSha256, binding.currentWholeQuestionSha256);
      assert.equal(crossRow.beforeAcceptedOptionId, before.answer.optionId);
      assert.equal(crossRow.currentAcceptedOptionId, question.answer.optionId);
      assert.equal(crossRow.currentAcceptedOptionText, question.interaction.options.find((option) => option.optionId === question.answer.optionId)?.text);

      const action = crossRow.questionIdentityAction ?? crossRow.identityAction ?? crossRow.decision;
      const replace = action === 'REPLACE_WITH_RESERVED_QUESTION_ID';
      const retain = new Set(['RETAIN_QUESTION_ID', 'PRESERVE_QUESTION_ID', 'PRESERVE']).has(action);
      assert.ok(replace || retain, `${binding.beforeQuestionId} has no recognized final cross-v2 question identity action`);
      observedQuestionActions[action] = (observedQuestionActions[action] ?? 0) + 1;
      assert.equal(questionId, replace ? reservedId : beforeId, `${binding.beforeQuestionId} cross-v2 identity action/ID mismatch`);
      assert.equal(question.questionId, questionId, `${binding.beforeQuestionId} frozen proposal ID does not match accepted cross-v2 ID`);
      assert.ok(!oldIds.has(beforeId), `duplicate old question ID ${beforeId}`);
      assert.ok(!targetIds.has(questionId), `duplicate mapped question ID ${questionId}`);
      oldIds.add(beforeId);
      targetIds.add(questionId);
      cohortOldIds.add(beforeId);
      if (reservedIds.has(reservedId)) throw new Error(`duplicate reserved ID ${reservedId}`);
      reservedIds.add(reservedId);
      if (replace) {
        assert.ok(!currentById.has(reservedId), `reserved question ID is already used in the v23 track: ${reservedId}`);
        const beforeOptionIds = new Set(before.interaction.options.map((option) => option.optionId));
        assert.ok(question.interaction.options.every((option) => !beforeOptionIds.has(option.optionId)), `${beforeId} replacement reuses an old option ID`);
      }

      const acceptedOptionAction = crossRow.acceptedOptionIdentityAction ?? crossRow.optionIdentityAction;
      if (acceptedOptionAction !== undefined) {
        assert.ok(['RETAIN_OPTION_ID', 'FRESH_OPTION_ID_ALREADY_PROPOSED', 'ASSIGN_FRESH_ACCEPTED_OPTION_ID', 'FRESH_ACCEPTED_OPTION_ID_REQUIRED_AND_PROPOSED'].includes(acceptedOptionAction),
          `${beforeId} has unknown accepted-option identity action ${acceptedOptionAction}`);
        if (acceptedOptionAction === 'RETAIN_OPTION_ID') assert.equal(question.answer.optionId, before.answer.optionId);
        if (acceptedOptionAction !== 'RETAIN_OPTION_ID') assert.notEqual(question.answer.optionId, before.answer.optionId);
        observedOptionActions[acceptedOptionAction] = (observedOptionActions[acceptedOptionAction] ?? 0) + 1;
      }

      const learningObjective = beforeEntry.learningObjectiveHypothesis ?? unit.learningObjectiveHypothesis;
      assert.ok(learningObjective?.trim(), `${beforeId} lacks a manifest-bound unit objective`);
      const positiveControl = (beforeEntry.findingCodes ?? []).includes('CASE_TO_UNIT_DECISION_SUPPORTED');
      const confirmedDefects = (beforeEntry.findingCodes ?? []).filter((code) => code !== 'CASE_TO_UNIT_DECISION_SUPPORTED');
      if (positiveControl) {
        assert.ok(FIXED.controls.has(beforeId), `unexpected positive control ${beforeId}`);
        mappingNotes.push({
          beforeQuestionId: beforeId,
          note: 'CASE_TO_UNIT_DECISION_SUPPORTED is a retained positive facet, excluded from confirmedDefects; the remaining recorded issues concern explanations/options/diagnostics, not an asserted wrong key.'
        });
      }

      const item = {
        sourceFile: unit.sourcePath,
        beforeSourceSha256: unit.sourceSha256,
        sourceSha256: source.sourceSha256,
        nodeId: question.nodeId,
        mentalUnitId: unit.mentalUnitId,
        beforeQuestionId: beforeId,
        questionId,
        learningObjective,
        confirmedDefects,
        identityAction: replace ? 'replace_question_with_new_id' : 'preserve_question_id',
        identityReason: crossRow.identityRationale ?? crossRow.identityReason,
        acceptedOptionId: question.answer.optionId,
        sourceRefs: question.sourceRefs,
        beforeQuestion: before,
        currentQuestion: question
      };
      assert.ok(item.identityReason?.trim(), `${beforeId} lacks the accepted cross-unit identity rationale`);
      (replace ? replacements : sameIdCorrections).push(item);
      registryRows.push({
        beforeQuestionId: beforeId,
        questionId,
        beforeWholeQuestionSha256: binding.beforeWholeQuestionSha256,
        currentWholeQuestionSha256: binding.currentWholeQuestionSha256,
        identityAction: item.identityAction,
        acceptedOptionId: item.acceptedOptionId
      });
    }
  }

  assert.equal(oldIds.size, 324);
  assert.equal(crossByBefore.size, oldIds.size);
  assert.deepEqual(observedQuestionActions, cross.identityCounts.questionAction);
  assert.deepEqual(observedOptionActions, cross.identityCounts.acceptedOptionAction);
  assert.equal(FIXED.controls.size, mappingNotes.length, 'the two supported-facet controls must be explicitly documented');
  assert.deepEqual(new Set(mappingNotes.map((note) => note.beforeQuestionId)), FIXED.controls);

  sourceFiles.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile));
  replacements.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile) || a.beforeQuestionId.localeCompare(b.beforeQuestionId));
  sameIdCorrections.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile) || a.beforeQuestionId.localeCompare(b.beforeQuestionId));
  registryRows.sort((a, b) => a.beforeQuestionId.localeCompare(b.beforeQuestionId));
  mappingNotes.sort((a, b) => a.beforeQuestionId.localeCompare(b.beforeQuestionId));

  const remove = new Set(cohortOldIds);
  const preserved = current.questions.filter((question) => !remove.has(question.questionId));
  assert.equal(preserved.length, FIXED.preservedQuestionCount);
  assert.equal(sha256(preserved), FIXED.preservedQuestionSetSha256);
  const next = [
    ...preserved,
    ...replacements.map((item) => item.currentQuestion),
    ...sameIdCorrections.map((item) => item.currentQuestion)
  ].sort((a, b) => a.questionId.localeCompare(b.questionId));
  assert.equal(next.length, FIXED.currentQuestionCount);
  assert.equal(new Set(next.map((question) => question.questionId)).size, FIXED.currentQuestionCount);
  assert.equal(sha256(next), sha256([...preserved, ...replacements.map((item) => item.currentQuestion), ...sameIdCorrections.map((item) => item.currentQuestion)]
    .sort((a, b) => a.questionId.localeCompare(b.questionId))));
  for (const question of preserved) assert.equal(canonicalJson(next.find((candidate) => candidate.questionId === question.questionId)), canonicalJson(question));

  const proof = {
    schemaVersion: 'patternly-bizq-semantic-replacement-v1',
    scope: `BIZQ-01 OOD source24, fixed 18-unit N08/N09 cohort; ${replacements.length} replacements and ${sameIdCorrections.length} same-ID corrections; not full-bank acceptance`,
    trackId: manifest.trackId,
    beforeProducerCommit: manifest.producerRepositoryHead,
    beforeContentVersion: manifest.contentVersion,
    contentVersion: FIXED.contentVersion,
    beforeQuestionSetSha256: manifest.questionSetSha256,
    questionSetSha256: sha256(next),
    sourceFiles,
    replacements,
    sameIdCorrections
  };
  const proofBytes = Buffer.from(JSON.stringify(proof, null, 2) + '\n');
  const evidenceFiles = [
    { path: FIXED.manifestPath, sha256: FIXED.manifestSha256 },
    { path: FIXED.registryPath, sha256: FIXED.registrySha256 },
    { path: FIXED.crossAcceptancePath, sha256: FIXED.crossAcceptanceSha256 },
    { path: FINAL_CROSS_V2_PATH, sha256: FINAL_CROSS_V2_SHA256 },
    ...unitEvidence.flatMap((unit) => [unit.proposal, unit.authorNotes, unit.independentReview, unit.rootAcceptance])
  ];
  const map = {
    result: 'PASS',
    scope: 'Exact reviewed 324-object producer map only; implementation, source activation, producer design, app consumer, admission and full BIZQ-01 acceptance remain separate.',
    manifestSha256: FIXED.manifestSha256,
    registrySha256: FIXED.registrySha256,
    finalCrossV2: { path: FINAL_CROSS_V2_PATH, sha256: FINAL_CROSS_V2_SHA256, verdict: cross.verdict },
    unitEvidence,
    evidenceFiles,
    mappingNotes,
    identityCounts: { replacements: replacements.length, sameIdCorrections: sameIdCorrections.length },
    registrySha256ForIdentityRows: sha256(registryRows),
    proofSha256: sha256(proofBytes),
    sourceActivation: false,
    ...proof
  };
  const mapBytes = Buffer.from(JSON.stringify(map, null, 2) + '\n');
  await writeFile(new URL('PREPARED-FIXED-PROOF24.json', packet), proofBytes, { flag: 'wx' });
  await writeFile(new URL('ROOT-N24-PRODUCER-MAP.json', packet), mapBytes, { flag: 'wx' });
  console.log(JSON.stringify({
    result: 'PASS',
    mappedObjects: oldIds.size,
    replacements: replacements.length,
    sameIdCorrections: sameIdCorrections.length,
    sourceFiles: sourceFiles.length,
    preservedQuestionCount: preserved.length,
    questionSetSha256: proof.questionSetSha256,
    proofSha256: sha256(proofBytes),
    mapSha256: sha256(mapBytes),
    sourceActivation: false
  }, null, 2));
}

async function rawSourceHash(sourcePath) {
  const sourceBytes = await readFile(new URL(sourcePath, producer));
  return sha256(sourceBytes);
}

await main();
