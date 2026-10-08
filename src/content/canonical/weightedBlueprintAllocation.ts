export type WeightedBlueprintSection = Readonly<{
  id: string;
  contentDomainId: string;
  weightPercent: number;
}>;

export type WeightedBlueprintAllocation = Readonly<WeightedBlueprintSection & {
  questionCount: number;
}>;

/** Allocates an exact item total by weighted largest remainders. */
export function allocateWeightedBlueprintQuotas(
  total: number,
  sections: readonly WeightedBlueprintSection[],
): readonly WeightedBlueprintAllocation[] {
  if (!Number.isSafeInteger(total) || total <= 0) throw new Error("Weighted blueprint total must be a positive safe integer.");
  if (!Array.isArray(sections) || sections.length === 0) throw new Error("Weighted blueprint sections must be nonempty.");

  const sectionIds = new Set<string>();
  const domainIds = new Set<string>();
  let weightTotal = 0;
  const shares = sections.map((section) => {
    if (!section || typeof section !== "object" || typeof section.id !== "string" || !section.id.trim() || section.id !== section.id.trim()) {
      throw new Error("Weighted blueprint section ID must be a nonempty trimmed string.");
    }
    if (typeof section.contentDomainId !== "string" || !section.contentDomainId.trim() || section.contentDomainId !== section.contentDomainId.trim()) {
      throw new Error("Weighted blueprint content domain ID must be a nonempty trimmed string.");
    }
    if (sectionIds.has(section.id)) throw new Error("Weighted blueprint section IDs must be unique.");
    if (domainIds.has(section.contentDomainId)) throw new Error("Weighted blueprint content domain IDs must be unique.");
    if (!Number.isSafeInteger(section.weightPercent) || section.weightPercent <= 0) throw new Error("Weighted blueprint weights must be positive integers.");
    sectionIds.add(section.id);
    domainIds.add(section.contentDomainId);
    weightTotal += section.weightPercent;
    const product = total * section.weightPercent;
    if (!Number.isSafeInteger(product)) throw new Error("Weighted blueprint quota product exceeds the safe integer range.");
    const count = Math.floor(product / 100);
    return { section, count, remainder: product % 100 };
  });
  if (weightTotal !== 100) throw new Error("Weighted blueprint weights must sum to 100.");

  const remaining = total - shares.reduce((sum, share) => sum + share.count, 0);
  const byRemainder = [...shares].sort((left, right) =>
    right.remainder - left.remainder || (left.section.id < right.section.id ? -1 : left.section.id > right.section.id ? 1 : 0),
  );
  const winners = new Set(byRemainder.slice(0, remaining).map(({ section }) => section.id));
  return Object.freeze(shares.map(({ section, count }) => Object.freeze({
    id: section.id,
    contentDomainId: section.contentDomainId,
    weightPercent: section.weightPercent,
    questionCount: count + (winners.has(section.id) ? 1 : 0),
  })));
}
