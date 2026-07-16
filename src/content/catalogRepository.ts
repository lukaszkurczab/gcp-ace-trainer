import { AlgorithmContentCatalog, type AlgorithmContentGroup } from "../tracks/algorithms/algorithmContentCatalog";
import { CertificationContentCatalog } from "../tracks/cloud-certification/certificationContentCatalog";
import type { PublishedAlgorithmsBank, PublishedCertificationBank } from "./contracts";
import { ContentUnavailableError } from "./errors";

let algorithms: AlgorithmContentCatalog | null = null;
let certification: CertificationContentCatalog | null = null;
export function clearInstalledContentCatalogs(): void { algorithms = null; certification = null; }
export function installAlgorithmsCatalog(bank: PublishedAlgorithmsBank): AlgorithmContentCatalog { const byId = new Map(bank.items.map((item) => [item.id, item])); const groups: AlgorithmContentGroup[] = bank.groups.map((group) => ({ id: group.roadmapNodeId, roadmapNodeId: group.roadmapNodeId, questions: group.itemIds.map((id) => { const item = byId.get(id); if (!item) throw new ContentUnavailableError(); return item; }) })); algorithms = new AlgorithmContentCatalog(groups); return algorithms; }
export function installCertificationCatalog(bank: PublishedCertificationBank): CertificationContentCatalog { certification = new CertificationContentCatalog(bank.items, bank.contentVersion); return certification; }
export function getAlgorithmContentCatalog(): AlgorithmContentCatalog { if (!algorithms) throw new ContentUnavailableError(); return algorithms; }
export function getCertificationContentCatalog(): CertificationContentCatalog { if (!certification) throw new ContentUnavailableError(); return certification; }
