import type { TrackId } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import type { HomePlanReady } from "../../application/homePlanSnapshotReader";
import { ROUTES } from "../../constants/routes";

type Translate = (key: string) => string;

export function localizeHomePlanArea(plan: HomePlanReady, translate: Translate): string {
  return translate(plan.session.areaLabel);
}

export function buildHomePlanPracticeSetupParams(
  plan: HomePlanReady,
  trackId: TrackId,
): NonNullable<RootStackParamList[typeof ROUTES.PRACTICE_SETUP]> {
  return Object.freeze({
    expectedContentPackagePin: plan.identity.contentPackagePin,
    expectedContentVersion: plan.identity.contentVersion,
    mode: plan.session.modeId as never,
    sessionLength: plan.session.sessionLength,
    source: "home" as const,
    topicId: plan.session.topicId,
    trackId,
  });
}
