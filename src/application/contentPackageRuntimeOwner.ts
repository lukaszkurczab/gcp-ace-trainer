import { CodingInterviewFamilyRuntime } from "./coding-interview/CodingInterviewFamilyRuntime";
import { CertificationFamilyRuntime } from "./certification/CertificationFamilyRuntime";
import type { TrainingFamilyRuntime } from "./trainingLifecycle";
import { GENERATED_FREE_NODE_PACKAGES } from "../content/bundled/generatedFreeNodePackages";
import {
  ContentPackageResolver,
  createCertificationPackageRuntimeCatalog,
  createCodingPackageRuntimeCatalog,
  createPackageCatalogProfileAdapter,
  type PackageCatalogProfileAdapter,
} from "../content/application";
import type { ContentItemRef, ContentPackagePin, TrackFamilyId, TrackId } from "../domain";
import { contentPackagePinsEqual } from "../domain";
import { contentPackageRuntime } from "../infrastructure/content";

const APP_VERSION = "0.1.0";

export type ResolvedPackageRuntime = Readonly<{
  package: Awaited<ReturnType<ContentPackageResolver["resolveExact"]>>;
  profile: PackageCatalogProfileAdapter;
  runtime: TrainingFamilyRuntime;
}>;

/** The sole authority that turns verified package bytes into the existing family lifecycle runtime. */
export class ContentPackageRuntimeOwner {
  private readonly resolver = new ContentPackageResolver(GENERATED_FREE_NODE_PACKAGES, contentPackageRuntime);
  private readonly exact = new Map<string, Promise<ResolvedPackageRuntime>>();
  private readonly resolvedExact = new Map<string, ResolvedPackageRuntime>();
  private readonly discovered = new Map<string, ResolvedPackageRuntime>();

  async resolveForPreparation(input: Readonly<{ trackId: TrackId; familyId: TrackFamilyId; modeId: string }>): Promise<ResolvedPackageRuntime> {
    const discovered = await this.resolver.resolveForDiscovery(input.trackId, supportedFamily(input.familyId), APP_VERSION);
    const pkg = await this.resolver.resolveForPreparation({
      trackId: input.trackId,
      familyId: supportedFamily(input.familyId),
      freeNodeId: discovered.freeNodeId,
      modeId: input.modeId,
      appVersion: APP_VERSION,
    });
    return this.materialize(pkg.packagePin);
  }

  async resolveExact(pin: ContentPackagePin): Promise<ResolvedPackageRuntime> {
    return this.materialize(pin);
  }

  async resolveForDiscovery(trackId: TrackId, familyId: TrackFamilyId): Promise<ResolvedPackageRuntime> {
    const pkg = await this.resolver.resolveForDiscovery(trackId, supportedFamily(familyId), APP_VERSION);
    const resolution = await this.materialize(pkg.packagePin);
    this.discovered.set(trackId, resolution);
    return resolution;
  }

  getPreparedDiscovery(trackId: TrackId): ResolvedPackageRuntime {
    const resolution = this.discovered.get(trackId);
    if (!resolution) throw new Error(`Verified package discovery is not prepared for ${trackId}.`);
    return resolution;
  }

  async verifyBundledPackages(): Promise<void> {
    await Promise.all(GENERATED_FREE_NODE_PACKAGES.map(async (source) => {
      const familyId = source.trackId === "coding-interview-dsa-problem-solving" ? "coding_interview" : "certification";
      await this.resolveForDiscovery(source.trackId, familyId);
    }));
  }

  async resolveItem<T = unknown>(ref: ContentItemRef): Promise<T> {
    const resolution = await this.resolveExact(ref.packagePin);
    if (!contentPackagePinsEqual(ref.packagePin, resolution.package.packagePin) || ref.trackId !== resolution.package.trackId || ref.contentVersion !== resolution.package.contentVersion) {
      throw new Error("Content item reference does not match its exact package.");
    }
    return resolution.profile.getItemById(ref.itemId) as T;
  }

  resolveTextAsset(ref: ContentItemRef, assetId: string): Readonly<{ id: string; sha256: string; text: string }> {
    const resolution = this.resolvedExact.get(pinKey(ref.packagePin));
    if (!resolution) throw new Error("The exact content package pin has not been verified for asset resolution.");
    if (ref.trackId !== resolution.package.trackId || ref.contentVersion !== resolution.package.contentVersion || !contentPackagePinsEqual(ref.packagePin, resolution.package.packagePin)) {
      throw new Error("Feedback asset reference does not match its exact content package.");
    }
    const asset = resolution.profile.assets.find((candidate) => candidate.id === assetId);
    if (!asset) throw new Error(`Asset ${assetId} is unavailable in the exact verified package for ${ref.trackId}.`);
    return Object.freeze({
      id: asset.id,
      sha256: asset.sha256,
      text: contentPackageRuntime.decodeUtf8(contentPackageRuntime.decodeBase64(asset.bytesBase64)),
    });
  }

  private materialize(pin: ContentPackagePin): Promise<ResolvedPackageRuntime> {
    const key = pinKey(pin);
    const current = this.exact.get(key);
    if (current) return current;
    const resolution = this.resolver.resolveExact(pin, APP_VERSION).then((pkg) => {
      const profile = createPackageCatalogProfileAdapter(pkg);
      const runtime = pkg.familyId === "coding_interview"
        ? new CodingInterviewFamilyRuntime(createCodingPackageRuntimeCatalog(pkg), undefined, pkg.taxonomyVersion)
        : pkg.familyId === "certification"
          ? new CertificationFamilyRuntime(createCertificationPackageRuntimeCatalog(pkg), pkg.taxonomyVersion)
          : unsupportedPackageFamily((pkg as { familyId: string }).familyId);
      const resolved = Object.freeze({ package: pkg, profile, runtime });
      this.resolvedExact.set(key, resolved);
      return resolved;
    });
    this.exact.set(key, resolution);
    return resolution;
  }
}

function pinKey(pin: ContentPackagePin): string {
  return `${pin.packageIdentity}:${pin.packageVersion}:${pin.contentReleaseId}`;
}

function supportedFamily(familyId: TrackFamilyId): "coding_interview" | "certification" {
  if (familyId === "coding_interview" || familyId === "certification") return familyId;
  throw new Error(`No content package runtime is installed for ${familyId}.`);
}

function unsupportedPackageFamily(familyId: string): never {
  throw new Error(`No content package runtime is installed for ${String(familyId)}.`);
}

export const contentPackageRuntimeOwner = new ContentPackageRuntimeOwner();
