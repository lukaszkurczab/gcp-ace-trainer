import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const approval = require("./publicLegalApproval.cjs");

export const legalDocumentApprovalIssue = approval.legalDocumentApprovalIssue;
export const renderCanonicalLegalDocuments = approval.renderCanonicalLegalDocuments;
export const renderedDocumentsSha256 = approval.renderedDocumentsSha256;
