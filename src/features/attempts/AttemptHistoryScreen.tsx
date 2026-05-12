import { EmptyState, Screen } from "../../components";

export function AttemptHistoryScreen() {
  return (
    <Screen>
      <EmptyState
        title="No attempts recorded"
        description="TODO: list exam and practice attempts saved locally on this device."
      />
    </Screen>
  );
}
