import { loadCanonicalRuntimeCatalog, type CanonicalTrackRuntime } from "../content/canonical";
import { contentPackageRuntimeOwner } from "../application/contentPackageRuntimeOwner";

export async function prepareBundledTestPackages(): Promise<void> {
  await loadCanonicalRuntimeCatalog();
  await contentPackageRuntimeOwner.verifyBundledPackages();
}

export async function getCodingPackageTestCatalog(): Promise<CanonicalTrackRuntime> {
  return (await loadCanonicalRuntimeCatalog()).getTrack("coding-interview-dsa-problem-solving");
}

export async function getCertificationPackageTestCatalog(): Promise<CanonicalTrackRuntime> {
  return (await loadCanonicalRuntimeCatalog()).getTrack("google-cloud-associate-cloud-engineer");
}
