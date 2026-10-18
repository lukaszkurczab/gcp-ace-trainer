import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import "tsx/cjs";
import { legalSourceFingerprint } from "./legalSourceFingerprint.mjs";
import { renderCanonicalLegalDocuments } from "./publicLegalApproval.mjs";

const require = createRequire(import.meta.url);
const { validateLegalVariablesTestDraft } = require("../src/legal/legalVariablesSchema.ts");
const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const locales = ["en", "pl", "de", "fr", "es", "it", "et"];
const translatedLocales = ["de", "fr", "es", "it", "et"];
const reviewRendererFiles = [
  "src/legal/privacyPolicy.ts", "src/legal/termsOfService.ts", "src/legal/legalTranslationDrafts.testOnly.ts",
  ...translatedLocales.map((locale) => `src/legal/legalTranslationDrafts.${locale}.testOnly.ts`),
  "scripts/publicLegalApproval.cjs", "scripts/publicLegalApproval.mjs",
];
const hash = (value) => createHash("sha256").update(value).digest("hex");
const escaped = (text) => text.replace(/[&<>"']/gu, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

/** Review-only rendering; never changes canonical release data or exports a production schema. */
export function prepareLegalReview(source) {
  const { legalDocumentApproval: _legalDocumentApproval, ...variables } = structuredClone(source);
  const marked = { ...variables, testOnly: true, approvalStatus: "UNAPPROVED" };
  const issues = validateLegalVariablesTestDraft(marked);
  if (issues.length) throw new Error(`legal_review_values_invalid:${issues[0].path}`);
  const rendered = renderCanonicalLegalDocuments(source);
  const documents = Object.fromEntries(locales.map((locale) => [locale, {
    privacyPolicy: rendered.privacyPolicy[locale], termsOfService: rendered.termsOfService[locale],
  }]));
  const unresolved = [];
  for (const [locale, localized] of Object.entries(documents)) {
    for (const [kind, text] of Object.entries(localized)) {
      if (/\{\{[^}]+\}\}|\$\{vars\./u.test(text)) throw new Error(`legal_review_interpolation_unresolved:${locale}.${kind}`);
      const markers = [...text.matchAll(/\[(?:TO BE COMPLETED|DO UZUPEŁNIENIA|UNRESOLVED|UNAPPROVED)[^\]]*\]/gu)].map(([marker]) => marker);
      if (markers.length) unresolved.push({ locale, document: kind, markers });
      if (text.split(/\n\n+/u).length !== documents.en[kind].split(/\n\n+/u).length) throw new Error(`legal_review_paragraph_alignment_invalid:${locale}.${kind}`);
    }
  }
  return {
    schemaVersion: "patternly-public-legal-review-pack-v1",
    approvalStatus: "UNAPPROVED", testOnly: true, deployable: false,
    sourceFingerprint: legalSourceFingerprint(source),
    translationsFingerprint: legalSourceFingerprint({ documentVersion: source.documentVersion, terms: source.terms, privacy: source.privacy }),
    documents, unresolved,
    documentHashes: Object.fromEntries(Object.entries(documents).map(([locale, localized]) => [locale,
      Object.fromEntries(Object.entries(localized).map(([kind, text]) => [kind, hash(text)]))])),
  };
}

export function legalReviewHtml(pack) {
  const names = { privacyPolicy: "Privacy policy", termsOfService: "Terms of service" };
  const sections = Object.keys(pack.documents).map((locale) => `<section id="${locale}"><h2>${locale.toUpperCase()}</h2>${Object.keys(names).map((kind) => {
    const columns = [...new Set(["en", "pl", locale])];
    const parts = columns.map((language) => pack.documents[language][kind].split(/\n\n+/u));
    return `<h3>${names[kind]}</h3><table><thead><tr>${columns.map((language) => `<th>${language.toUpperCase()}</th>`).join("")}</tr></thead><tbody>${parts[0].map((_, index) => `<tr>${parts.map((paragraphs) => `<td>${escaped(paragraphs[index])}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }).join("")}</section>`).join("");
  return `<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Patternly — dokumenty do odbioru</title><style>body{font:16px/1.55 system-ui;margin:2rem;color:#15202b}h1,h2,h3{line-height:1.2}nav{display:flex;gap:1rem;flex-wrap:wrap}table{width:100%;table-layout:fixed;border-collapse:collapse;margin-bottom:3rem}th,td{border:1px solid #b5bec8;padding:1rem;vertical-align:top;white-space:pre-wrap;overflow-wrap:anywhere}th{background:#e8edf2}.warning{padding:1rem;border:2px solid #9b4b00;background:#fff3df}section{margin-top:3rem}code{overflow-wrap:anywhere}</style><h1>Patternly — dokumenty do odbioru</h1><p class="warning"><strong>UNAPPROVED · wersja robocza · zakaz publikacji.</strong> To porównanie tłumaczeń, nie zatwierdzenie prawne. Nierozstrzygnięte znaczniki pozostają widoczne. Treść EN/PL także nie ma pełnego odbioru R01. Wymagane osobno: zamknięcie faktów i ocena wszystkich języków. Aktualne placeholdery: ${pack.unresolved.length} dokumentów.</p><p>Źródło EN/PL: <code>${pack.sourceFingerprint}</code></p><nav>${Object.keys(pack.documents).map((locale) => `<a href="#${locale}">${locale.toUpperCase()}</a>`).join("")}</nav>${sections}</html>\n`;
}

export function writeLegalReview(outputDirectory) {
  const output = resolve(outputDirectory);
  const roots = [resolve(appRoot, ".agent/private"), resolve(appRoot, "../.agent/private"), resolve(tmpdir())];
  const inside = (path, root) => path.startsWith(`${root}${sep}`);
  const root = roots.find((candidate) => inside(output, candidate));
  if (!root) throw new Error("legal_review_output_private_directory_required");
  let parent = dirname(output);
  while (!existsSync(parent)) parent = dirname(parent);
  const physicalOutput = resolve(realpathSync(parent), relative(parent, output));
  const physicalRoot = existsSync(root) ? realpathSync(root) : root;
  if (!inside(physicalOutput, physicalRoot) || (root !== resolve(tmpdir()) && physicalRoot !== root)) {
    throw new Error("legal_review_output_symlink_escape_rejected");
  }
  if (existsSync(output)) throw new Error("legal_review_new_output_directory_required");
  const source = JSON.parse(readFileSync(resolve(appRoot, "config/public-legal.release.json"), "utf8"));
  const pack = prepareLegalReview(source);
  mkdirSync(output, { recursive: true });
  for (const [locale, documents] of Object.entries(pack.documents)) {
    for (const [kind, text] of Object.entries(documents)) {
      writeFileSync(resolve(output, `${locale}-${kind}.md`), `UNAPPROVED — REVIEW ONLY — DO NOT PUBLISH\n\n${text}\n`, { flag: "wx" });
    }
  }
  const bytes = `${JSON.stringify(pack, null, 2)}\n`;
  writeFileSync(resolve(output, "review-pack.json"), bytes, { flag: "wx" });
  writeFileSync(resolve(output, "index.html"), legalReviewHtml(pack), { flag: "wx" });
  const receipt = { schemaVersion: "patternly-public-legal-review-receipt-v1", approvalStatus: "UNAPPROVED", deployable: false,
    sourceFingerprint: pack.sourceFingerprint, translationsFingerprint: pack.translationsFingerprint,
    packSha256: hash(bytes), documentHashes: pack.documentHashes, unresolved: pack.unresolved,
    templateHashes: Object.fromEntries(reviewRendererFiles.map((name) => [name, hash(readFileSync(resolve(appRoot, name)))])) };
  writeFileSync(resolve(output, "receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`, { flag: "wx" });
  return receipt;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 2 || args[0] !== "--output" || !args[1]) throw new Error("Usage: prepareLegalReview.mjs --output <new-private-directory>");
    const receipt = writeLegalReview(args[1]);
    console.log(JSON.stringify({ status: "UNAPPROVED", packSha256: receipt.packSha256, output: resolve(args[1]) }));
  } catch (error) {
    console.error(error instanceof Error ? error.message : "legal_review_failed");
    process.exitCode = 1;
  }
}
