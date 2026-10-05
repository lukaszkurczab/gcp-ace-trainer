import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const proposalDir = path.join(here, 'proposals');
const reviewInputDir = path.join(here, 'review-inputs');

// These are feedback-only repairs to the paired wrong-option targets in the
// frozen v2 semantic reports. Read the exact v2 snapshots, not the mutable
// proposal files, which may still contain the earlier v1 bytes. Question
// text, options, keys, scoring, and all other feedback fields remain unchanged.
const expectedV2Sha256 = {
  B05: 'bc2700a32341370d4bd177fc3d3f940718f21e26e9f112fb146e57ff9e020497',
  B06: '8de7e8965b42bc3835282c716a6665617bb20551fc42f5589424c08021596052',
  B07: '99d20efb139d9dafb9a57a2947ba1520f6df468991480863764b1330ec0b6f82'
};
const edits = {
  B05: {
    n09b05_i002_remove_old_contract: 'Older requests omit a custodian because the service supplies the documented handoff. Moving that default behind an undocumented header leaves those callers without the behavior they rely on.',
    n09b05_i004_breaking_change: 'Older clients reject values outside win, loss, and draw, so sending forfeit through their existing response breaks the closed value contract.',
    n09b05_i006_breaking_change: 'Existing clients read the result value as before; replacing it with an object changes the response shape they consume.',
    n09b05_i008_breaking_change: 'Version 1 clients treat an unknown state as terminal, so they will not treat this new value as retryable.',
    n09b05_i009_breaking_change: 'InvoiceId names the customer obligation. Changing it for each issue attempt breaks references that older clients use for that same obligation.',
    n09b05_i010_remove_old_contract: 'Pending revocation is not final revocation. Folding it into “revoked” makes older clients interpret an unfinished state as the completed one.',
    n09b05_i010_breaking_change: 'Older clients reject states beyond active and revoked, so revocation-pending cannot safely travel through their existing state field.',
    n09b05_i013_breaking_change: 'Existing clients consume accepted or rejected. Replacing that status with free-form reason text removes the signal their response handling expects.',
    n09b05_i014_remove_old_contract: 'Progress records keep the retired lesson IDs. Removing those IDs from the catalog leaves existing progress references unresolved.',
    n09b05_i014_breaking_change: 'Older clients expect the default result to contain active lessons only; they are not required to filter retired items out themselves.',
    n09b05_i015_remove_old_contract: 'Existing clients do not send this new request field. Requiring it rejects their current calls before the snapshot can be returned.',
    n09b05_i015_breaking_change: 'Older clients read the edit history. Replacing it with a revision token removes information those clients still consume.',
    n09b05_i017_remove_old_contract: 'False currently means the publication did not occur. Reusing it to mean only that messages exist makes the established boolean misleading.',
    n09b05_i017_breaking_change: 'Older clients expect a boolean publication result; a string is a different response type they cannot consume as that signal.',
    n09b05_i018_breaking_change: 'The original request ID carries the existing delivery promise. Replacing it with a vendor-portion ID loses that stable reference for older clients.',
    n09b05_i018_remove_old_contract: 'Returning only portion IDs removes the original request reference, so older clients cannot associate the split with the request whose delivery promise they track.'
  },
  B06: {
    n09b06_i009_wrong_boundary: 'The public result still needs to distinguish timeout from withdrawal. Keeping the reason private while reporting draw hides that required distinction from result consumers.',
    n09b06_i011_wrong_boundary: 'Reviewers need these references to inspect provenance. A process log they cannot access does not let them identify the data and code used for the published result.',
    n09b06_i011_reconstruct_later: 'The latest dataset or code may differ from the versions that produced this result. Looking them up later can attach incorrect provenance.',
    n09b06_i016_overexpose: 'The case excludes the complete address from general diagnostics. Logging the address and package exposes private shipment data beyond what explains the printed label.',
    n09b06_i018_reconstruct_later: 'The replacement sensor may have a different revision or unit. Pairing an earlier offset with the latest sensor can make the old calibration readings incorrect.'
  },
  B07: {
    n09b07_i025_assumed_cache: 'Yesterday’s quote may reduce calls, but it misses the unchanged fresh-price deadline for this request.',
    n09b07_i028_contract_shortcut: 'Sampling omits some failed runs even though the audit contract requires every failure; retaining redundant success traces does not repair that gap.',
    n09b07_i028_assumed_cache: 'The audit requires every failed run, regardless of frequency. Deleting those records breaks that requirement.',
    n09b07_i030_assumed_cache: 'Without binding the stored checksum to the revision ID, a later revision can reuse a digest for different bytes.'
  }
};

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

const receipts = [];
for (const [unit, replacements] of Object.entries(edits)) {
  const file = path.join(proposalDir, `N09-${unit}-v3.json`);
  const v2File = path.join(reviewInputDir, `N09-${unit}-v2.json`);
  const v2Bytes = await readFile(v2File);
  const v2Sha256 = sha256(v2Bytes);
  if (v2Sha256 !== expectedV2Sha256[unit]) {
    throw new Error(`${unit}: frozen v2 input SHA mismatch (${v2Sha256})`);
  }
  const questions = JSON.parse(v2Bytes.toString('utf8'));
  const touched = [];
  for (const [targetId, replacement] of Object.entries(replacements)) {
    const matches = questions.flatMap((question) => question.feedback.messages
      .filter((message) => message.kind === 'wrong_option' && message.targetId === targetId)
      .map((message) => ({ question, message })));
    if (matches.length !== 1) {
      throw new Error(`${unit}: expected one paired feedback target ${targetId}, found ${matches.length}`);
    }
    const { question, message } = matches[0];
    const option = question.interaction.options.find((candidate) => candidate.optionId === targetId);
    if (!option) throw new Error(`${unit}: no actual option for feedback target ${targetId}`);
    if (typeof message.text !== 'string' || !message.text.length) {
      throw new Error(`${unit}: missing prior message for ${targetId}`);
    }
    if (message.text === replacement) throw new Error(`${unit}: correction already present for ${targetId}`);
    message.text = replacement;
    touched.push({ questionId: question.questionId, targetId, oldText: option.text, newText: replacement });
  }
  const afterBytes = Buffer.from(`${JSON.stringify(questions, null, 2)}\n`, 'utf8');
  await writeFile(file, afterBytes);

  const rereadBytes = await readFile(file);
  const reread = JSON.parse(rereadBytes.toString('utf8'));
  if (JSON.stringify(reread) !== JSON.stringify(questions)) {
    throw new Error(`${unit}: serialized readback differs from edited object`);
  }
  receipts.push({
    unit,
    proposalPath: path.relative(here, file),
    sourceV2Path: path.relative(here, v2File),
    sourceV2Sha256: v2Sha256,
    afterRawSha256: sha256(rereadBytes),
    changedMessageCount: touched.length,
    changes: touched
  });
}

console.log(JSON.stringify({ schemaVersion: 'n09-feedback-message-correction-v3', receipts }, null, 2));
