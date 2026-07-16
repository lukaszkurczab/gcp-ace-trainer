import { useEffect, useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import { EmptyState, Screen } from "../../components";
import { bootstrapApplication } from "../../application/bootstrap";
import { validateBundledContent } from "./validateBundledContent";

export type ContentPreparationState =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "blocking"; reason: string };

export function ContentPreparationGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ContentPreparationState>({ kind: "loading" });
  useEffect(() => {
    let live = true;
    void bootstrapApplication(validateBundledContent, async () => undefined).then((result) => {
      if (!live) return;
      setState(result.kind === "ready" ? { kind: "ready" } : { kind: "blocking", reason: result.reason });
    });
    return () => { live = false; };
  }, []);
  if (state.kind === "ready") return <>{children}</>;
  if (state.kind === "loading") return <Screen><View><Text>Preparing content…</Text></View></Screen>;
  return <Screen><EmptyState title="Application unavailable" description={state.reason} /></Screen>;
}
