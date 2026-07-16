import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { EmptyState, Screen } from "../../components";
import { ROUTES } from "../../constants";
import type { RootStackParamList } from "../../navigation";

type PracticeSessionScreenProps = NativeStackScreenProps<RootStackParamList, typeof ROUTES.PRACTICE_SESSION>;

/** Previous feature-owned session runners were removed; this route must not improvise persistence. */
export function PracticeSessionScreen({ navigation }: PracticeSessionScreenProps) {
  return (
    <Screen>
      <EmptyState
        title="Practice runtime unavailable"
        description="A canonical application lifecycle is required before a practice session can start."
        actionLabel="Back to practice"
        onActionPress={() => navigation.navigate(ROUTES.PRACTICE_HUB)}
      />
    </Screen>
  );
}
