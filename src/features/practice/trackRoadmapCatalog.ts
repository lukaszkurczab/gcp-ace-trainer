import { findTrackDescriptor, type TrackId } from "../../domain";
import { ALGORITHM_ROADMAP } from "../../tracks/coding-interview";

export type TrackRoadmapCatalogNode = Readonly<{ description: string; id: string; title: string }>;

export function titleForNode(id: string): string {
  return id
    .replace(/[_-]+/g, " ")
    .replace(/\bai\b/gi, "AI")
    .replace(/\bapi\b/gi, "API")
    .replace(/\baws\b/gi, "AWS")
    .replace(/\bgke\b/gi, "GKE")
    .replace(/\biam\b/gi, "IAM")
    .replace(/\bnat\b/gi, "NAT")
    .replace(/\bdns\b/gi, "DNS")
    .replace(/\bvpc\b/gi, "VPC")
    .replace(/\brbac\b/gi, "RBAC")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function descriptionForNode(id: string): string {
  return `Practice scenarios for ${titleForNode(id)}.`;
}

function catalogNode(id: string): TrackRoadmapCatalogNode {
  return Object.freeze({ description: descriptionForNode(id), id, title: titleForNode(id) });
}

export function getTrackRoadmapCatalog(trackId: TrackId): readonly TrackRoadmapCatalogNode[] {
  const descriptor = findTrackDescriptor(trackId);
  if (descriptor?.internalFamily === "coding_interview") {
    return ALGORITHM_ROADMAP.nodes.map((node) => Object.freeze({
      description: node.shortDescription,
      id: node.id,
      title: node.label,
    }));
  }

  const ids = descriptor?.presentation.roadmapNodeIds;
  if (!ids) throw new Error(`Roadmap catalogue unavailable for track ${trackId}.`);
  return ids.map(catalogNode);
}
