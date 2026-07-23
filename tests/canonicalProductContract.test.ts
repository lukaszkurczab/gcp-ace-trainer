import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { CanonicalProductContractValidationError, loadCanonicalProductContract, parseCanonicalProductContract } from "../scripts/validateCanonicalProductContract";

const validContract = readFileSync("docs/canonical-product-contract.yaml", "utf8");

test("parses the canonical product contract", () => {
  const contract = loadCanonicalProductContract();
  assert.equal(contract.version, 1);
  assert.equal(contract.authority.normativeSource, "canonical-product-contract");
  assert.equal(contract.authority.narrativeDocuments, "non-normative");
});

test("rejects canonical product contracts with unknown fields, missing version, empty requirements, or duplicate requirement identifiers", () => {
  const cases: readonly [string, string, RegExp][] = [
    ["unknown field", `${validContract}unexpected: value\n`, /must NOT have additional properties/],
    ["missing version", validContract.replace("version: 1\n", ""), /must have required property 'version'/],
    ["empty requirements", validContract.replace(/requirements:\n(?:  - .*\n    .*\n)+/, "requirements: []\n"), /must NOT have fewer than 1 items/],
    ["duplicate identifier", validContract.replace("    statement: Product behavior is normative only when defined by this contract.\n", "    statement: Product behavior is normative only when defined by this contract.\n  - id: CONTRACT-AUTHORITY-001\n    statement: A second requirement with the same identifier.\n"), /Duplicate canonical product contract requirement identifier/],
  ];

  for (const [label, source, message] of cases) {
    assert.throws(() => parseCanonicalProductContract(source), (error: unknown) => error instanceof CanonicalProductContractValidationError && message.test(error.message), label);
  }
});
