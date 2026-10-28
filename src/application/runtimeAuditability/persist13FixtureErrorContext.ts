type FixtureMetadataGuard<T extends string> = (value: string) => value is T;

export function findPersist13FixtureErrorMetadata<TStage extends string, TCategory extends string>(
  error: unknown,
  isStage: FixtureMetadataGuard<TStage>,
  isCategory: FixtureMetadataGuard<TCategory>,
): Readonly<{ stage?: TStage; category?: TCategory }> {
  const seen = new Set<object>();
  let current: unknown = error;
  let stage: TStage | undefined;
  let category: TCategory | undefined;
  for (let depth = 0; depth < 8; depth += 1) {
    if (typeof current !== "object" || current === null || Array.isArray(current) || seen.has(current)) break;
    seen.add(current);
    try {
      const row = current as Readonly<Record<string, unknown>>;
      if (!stage && typeof row.stage === "string" && isStage(row.stage)) stage = row.stage;
      if (!category && typeof row.category === "string" && isCategory(row.category)) category = row.category;
      current = row.cause;
    } catch {
      break;
    }
  }
  return Object.freeze({ ...(stage ? { stage } : {}), ...(category ? { category } : {}) });
}
