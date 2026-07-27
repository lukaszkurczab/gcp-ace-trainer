import { GENERATED_ALGORITHM_FEEDBACK_ASSETS } from "./bundled/generatedAlgorithmFeedbackAssets";

export type AlgorithmFeedbackAsset = Readonly<{ id: string; sha256: string; xml: string }>;

/**
 * Generated from the exact local asset identities in the pinned content release.
 * The content contract stores stable local identities, never URLs.
 */
const LOCAL_ALGORITHM_FEEDBACK_ASSETS: Readonly<Record<string, AlgorithmFeedbackAsset>> = Object.freeze(Object.fromEntries(GENERATED_ALGORITHM_FEEDBACK_ASSETS.map((asset) => [asset.id, Object.freeze(asset)])));

export function hasAlgorithmFeedbackAsset(assetId: string): boolean {
  return Object.hasOwn(LOCAL_ALGORITHM_FEEDBACK_ASSETS, assetId);
}

export function resolveAlgorithmFeedbackAsset(assetId: string): AlgorithmFeedbackAsset {
  const asset = LOCAL_ALGORITHM_FEEDBACK_ASSETS[assetId];
  if (!asset) throw new Error(`Unknown local Algorithms feedback asset: ${assetId}.`);
  return asset;
}
