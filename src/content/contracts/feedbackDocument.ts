export const ALGORITHM_FEEDBACK_CODE_LANGUAGES = ["pseudocode", "typescript", "python", "java", "cpp", "go", "sql"] as const;
export type AlgorithmFeedbackCodeLanguage = (typeof ALGORITHM_FEEDBACK_CODE_LANGUAGES)[number];

export const ALGORITHM_FEEDBACK_CALLOUT_KINDS = ["decision_rule", "worked_example", "counterexample", "common_mistake", "edge_case", "complexity_note", "key_takeaway"] as const;
export type AlgorithmFeedbackCalloutKind = (typeof ALGORITHM_FEEDBACK_CALLOUT_KINDS)[number];

export type AlgorithmFeedbackParagraphBlock = Readonly<{ type: "paragraph"; text: string }>;
export type AlgorithmFeedbackHeadingBlock = Readonly<{ type: "heading"; level: 2 | 3; text: string }>;
export type AlgorithmFeedbackBulletListBlock = Readonly<{ type: "bullet_list"; items: readonly string[] }>;
export type AlgorithmFeedbackOrderedListBlock = Readonly<{ type: "ordered_list"; items: readonly string[] }>;
export type AlgorithmFeedbackCodeBlock = Readonly<{ type: "code"; language: AlgorithmFeedbackCodeLanguage; code: string }>;
export type AlgorithmFeedbackImageBlock = Readonly<{ type: "image"; assetId: string; alt: string }>;
export type AlgorithmFeedbackCalloutBlock = Readonly<{ type: "callout"; kind: AlgorithmFeedbackCalloutKind; text: string; title?: string }>;
export type AlgorithmFeedbackBlock = AlgorithmFeedbackParagraphBlock | AlgorithmFeedbackHeadingBlock | AlgorithmFeedbackBulletListBlock | AlgorithmFeedbackOrderedListBlock | AlgorithmFeedbackCodeBlock | AlgorithmFeedbackImageBlock | AlgorithmFeedbackCalloutBlock;

/** Safe data-only rich feedback. Authored HTML is deliberately not part of this contract. */
export type AlgorithmFeedbackDocument = Readonly<{ blocks: readonly AlgorithmFeedbackBlock[] }>;

/** Text equivalent for non-rich downstream diagnostics; it is never an HTML renderer. */
export function feedbackDocumentToPlainText(document: AlgorithmFeedbackDocument): string {
  return document.blocks.map((block) => {
    if (block.type === "bullet_list") return block.items.join("\n");
    if (block.type === "ordered_list") return block.items.map((item, index) => `${index + 1}. ${item}`).join("\n");
    if (block.type === "image") return block.alt;
    if (block.type === "code") return block.code;
    if (block.type === "callout") return [block.title, block.text].filter(Boolean).join("\n");
    return block.text;
  }).join("\n\n");
}
