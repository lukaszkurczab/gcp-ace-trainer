import type { AlgorithmQuestion } from "../../tracks/algorithms/algorithmQuestionTypes";
import type { CertificationQuestion } from "../../tracks/cloud-certification/domain";

export type PublishedAlgorithmsBank = {
  formatVersion: 1;
  trackId: "algorithms";
  familyId: "algorithms";
  contentVersion: string;
  groups: readonly { roadmapNodeId: string; itemIds: readonly string[] }[];
  items: readonly AlgorithmQuestion[];
};

export type PublishedCertificationBank = {
  formatVersion: 1;
  trackId: "cloud-certification";
  familyId: "certification";
  contentVersion: string;
  items: readonly CertificationQuestion[];
};
