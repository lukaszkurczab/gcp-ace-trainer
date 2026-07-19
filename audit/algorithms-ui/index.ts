import { registerRootComponent } from "expo";

import AlgorithmsAuditApp from "./App";

/** Registers the isolated audit host without touching the production entrypoint. */
registerRootComponent(AlgorithmsAuditApp);
