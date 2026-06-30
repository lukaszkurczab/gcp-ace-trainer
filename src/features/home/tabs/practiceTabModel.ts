import { ROUTES } from "../../../constants/routes";
import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  type TrackDefinition,
} from "../../../domain";
import {
  ALGORITHM_ROADMAP,
  getAlgorithmTrainingItemsForRoadmapNode,
  getFirstUsableAlgorithmRoadmapNode,
  type AlgorithmRoadmapNodeId,
  type AlgorithmRoadmapStatus,
} from "../../../tracks/algorithms";

type AlgorithmsRoadmapNodeTone = "info" | "muted" | "primary" | "warning";

export type AlgorithmsRoadmapPracticeNode = {
  detail: string;
  enabled: boolean;
  itemCount: number;
  label: string;
  nodeId: AlgorithmRoadmapNodeId;
  route?: typeof ROUTES.ALGORITHMS_SESSION;
  routeParams?: {
    nodeId: AlgorithmRoadmapNodeId;
  };
  status: AlgorithmRoadmapStatus;
  title: string;
  tone: AlgorithmsRoadmapNodeTone;
};

export type AlgorithmsPracticeModel = {
  description: string;
  nodes: AlgorithmsRoadmapPracticeNode[];
  primaryAction: {
    label: string;
    route: typeof ROUTES.ALGORITHMS_SESSION;
    routeParams: {
      nodeId: AlgorithmRoadmapNodeId;
    };
  };
  statusLabel: "Draft";
  title: string;
};

export function buildAlgorithmsPracticeModel(
  activeTrack: TrackDefinition,
): AlgorithmsPracticeModel {
  const firstUsableNode = getFirstUsableAlgorithmRoadmapNode();

  return {
    description:
      "Work through static roadmap items with deterministic checks and local attempt history.",
    nodes: ALGORITHM_ROADMAP.nodes.map((node) => {
      const itemCount = getAlgorithmTrainingItemsForRoadmapNode(node.id).length;
      const enabled = node.status === "available" && itemCount > 0;

      return {
        detail: itemCount > 0
          ? `${node.shortDescription} ${itemCount} ${itemCount === 1 ? "item" : "items"} available.`
          : node.shortDescription,
        enabled,
        itemCount,
        label: formatRoadmapStatus(node.status),
        nodeId: node.id,
        route: enabled ? ROUTES.ALGORITHMS_SESSION : undefined,
        routeParams: enabled ? { nodeId: node.id } : undefined,
        status: node.status,
        title: node.label,
        tone: getRoadmapTone(node.status),
      };
    }),
    primaryAction: {
      label: `Start ${firstUsableNode.label}`,
      route: ROUTES.ALGORITHMS_SESSION,
      routeParams: {
        nodeId: firstUsableNode.id,
      },
    },
    statusLabel: "Draft",
    title: activeTrack.title,
  };
}

export function isCloudPracticeTrack(track: TrackDefinition): boolean {
  return track.id === CLOUD_CERTIFICATION_TRACK_ID;
}

export function isAlgorithmsPracticeTrack(track: TrackDefinition): boolean {
  return track.id === ALGORITHMS_TRACK_ID;
}

function formatRoadmapStatus(status: AlgorithmRoadmapStatus): string {
  if (status === "coming_later") {
    return "Coming later";
  }

  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function getRoadmapTone(status: AlgorithmRoadmapStatus): AlgorithmsRoadmapNodeTone {
  if (status === "available") {
    return "primary";
  }

  if (status === "coming_later") {
    return "muted";
  }

  if (status === "locked") {
    return "warning";
  }

  return "info";
}
