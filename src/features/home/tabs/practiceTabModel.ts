import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  type TrackDefinition,
} from "../../../domain";

type DraftPracticeModeTone = "info" | "muted" | "primary" | "warning";

export type DraftPracticeMode = {
  detail: string;
  enabled: false;
  label: string;
  tone: DraftPracticeModeTone;
  title: string;
};

export type AlgorithmsPracticeModel = {
  description: string;
  modes: DraftPracticeMode[];
  statusLabel: "Draft";
  title: string;
};

export function buildAlgorithmsPracticeModel(
  activeTrack: TrackDefinition,
): AlgorithmsPracticeModel {
  return {
    description:
      "Pattern recognition, strategy choice, and complexity reasoning are being prepared as a separate learning system.",
    modes: [
      {
        detail: "Core approaches such as two pointers, sliding window, search, traversal, and dynamic programming.",
        enabled: false,
        label: "Draft",
        title: "Pattern fundamentals",
        tone: "primary",
      },
      {
        detail: "Choose the likely approach from constraints before writing a solution.",
        enabled: false,
        label: "Planned",
        title: "Strategy recognition",
        tone: "info",
      },
      {
        detail: "Reason about time and space costs after the main approach is understood.",
        enabled: false,
        label: "Planned",
        title: "Complexity reasoning",
        tone: "warning",
      },
      {
        detail: "Translate a known approach into implementation steps without a full online judge.",
        enabled: false,
        label: "Planned",
        title: "Implementation drills",
        tone: "muted",
      },
      {
        detail: "Revisit wrong pattern choices and weak strategy assumptions after sessions exist.",
        enabled: false,
        label: "Planned",
        title: "Mistake review",
        tone: "muted",
      },
    ],
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
