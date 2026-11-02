export type ApproachPromptPart = Readonly<{ kind: "paragraph" | "example" | "constraints"; label: string; sourceLabel?: string; text: string }>;
export type ApproachPrompt = Readonly<{ title: string | null; parts: readonly ApproachPromptPart[] }>;

/** Presentation only: retain authored text, including numbered/edge-case examples. */
export function parseApproachChallengePrompt(prompt: string): ApproachPrompt {
  const markers = [...prompt.matchAll(/\b(?:Examples|Example(?:\s+\d+)?(?:\s*\([^)]*\))?|Constraints|Limits(?: and assumptions)?):\s*/gu)];
  const parts: ApproachPromptPart[] = [];
  let title: string | null = null;
  const addParagraphs = (text: string) => {
    for (const paragraph of text.trim().split(/\n\s*\n/u).filter(Boolean)) parts.push({ kind: "paragraph", label: "", text: paragraph.trim() });
  };
  const addExample = (label: string, text: string, sourceLabel?: string) => {
    const split = splitExampleTask(text);
    parts.push({ kind: "example", label, ...(sourceLabel ? { sourceLabel } : {}), text: split.example });
    if (split.following) addParagraphs(split.following);
  };
  const lead = prompt.slice(0, markers[0]?.index ?? prompt.length).trim();
  const titleMatch = lead.match(/^([^\n]{1,90})\n\s*\n/u)
    ?? lead.match(/^([^.!?\n]{1,65}\.)(?=\s+(?:Given|Return|Find|A |An |You |For ))/u);
  if (titleMatch) { title = titleMatch[1]!; addParagraphs(lead.slice(titleMatch[0].length)); }
  else addParagraphs(lead);
  for (let index = 0; index < markers.length; index++) {
    const marker = markers[index]!;
    const label = marker[0].trim();
    const text = prompt.slice(marker.index! + marker[0].length, markers[index + 1]?.index ?? prompt.length).trim();
    if (label === "Examples:") {
      const numbered = [...text.matchAll(/(?:^|\n)(\d+)\.\s+/gu)];
      if (numbered.length && numbered[0]!.index === 0) {
        for (let item = 0; item < numbered.length; item++) {
          const current = numbered[item]!;
          const body = text.slice(current.index! + current[0].length, numbered[item + 1]?.index ?? text.length);
          addExample(`Example ${current[1]}:`, body, `${item === 0 ? "Examples: " : ""}${current[1]}.`);
        }
        continue;
      }
    }
    if (/^(?:Constraints|Limits)/u.test(label)) parts.push({ kind: "constraints", label, text });
    else addExample(label, text);
  }
  return { title, parts };
}

/** Split only explicit example separators; linked-list arrows remain part of the input. */
export function formatApproachExample(text: string): Readonly<{ input: string; output: string; following: string | null }> | null {
  const task = splitExampleTask(text);
  text = task.example;
  // Multiple return statements represent multiple cases; retain their authored prose.
  if ([...text.matchAll(/\s+returns\s+/gu)].length > 1) return null;
  const separator = /\s+returns\s+/u.exec(text) ?? /\s+(?:->|→)\s+/u.exec(text);
  if (!separator) return null;
  const input = text.slice(0, separator.index).trim();
  const tail = text.slice(separator.index + separator[0].length).trim();
  if (!input || !tail) return null;
  const following = /\.\s+(?=(?:Which|Choose|What|The tree|V is|Every listed)\b)/u.exec(tail);
  return { input, output: following ? tail.slice(0, following.index + 1) : tail,
    following: following ? tail.slice(following.index + following[0].length) : task.following };
}

function splitExampleTask(text: string): Readonly<{ example: string; following: string | null }> {
  const task = /\.\s+(?=(?:Which|Choose|What)\b)|\n\s*\n(?=(?:Which|Choose|What)\b)/u.exec(text);
  return task ? { example: text.slice(0, task.index + (text[task.index] === "." ? 1 : 0)).trim(), following: text.slice(task.index + task[0].length).trim() }
    : { example: text.trim(), following: null };
}

/** One constraints section, preserving unique assumptions from both authored sources. */
export function approachPromptConstraints(document: ApproachPrompt, constraints: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  return [...document.parts.filter(part => part.kind === "constraints").map(part => part.text), ...constraints]
    .flatMap(text => text.split(/[;\n]+/u)).map(text => text.replace(/^\s*•\s*/u, "").trim()).filter(text => {
      const identity = text.replace(/\s+/gu, "").replace(/\.+$/u, "");
      if (!identity || seen.has(identity)) return false;
      seen.add(identity); return true;
    });
}

/** Paragraph rhythm without changing words or treating decimal points as boundaries. */
export function approachPromptParagraphs(text: string): readonly string[] {
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z])/u);
  const paragraphs: string[] = [];
  for (const sentence of sentences) {
    const last = paragraphs.length - 1;
    if (last >= 0 && paragraphs[last]!.length + sentence.length < 180) paragraphs[last] += ` ${sentence}`;
    else paragraphs.push(sentence);
  }
  return paragraphs;
}
