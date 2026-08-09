import { contentPackageRuntimeOwner } from "../src/application/contentPackageRuntimeOwner";
import { createCertificationPackageRuntimeCatalog, createCodingPackageRuntimeCatalog } from "../src/content/application";

export async function prepareBundledTestPackages(): Promise<void> {
  await contentPackageRuntimeOwner.verifyBundledPackages();
}

export function getCodingPackageTestCatalog() {
  const resolution = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving");
  if (resolution.package.familyId !== "coding_interview") throw new Error("Coding package family mismatch.");
  return createCodingPackageRuntimeCatalog(resolution.package);
}

export function getCertificationPackageTestCatalog() {
  const resolution = contentPackageRuntimeOwner.getPreparedDiscovery("google-cloud-associate-cloud-engineer");
  if (resolution.package.familyId !== "certification") throw new Error("Certification package family mismatch.");
  return createCertificationPackageRuntimeCatalog(resolution.package);
}
