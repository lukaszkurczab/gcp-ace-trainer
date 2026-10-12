import type { TrackFamilyId } from "../domain";
import type { TrainingCatalog, TrainingFamilyRuntime, TrainingInteractionPort } from "./trainingLifecycle";

export type TrainingFamilyRuntimeFactory = (catalog: TrainingCatalog, interactions: TrainingInteractionPort) => TrainingFamilyRuntime;
export type TrainingFamilyRuntimeRegistration = Readonly<{ familyId: TrackFamilyId; create: TrainingFamilyRuntimeFactory }>;
export type TrainingFamilyRuntimeResolver = Readonly<{ resolve(catalog: TrainingCatalog, familyId: TrackFamilyId, interactions: TrainingInteractionPort): TrainingFamilyRuntime }>;

/** Explicit family-to-factory composition. Track admission remains the caller's responsibility. */
export function createTrainingFamilyRuntimeResolver(registrations: readonly TrainingFamilyRuntimeRegistration[]): TrainingFamilyRuntimeResolver {
  const factories = new Map<TrackFamilyId, TrainingFamilyRuntimeFactory>();
  for (const registration of registrations) {
    if (typeof registration.familyId !== "string" || !registration.familyId.trim() || typeof registration.create !== "function") {
      throw new Error("Training family runtime registration is invalid.");
    }
    if (factories.has(registration.familyId)) throw new Error(`Training family runtime is registered more than once: ${registration.familyId}.`);
    factories.set(registration.familyId, registration.create);
  }
  return Object.freeze({
    resolve(catalog, familyId, interactions) {
      const factory = factories.get(familyId);
      if (!factory) throw new Error(`Training family runtime is not registered: ${familyId}.`);
      const runtime = factory(catalog, interactions);
      if (!runtime || runtime.familyId !== familyId) throw new Error(`Training family runtime factory returned a mismatched family: ${familyId}.`);
      return runtime;
    },
  });
}
