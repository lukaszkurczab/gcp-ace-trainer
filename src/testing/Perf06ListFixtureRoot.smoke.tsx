import { Profiler, useEffect, useMemo, useRef, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../i18n";
import { AppPreferencesPresentationProvider, deriveAppPreferencesPresentation } from "../preferences/appPreferencesContext";
import { ActivityView } from "../features/home/ActivityView";
import { MistakesReviewView } from "../features/review/MistakesReviewView";
import { ListPresentationMeasurement, type ListPresentationObserver } from "../infrastructure/diagnostics/listPresentationMeasurement";
import { createActivityPresentationFixture, createReviewPresentationFixture, isListFixtureConfiguration, type ListFixtureConfiguration } from "./perf06PresentationFixtures";
import type { ActivityItem } from "../features/home/tabs/activityModel";
import type { Perf06Entry } from "./perf06Entry";

const KEY = Symbol.for("patternly.perf06.list-measurement.v1");
const unavailable = () => { throw Error("presentation_fixture_action_unavailable"); };
const preferences = { ...deriveAppPreferencesPresentation("light", "en", "light", "en-US"), ready: false, setAppearance: async () => unavailable(), setLanguage: async () => unavailable() };

type Measurement = { configuration: ListFixtureConfiguration; startedAt: number; stoppedAt: number | null; mountedRows: number; peakMountedRows: number; rowMounts: number; rowUnmounts: number; commits: number; renderDurationMs: number; longTasks: number[]; frameGaps: number[]; truncated: boolean };
type ObserverConstructor = new (callback: (list: { getEntries(): { duration: number }[] }) => void) => { observe(options: { entryTypes: string[] }): void; disconnect(): void };

export default function Perf06ListFixtureRoot({ entry }: Readonly<{ entry: Perf06Entry }>) {
  if (entry.kind !== "fixture" || typeof __DEV__ === "undefined" || !__DEV__ || process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE !== "smoke") {
    return <View><Text>List measurement configuration unavailable.</Text></View>;
  }
  return <ListFixture />;
}

function ListFixture() {
  const [scenario, setScenario] = useState<Readonly<{ sequence: number; configuration: ListFixtureConfiguration }> | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filter, setFilter] = useState("all");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const active = useRef<Measurement | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const sequence = useRef(0);
  useEffect(() => {
    const runtime = globalThis as typeof globalThis & { [KEY]?: unknown; PerformanceObserver?: ObserverConstructor };
    if (runtime[KEY]) throw Error("presentation_measurement_busy");
    const api = Object.freeze({
      run(configuration: unknown) {
        if (!isListFixtureConfiguration(configuration)) throw Error("presentation_configuration_rejected");
        if (stopRef.current) throw Error("presentation_measurement_busy");
        const Constructor = runtime.PerformanceObserver;
        if (!Constructor) throw Error("presentation_observer_unavailable");
        const value: Measurement = { configuration: { ...configuration }, startedAt: performance.now(), stoppedAt: null, mountedRows: 0, peakMountedRows: 0, rowMounts: 0, rowUnmounts: 0, commits: 0, renderDurationMs: 0, longTasks: [], frameGaps: [], truncated: false };
        const observer = new Constructor((list) => { for (const task of list.getEntries()) { if (value.longTasks.length < 512) value.longTasks.push(task.duration); else value.truncated = true; } });
        let frameId = 0;
        let previous: number | null = null;
        const frame = (at: number) => { if (previous !== null) { if (value.frameGaps.length < 2400) value.frameGaps.push(at - previous); else value.truncated = true; } previous = at; frameId = requestAnimationFrame(frame); };
        const stop = () => { observer.disconnect(); cancelAnimationFrame(frameId); clearTimeout(timer); value.stoppedAt = performance.now(); stopRef.current = null; };
        const timer = setTimeout(stop, 20000);
        stopRef.current = stop;
        try {
          observer.observe({ entryTypes: ["longtask"] });
          frameId = requestAnimationFrame(frame);
        } catch {
          stop();
          throw Error("presentation_observer_unavailable");
        }
        active.current = value;
        setSelectedId(null); setFilter("all"); setFilterVisible(false); setConfirmRemove(false);
        setScenario({ sequence: ++sequence.current, configuration });
        return "started";
      },
      stop() { stopRef.current?.(); return "stopped"; },
      read() { return active.current ? { schema: "patternly.perf06.list-measurement.v1", ...active.current, frameSource: "JS requestAnimationFrame callbacks; not native frame presentation" } : { schema: "patternly.perf06.list-measurement.v1", status: "idle" }; },
    });
    runtime[KEY] = api;
    return () => { stopRef.current?.(); if (runtime[KEY] === api) delete runtime[KEY]; };
  }, []);

  const measurement = active.current;
  const observer = useMemo<ListPresentationObserver>(() => ({
    mounted() { if (measurement && measurement.stoppedAt === null) { measurement.rowMounts++; measurement.mountedRows++; measurement.peakMountedRows = Math.max(measurement.peakMountedRows, measurement.mountedRows); } },
    unmounted() { if (measurement && measurement.stoppedAt === null) { measurement.rowUnmounts++; measurement.mountedRows--; } },
  }), [measurement]);
  const activity = useMemo(() => scenario?.configuration.screen === "activity" ? createActivityPresentationFixture(scenario.configuration.size) : null, [scenario]);
  const review = useMemo(() => scenario && scenario.configuration.screen !== "activity" ? createReviewPresentationFixture(scenario.configuration.size, scenario.configuration.screen === "review-upcoming") : null, [scenario]);
  const selectedReview = review ? [...review.dueRows, ...review.upcomingRows, ...review.unavailableRows].find((row) => row.id === selectedId) ?? null : null;
  const onActivityPress = (item: ActivityItem) => setSelectedId((current) => current === item.id ? null : item.id);
  return <SafeAreaProvider style={{ flex: 1, backgroundColor: preferences.colors.background }}><AppPreferencesPresentationProvider value={preferences}>
    <Profiler id="perf06-list" onRender={(_id, _phase, duration) => { if (measurement && measurement.stoppedAt === null) { measurement.commits++; measurement.renderDurationMs += duration; } }}>
      <ListPresentationMeasurement observer={observer}>
        {activity ? <ActivityView key={scenario!.sequence} state={{ kind: "ready", model: filter === "all" || filter === "google-cloud-associate-cloud-engineer" ? activity : { items: [], groups: [] } }}
          filter={filter as Parameters<typeof ActivityView>[0]["filter"]} filterVisible={filterVisible} onFilterChange={setFilter} onFilterVisibleChange={setFilterVisible}
          selectedUnavailableSessionId={activity.items.find((item) => item.id === selectedId)?.kind === "unavailable" ? selectedId : null}
          selectedSessionDetailsId={activity.items.find((item) => item.id === selectedId)?.kind === "canonical" ? selectedId : null}
          onItemPress={onActivityPress} onBack={unavailable} onRetry={unavailable} onOpenPractice={unavailable} />
          : review ? <MistakesReviewView key={scenario!.sequence} model={review} visibleRows={review.dueRows.length > 0 ? review.dueRows : review.upcomingRows}
            selectedRow={selectedReview} loading={false} readError={null} hasActiveTrack confirmRemoveUnavailable={confirmRemove} removingUnavailable={false} onRetry={unavailable}
            onSelectRow={(id) => setSelectedId((current) => current === id ? null : id)} onConfirmRemoveChange={setConfirmRemove} onRemoveUnavailable={unavailable} />
            : <View><Text>PERF-06 isolated presentation environment. No persisted preferences or profile data loaded.</Text></View>}
      </ListPresentationMeasurement>
    </Profiler>
  </AppPreferencesPresentationProvider></SafeAreaProvider>;
}
