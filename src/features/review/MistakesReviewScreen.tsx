import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { loadActiveTrackId as getActiveTrackId } from "../../application/learningReadModels";
import { buildReviewQueueScreenModel, type ReviewQueueScreenModel } from "./reviewQueueModel";
import { loadTrackReviewQueueViewModel, removeUnavailableReview } from "../../application/reviewQueueQueries";
import { describeOperationalFailure } from "../../application/operationalDiagnostics";
import { MistakesReviewView } from "./MistakesReviewView";

export function MistakesReviewScreen() {
  const [model, setModel] = useState<ReviewQueueScreenModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [readError, setReadError] = useState<string | null>(null);
  const [hasActiveTrack, setHasActiveTrack] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [refreshRevision, setRefreshRevision] = useState(0);
  const [confirmRemoveUnavailable, setConfirmRemoveUnavailable] = useState(false);
  const [removingUnavailable, setRemovingUnavailable] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadReviewQueue() {
        setLoading(true);
        setReadError(null);
        setModel(null);
        setSelectedRowId(null);
        setConfirmRemoveUnavailable(false);
        setHasActiveTrack(false);

        try {
          const activeTrackId = await getActiveTrackId();
          if (!activeTrackId) {
            if (isActive) {
              setHasActiveTrack(false);
              setLoading(false);
            }
            return;
          }
          const viewModel = await loadTrackReviewQueueViewModel({ trackId: activeTrackId });
          const nextModel = buildReviewQueueScreenModel(viewModel);

          if (isActive) {
            setHasActiveTrack(true);
            setModel(nextModel);
            setLoading(false);
          }
        } catch (error) {
          if (isActive) {
            setReadError(describeOperationalFailure(error, "Review queue data is unavailable."));
            setLoading(false);
          }
        }
      }

      void loadReviewQueue();

      return () => {
        isActive = false;
      };
    }, [refreshRevision]),
  );

  const visibleRows = useMemo(() => {
    if (!model) {
      return [];
    }

    return model.dueRows.length > 0 ? model.dueRows : model.upcomingRows;
  }, [model]);

  const selectedRow = [...visibleRows, ...(model?.unavailableRows ?? [])].find((row) => row.id === selectedRowId) ?? null;

  const removeSelectedUnavailable = async () => {
    if (!selectedRow || selectedRow.kind !== "unavailable" || removingUnavailable) return;
    setRemovingUnavailable(true);
    try {
      await removeUnavailableReview(selectedRow.id);
      setSelectedRowId(null);
      setConfirmRemoveUnavailable(false);
      setRefreshRevision((revision) => revision + 1);
    } catch (error) {
      setReadError(describeOperationalFailure(error, "Unavailable review could not be removed."));
    } finally {
      setRemovingUnavailable(false);
    }
  };

  return <MistakesReviewView
    model={model} visibleRows={visibleRows} selectedRow={selectedRow}
    loading={loading} readError={readError} hasActiveTrack={hasActiveTrack}
    confirmRemoveUnavailable={confirmRemoveUnavailable} removingUnavailable={removingUnavailable}
    onSelectRow={(id) => { setConfirmRemoveUnavailable(false); setSelectedRowId((current) => current === id ? null : id); }}
    onConfirmRemoveChange={setConfirmRemoveUnavailable}
    onRemoveUnavailable={() => { void removeSelectedUnavailable(); }}
  />;
}
