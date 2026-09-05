import { getTrackRegistration, type TrackId } from "../../domain";

export type PracticeSessionExitCopy = Readonly<{
  description: string;
  destructiveLabel: string;
}>;

const partialSummaryCopy: PracticeSessionExitCopy = Object.freeze({
  description: "Pause to continue later, or end the session to see a partial summary. Saved answers remain available.",
  destructiveLabel: "End and view summary",
});

const abandonToPracticeCopy: PracticeSessionExitCopy = Object.freeze({
  description: "Pause to continue later. If you end the session, you will return to Practice and cannot resume it.",
  destructiveLabel: "End session",
});

export function getPracticeSessionExitCopy(trackId: TrackId | undefined): PracticeSessionExitCopy {
  if (trackId === undefined) throw new Error("Practice exit requires an exact supported track identity.");

  const familyId = getTrackRegistration(trackId).familyId;
  if (familyId === "coding_interview") return partialSummaryCopy;
  if (familyId === "certification" || familyId === "design_interview") return abandonToPracticeCopy;
  throw new Error(`Practice exit does not support track family ${familyId}.`);
}
