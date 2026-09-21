import type { Question } from "../../content/canonical";

export type CanonicalSourceLink = Readonly<{ host: string; url: string }>;

export async function openCanonicalSourceLink(
  source: CanonicalSourceLink,
  openUrl: (url: string) => Promise<unknown>,
): Promise<"opened" | "failed"> {
  try {
    await openUrl(source.url);
    return "opened";
  } catch {
    return "failed";
  }
}

export function projectCanonicalSourceLinks(question: Question): readonly CanonicalSourceLink[] {
  const candidates = [...(question.sourceRefs ?? [])];
  const details = question.feedback.details;
  if (details && typeof details === "object" && !Array.isArray(details)) {
    const url = (details as Readonly<Record<string, unknown>>).url;
    if (typeof url === "string") candidates.push(url);
  }
  const seen = new Set<string>();
  const links: CanonicalSourceLink[] = [];
  for (const candidate of candidates) {
    if (seen.has(candidate)) continue;
    let parsed: URL;
    try { parsed = new URL(candidate); } catch { continue; }
    if (parsed.protocol !== "https:") continue;
    seen.add(candidate);
    links.push(Object.freeze({ host: parsed.hostname, url: candidate }));
  }
  return Object.freeze(links);
}
