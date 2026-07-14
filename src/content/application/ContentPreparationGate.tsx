import { useEffect, useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import { EmptyState, Screen } from "../../components";
import type { ContentError } from "../errors";
import { AsyncStorageContentCache } from "../cache";
import { HttpContentSource } from "../source";
import { loadTrackContent } from "./loadTrackContent";

export type ContentPreparationState =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "unavailable"; error: ContentError }
  | { kind: "invalid"; error: ContentError };

export function ContentPreparationGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContentPreparationState>({ kind: "loading" });
  useEffect(() => { let live = true; const source = new HttpContentSource(); const cache = new AsyncStorageContentCache(); void Promise.all([loadTrackContent(source, cache, "algorithms"), loadTrackContent(source, cache, "cloud-certification")]).then(() => { if (live) setState({ kind: "ready" }); }).catch((error: unknown) => { if (!live) return; const contentError = error instanceof Error ? Object.assign(error, { code: (error as { code?: string }).code ?? "invalid" }) as ContentError : new Error("Content preparation failed.") as ContentError; setState({ kind: contentError.code === "validation" || contentError.code === "checksum" ? "invalid" : "unavailable", error: contentError }); }); return () => { live = false; }; }, []);
  if (state.kind === "ready") return <>{children}</>;
  if (state.kind === "loading") return <Screen><View><Text>Preparing content…</Text></View></Screen>;
  return <Screen><EmptyState title="Content unavailable" description={state.error.message} /></Screen>;
}
