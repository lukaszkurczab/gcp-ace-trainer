import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ROUTES } from "../../constants/routes";
import type { TrackId } from "../../domain";
import type { RootStackParamList } from "../../navigation";
import type { PracticeSetupRouteDraft } from "../../navigation/types";
import type { PremiumNodeOffer } from "../../content/application/premiumNodeOffers";

type PracticeExitNavigation = Pick<
  NativeStackNavigationProp<RootStackParamList>,
  "reset"
>;

type PracticeHubResetRoutes = [
  { name: typeof ROUTES.HOME },
  {
    name: typeof ROUTES.PRACTICE_HUB;
    params?: RootStackParamList[typeof ROUTES.PRACTICE_HUB];
  },
];

export function buildPracticeHubResetRoutes(topicId?: string): PracticeHubResetRoutes {
  const practiceHubRoute: PracticeHubResetRoutes[1] = {
    name: ROUTES.PRACTICE_HUB,
  };

  if (topicId) {
    practiceHubRoute.params = { topicId };
  }

  return [
    { name: ROUTES.HOME },
    practiceHubRoute,
  ];
}

export function resolvePracticeSetupTopicChoice(
  draft: PracticeSetupRouteDraft,
  selectedTopicId: string,
  trackId: TrackId,
): PracticeSetupRouteDraft | null {
  if (selectedTopicId === draft.topicId) return { ...draft, topicId: selectedTopicId, trackId };

  if (draft.premiumOfferId) {
    return {
      ...draft,
      topicId: selectedTopicId,
      trackId,
      mentalUnitId: undefined,
      expectedContentVersion: undefined,
      expectedArtifactSha256: undefined,
      premiumOfferId: undefined,
    };
  }

  return { ...draft, topicId: selectedTopicId, trackId, mentalUnitId: undefined };
}

export function findMatchingPremiumSetupOffer(
  draft: PracticeSetupRouteDraft,
  offers: readonly PremiumNodeOffer[],
): PremiumNodeOffer | undefined {
  if (!draft.premiumOfferId || !draft.trackId || !draft.topicId || !draft.mode || !draft.expectedContentVersion || !draft.expectedArtifactSha256) return undefined;
  return offers.find((offer) => offer.offerId === draft.premiumOfferId && offer.trackId === draft.trackId &&
    offer.nodeId === draft.topicId && offer.mode.modeId === draft.mode &&
    offer.contentVersion === draft.expectedContentVersion && offer.artifactSha256 === draft.expectedArtifactSha256);
}

export function resetToPracticeHubAfterSession(
  navigation: PracticeExitNavigation,
  topicId?: string,
): void {
  navigation.reset({
    index: 1,
    routes: buildPracticeHubResetRoutes(topicId),
  });
}
