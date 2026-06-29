import type { TrainingSession, TrainingSessionItemRef } from "../training";

export function getCurrentSessionItemRef(session: TrainingSession): TrainingSessionItemRef {
  return getSessionItemRefAt(session, session.currentItemIndex);
}

export function getNextSessionItemRef(session: TrainingSession): TrainingSessionItemRef | undefined {
  return session.itemRefs[session.currentItemIndex + 1];
}

export function getPreviousSessionItemRef(session: TrainingSession): TrainingSessionItemRef | undefined {
  return session.itemRefs[session.currentItemIndex - 1];
}

export function moveToNextSessionItem(session: TrainingSession): TrainingSession {
  return moveToSessionItem(session, session.currentItemIndex + 1);
}

export function moveToPreviousSessionItem(session: TrainingSession): TrainingSession {
  return moveToSessionItem(session, session.currentItemIndex - 1);
}

export function moveToSessionItem(session: TrainingSession, index: number): TrainingSession {
  assertSessionCanNavigate(session);

  if (!Number.isInteger(index) || index < 0 || index >= session.itemRefs.length) {
    throw new Error(`Training session item index out of bounds: ${index}.`);
  }

  return {
    ...session,
    currentItemIndex: index,
  };
}

function getSessionItemRefAt(session: TrainingSession, index: number): TrainingSessionItemRef {
  const itemRef = session.itemRefs[index];

  if (!itemRef) {
    throw new Error(`Training session item index out of bounds: ${index}.`);
  }

  return itemRef;
}

function assertSessionCanNavigate(session: TrainingSession): void {
  if (session.status !== "active") {
    throw new Error(`Cannot navigate a ${session.status} training session.`);
  }
}
