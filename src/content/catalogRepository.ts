import { AlgorithmContentCatalog } from "../tracks/algorithms/algorithmContentCatalog";
import { CertificationContentCatalog } from "../tracks/cloud-certification/certificationContentCatalog";
import type { PublishedAlgorithmsBank, PublishedCertificationBank } from "./contracts";
import { ContentUnavailableError } from "./errors";

let algorithms: AlgorithmContentCatalog | null = null;
let certification: CertificationContentCatalog | null = null;
export function clearInstalledContentCatalogs(): void { algorithms = null; certification = null; }
export function installAlgorithmsCatalog(bank: PublishedAlgorithmsBank): AlgorithmContentCatalog { algorithms = new AlgorithmContentCatalog(bank); return algorithms; }
export function installCertificationCatalog(bank: PublishedCertificationBank): CertificationContentCatalog { certification = new CertificationContentCatalog(bank.items, bank.contentVersion, bank.diagnosticBaseline, bank.focusPractice, bank.examExperienceProfile, bank.scenarioPractice, bank.weakAreaReview, bank.mixedPractice, bank.quickReview); return certification; }
export function getAlgorithmContentCatalog(): AlgorithmContentCatalog { if (!algorithms) throw new ContentUnavailableError(); return algorithms; }
export function getCertificationContentCatalog(): CertificationContentCatalog { if (!certification) throw new ContentUnavailableError(); return certification; }
