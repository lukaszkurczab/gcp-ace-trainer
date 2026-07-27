import type { AlgorithmFeedbackCodeLanguage } from "../../content/contracts";

export type FeedbackCodeTokenKind = "plain" | "keyword" | "string" | "comment" | "number" | "operator";
export type FeedbackCodeToken = Readonly<{ kind: FeedbackCodeTokenKind; text: string }>;

const KEYWORDS: Readonly<Record<AlgorithmFeedbackCodeLanguage, ReadonlySet<string>>> = {
  pseudocode: new Set(["if", "then", "else", "for", "while", "return", "function", "true", "false", "null"]),
  typescript: new Set(["const", "let", "var", "function", "return", "if", "else", "for", "while", "class", "interface", "type", "new", "true", "false", "null", "undefined"]),
  python: new Set(["def", "return", "if", "elif", "else", "for", "while", "in", "class", "import", "from", "True", "False", "None"]),
  java: new Set(["public", "private", "protected", "class", "static", "void", "int", "long", "boolean", "new", "return", "if", "else", "for", "while", "true", "false", "null"]),
  cpp: new Set(["auto", "bool", "class", "const", "for", "if", "else", "int", "long", "namespace", "return", "std", "string", "true", "false", "nullptr", "while"]),
  go: new Set(["package", "import", "func", "return", "if", "else", "for", "range", "var", "const", "struct", "interface", "true", "false", "nil"]),
  sql: new Set(["SELECT", "FROM", "WHERE", "JOIN", "LEFT", "RIGHT", "INNER", "ON", "GROUP", "BY", "ORDER", "HAVING", "INSERT", "UPDATE", "DELETE", "CREATE", "TABLE", "AS", "AND", "OR", "NULL"]),
};

const TOKEN = /\/\/[^\n]*|#[^\n]*|--[^\n]*|\/\*[\s\S]*?\*\/|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b|[{}()[\];,.<>:=+\-*/%!&|]+/g;

export function tokenizeFeedbackCode(language: AlgorithmFeedbackCodeLanguage, code: string): readonly FeedbackCodeToken[] {
  const tokens: FeedbackCodeToken[] = [];
  let cursor = 0;
  for (const match of code.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > cursor) tokens.push({ kind: "plain", text: code.slice(cursor, index) });
    const text = match[0];
    const normalized = language === "sql" ? text.toUpperCase() : text;
    const kind: FeedbackCodeTokenKind = text.startsWith("//") || text.startsWith("#") || text.startsWith("--") || text.startsWith("/*")
      ? "comment"
      : text.startsWith("'") || text.startsWith('"') ? "string"
        : /^\d/.test(text) ? "number"
          : KEYWORDS[language].has(normalized) ? "keyword"
            : /^[{}()[\];,.<>:=+\-*/%!&|]+$/.test(text) ? "operator" : "plain";
    tokens.push({ kind, text });
    cursor = index + text.length;
  }
  if (cursor < code.length) tokens.push({ kind: "plain", text: code.slice(cursor) });
  return Object.freeze(tokens.map((token) => Object.freeze(token)));
}
