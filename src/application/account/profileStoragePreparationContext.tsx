import { createContext, useContext } from "react";

import type { PreparedProfileState } from "../../infrastructure/storage/mmkvClient";
import type { LocalLogoutControl, LocalLogoutControlSnapshot } from "../../infrastructure/storage/localLogoutControl";

export type ProfileStoragePreparationContextValue = Readonly<{
  profile: PreparedProfileState;
  logoutControl: LocalLogoutControl;
  logoutControlSnapshot: LocalLogoutControlSnapshot;
}>;

export const PreparedProfileStorageContext = createContext<ProfileStoragePreparationContextValue | null>(null);

export function useProfileStoragePreparation(): ProfileStoragePreparationContextValue {
  const prepared = useContext(PreparedProfileStorageContext);
  if (!prepared) throw new Error("Prepared profile metadata must be read within ProfileStoragePreparationGate.");
  return prepared;
}

export function usePreparedProfileStorage(): PreparedProfileState {
  return useProfileStoragePreparation().profile;
}
