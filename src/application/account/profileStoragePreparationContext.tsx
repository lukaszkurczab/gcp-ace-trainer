import { createContext, useContext } from "react";

import type { PreparedProfileState } from "../../infrastructure/storage/mmkvClient";

export const PreparedProfileStorageContext = createContext<PreparedProfileState | null>(null);

export function usePreparedProfileStorage(): PreparedProfileState {
  const prepared = useContext(PreparedProfileStorageContext);
  if (!prepared) throw new Error("Prepared profile metadata must be read within ProfileStoragePreparationGate.");
  return prepared;
}
