import { createContext, useContext, useLayoutEffect, type ReactNode } from "react";

export type ListPresentationObserver = Readonly<{ mounted(): void; unmounted(): void }>;
const Context = createContext<ListPresentationObserver | null>(null);

export function ListPresentationMeasurement({ children, observer }: Readonly<{ children: ReactNode; observer: ListPresentationObserver }>) {
  return <Context.Provider value={observer}>{children}</Context.Provider>;
}

/** Inert outside the isolated measurement provider; no IDs or data are collected. */
export function useListPresentationRow() {
  const observer = useContext(Context);
  useLayoutEffect(() => {
    if (!observer) return;
    observer.mounted();
    return () => observer.unmounted();
  }, [observer]);
}
