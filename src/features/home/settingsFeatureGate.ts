export type DeferredSettingsFeature =
  | "feedback"
  | "subscription";

const featureOwners: Readonly<Record<DeferredSettingsFeature, string>> = {
  feedback: "support channel",
  subscription: "billing integration",
};

export function throwSettingsFeatureNotImplemented(feature: DeferredSettingsFeature): never {
  throw new Error(
    `SETTINGS_FEATURE_NOT_IMPLEMENTED: ${feature} requires ${featureOwners[feature]}.`,
  );
}
