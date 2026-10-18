import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { legalSourceFingerprint } from "./legalSourceFingerprint.mjs";
import { legalReviewHtml, prepareLegalReview, writeLegalReview } from "./prepareLegalReview.mjs";

const source = JSON.parse(readFileSync(new URL("../config/public-legal.release.json", import.meta.url), "utf8"));
const expectedReviewRendererFiles = [
  "src/legal/privacyPolicy.ts", "src/legal/termsOfService.ts", "src/legal/legalTranslationDrafts.testOnly.ts",
  "src/legal/legalTranslationDrafts.de.testOnly.ts", "src/legal/legalTranslationDrafts.fr.testOnly.ts",
  "src/legal/legalTranslationDrafts.es.testOnly.ts", "src/legal/legalTranslationDrafts.it.testOnly.ts",
  "src/legal/legalTranslationDrafts.et.testOnly.ts", "scripts/publicLegalApproval.cjs", "scripts/publicLegalApproval.mjs",
];

test("private review-pack CLI writes documents, receipt and hashes every existing renderer", () => {
  const temporary = mkdtempSync(join(tmpdir(), "patternly-review-cli-"));
  const output = join(temporary, "review-pack");
  try {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL("./prepareLegalReview.mjs", import.meta.url)), "--output", output], {
      cwd: process.cwd(), encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /"status":"UNAPPROVED"/u);
    const receipt = JSON.parse(readFileSync(join(output, "receipt.json"), "utf8"));
    assert.equal(receipt.approvalStatus, "UNAPPROVED");
    assert.equal(receipt.deployable, false);
    assert.deepEqual(Object.keys(receipt.templateHashes).sort(), [...expectedReviewRendererFiles].sort());
    assert.ok(Object.values(receipt.templateHashes).every((digest) => /^[a-f0-9]{64}$/u.test(digest)));
    assert.equal(readdirSync(output).length, 17);
    assert.equal(readFileSync(join(output, "de-privacyPolicy.md"), "utf8").startsWith("UNAPPROVED"), true);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

test("renders complete seven-locale drafts without granting approval", () => {
  const pack = prepareLegalReview(source);
  assert.equal(pack.approvalStatus, "UNAPPROVED");
  assert.equal(pack.testOnly, true);
  assert.equal(pack.deployable, false);
  assert.equal(pack.sourceFingerprint, legalSourceFingerprint(source));
  assert.equal(pack.unresolved.length, 0);
  assert.deepEqual(Object.keys(pack.documents), ["en", "pl", "de", "fr", "es", "it", "et"]);
  for (const [locale, documents] of Object.entries(pack.documents)) {
    assert.equal(Object.keys(documents).length, 2);
    assert.equal(documents.privacyPolicy.split(/\n\n+/u).length, 41);
    assert.equal(documents.termsOfService.split(/\n\n+/u).length, 65);
    assert.match(documents.privacyPolicy, /3600/u);
    assert.doesNotMatch(documents.privacyPolicy, /\[(?:TO BE COMPLETED|DO UZUPEŁNIENIA|UNRESOLVED):/u);
    assert.match(pack.documentHashes[locale].privacyPolicy, /^[a-f0-9]{64}$/u);
  }
});

test("unresolved review values remain visible and cannot become approval", () => {
  const unresolvedSource = structuredClone(source);
  for (const locale of ["en", "pl", "de", "fr", "es", "it", "et"]) {
    unresolvedSource.privacy.processingRegisterDisclosure[locale] = "[UNRESOLVED: privacy.processingRegisterDisclosure]";
  }
  const pack = prepareLegalReview(unresolvedSource);
  assert.equal(pack.unresolved.length, 7);
  assert.equal(pack.approvalStatus, "UNAPPROVED");
  assert.equal(pack.deployable, false);
  for (const documents of Object.values(pack.documents)) {
    assert.match(documents.privacyPolicy, /\[UNRESOLVED: privacy\.processingRegisterDisclosure\]/u);
  }
});

test("review renderer uses the canonical source and preserves an unapproved state", () => {
  const changedSource = structuredClone(source);
  changedSource.privacy.deletionTombstoneRetentionDays.en = "8";
  const pack = prepareLegalReview(changedSource);
  assert.equal(pack.approvalStatus, "UNAPPROVED");
  assert.match(pack.documents.en.privacyPolicy, /for 8 days from the original deletion time/u);
  assert.notEqual(pack.sourceFingerprint, legalSourceFingerprint(source));
  assert.match(pack.documents.en.privacyPolicy, /3600/u);
  const missingLocale = structuredClone(source);
  delete missingLocale.privacy.processingRegisterDisclosure.et;
  assert.throws(() => prepareLegalReview(missingLocale), /legal_review_values_invalid/u);
  const approvedSource = structuredClone(source);
  approvedSource.legalDocumentApproval.status = "APPROVED";
  assert.equal(prepareLegalReview(approvedSource).approvalStatus, "UNAPPROVED");
});

test("review comparison escapes source text and cannot target either publishable dist", () => {
  const copy = structuredClone(source);
  copy.terms.operatorLegalName.en = "<script>unsafe()</script>";
  const html = legalReviewHtml(prepareLegalReview(copy));
  assert.doesNotMatch(html, /<script>/u);
  assert.match(html, /&lt;script&gt;/u);
  assert.match(html, /UNAPPROVED/u);
  assert.match(html, /noindex,nofollow/u);
  for (const directory of [new URL("../dist/review", import.meta.url), new URL("../../patternly-web/dist/review", import.meta.url), new URL("../../patternly-web/public/review", import.meta.url)]) {
    assert.throws(() => writeLegalReview(directory.pathname), /private_directory_required/u);
  }
  const temporary = mkdtempSync(join(tmpdir(), "patternly-review-paths-"));
  try {
    symlinkSync(new URL("../../patternly-web/public", import.meta.url).pathname, join(temporary, "public-link"));
    assert.throws(() => writeLegalReview(join(temporary, "public-link", "review")), /symlink_escape_rejected/u);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
