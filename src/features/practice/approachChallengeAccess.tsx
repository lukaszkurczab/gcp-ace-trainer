import { createContext, useContext, type ReactNode } from "react";

export type ApproachChallengeAccessState = "allowed" | "denied" | "unavailable";
export type ApproachChallengeAccessPort = Readonly<{
  readCurrentPremiumAccess(): ApproachChallengeAccessState;
}>;

const ApproachChallengeAccessContext = createContext<ApproachChallengeAccessPort | null>(null);

export function ApproachChallengeAccessProvider(props: Readonly<{ value: ApproachChallengeAccessPort; children: ReactNode }>) {
  return <ApproachChallengeAccessContext.Provider value={props.value}>{props.children}</ApproachChallengeAccessContext.Provider>;
}

export function useApproachChallengeAccess(): ApproachChallengeAccessPort {
  const value = useContext(ApproachChallengeAccessContext);
  if (!value) throw new Error("Approach Challenge access is unavailable outside its access boundary.");
  return value;
}
