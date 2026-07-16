import { EmptyState, Screen } from "../../components";

/** Visible blocking state while the canonical family runtime is not installed. */
export function CanonicalRuntimeUnavailableScreen() {
  return (
    <Screen>
      <EmptyState
        title="Training runtime unavailable"
        description="This route is unavailable until its canonical application lifecycle is installed and verified."
      />
    </Screen>
  );
}
