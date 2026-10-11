import type { Question } from "../../content/canonical";

export type CanonicalSourceLink = Readonly<{
  host: string;
  url: string;
  role: "documentation" | "course";
  title?: string;
  section?: string;
  requiresAccount?: boolean;
}>;

export async function openCanonicalSourceLink(
  source: CanonicalSourceLink,
  openUrl: (url: string) => Promise<unknown>,
): Promise<"opened" | "failed"> {
  try {
    if (!/^https:\/\/[^\s/?#]+(?:[/?#][^\s]*)?$/u.test(source.url)) return "failed";
    if (new URL(source.url).protocol !== "https:") return "failed";
    await openUrl(source.url);
    return "opened";
  } catch {
    return "failed";
  }
}

export function projectCanonicalSourceLinks(question: Question): readonly CanonicalSourceLink[] {
  const details = question.feedback.details;
  const documentationUrl = details && typeof details === "object" && !Array.isArray(details)
    ? (details as Readonly<Record<string, unknown>>).url
    : undefined;
  const course = question.feedback.course;
  // A course-backed question presents one documentation link and one course
  // lesson link. Other tracks keep the historical sourceRefs-first behavior.
  const candidates: readonly Readonly<{ url: unknown; role: "documentation" | "course"; title?: string; section?: string; requiresAccount?: boolean }>[] = course
    ? [
        ...(typeof documentationUrl === "string" ? [{ url: documentationUrl, role: "documentation" as const }] : []),
        { url: course.url, role: "course", title: course.title, ...(course.section ? { section: course.section } : {}), requiresAccount: course.requiresAccount },
      ]
    : [...(question.sourceRefs ?? []).map((url) => ({ url, role: "documentation" as const })), ...(typeof documentationUrl === "string" ? [{ url: documentationUrl, role: "documentation" as const }] : [])];
  const seen = new Set<string>();
  const links: CanonicalSourceLink[] = [];
  for (const candidate of candidates) {
    if (typeof candidate.url !== "string") continue;
    const identity = `${candidate.role}\u0000${candidate.url}`;
    if (seen.has(identity)) continue;
    if (!/^https:\/\/[^\s/?#]+(?:[/?#][^\s]*)?$/u.test(candidate.url)) continue;
    let parsed: URL;
    try { parsed = new URL(candidate.url); } catch { continue; }
    if (parsed.protocol !== "https:") continue;
    seen.add(identity);
    links.push(Object.freeze({ host: parsed.hostname, url: candidate.url, role: candidate.role, ...(candidate.title ? { title: candidate.title } : {}), ...(candidate.section ? { section: candidate.section } : {}), ...(candidate.requiresAccount === undefined ? {} : { requiresAccount: candidate.requiresAccount }) }));
  }
  return Object.freeze(links);
}
