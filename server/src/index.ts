import { createServer, type RequestListener } from "node:http";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { AccountDataService, type AccountDatasetStore } from "./accountService.js";
import type { FirebaseIdTokenVerifier } from "./authentication.js";
import { loadServerEnvironment, type ServerEnvironment } from "./environment.js";
import { initializeFirebaseAdminAccountRuntime } from "./firebaseAdapters.js";
import { createAccountHttpHandler } from "./http.js";

export interface ListeningHttpServer {
  listen(port: number, host: string): unknown;
}

export type ServerStartupDependencies = Readonly<{
  createFirebaseRuntime: (projectId: string) => Readonly<{
    appCheckVerifier: import("./authentication.js").FirebaseAppCheckTokenVerifier;
    lifecycle: import("./accountLifecycle.js").AccountLifecyclePort;
    store: AccountDatasetStore;
    verifier: FirebaseIdTokenVerifier;
  }>;
  createHttpServer: (handler: RequestListener) => ListeningHttpServer;
  loadEnvironment: (source: NodeJS.ProcessEnv) => ServerEnvironment;
  nowSeconds: () => number;
}>;

const serverStartupDependencies: ServerStartupDependencies = {
  createFirebaseRuntime: initializeFirebaseAdminAccountRuntime,
  createHttpServer: (handler) => createServer(handler),
  loadEnvironment: loadServerEnvironment,
  nowSeconds: () => Math.floor(Date.now() / 1_000),
};

export const startServer = (
  source: NodeJS.ProcessEnv = process.env,
  dependencies: ServerStartupDependencies = serverStartupDependencies,
): ListeningHttpServer => {
  const environment = dependencies.loadEnvironment(source);
  const firebase = dependencies.createFirebaseRuntime(environment.firebaseProjectId);
  const service = new AccountDataService(firebase.store);
  const server = dependencies.createHttpServer(createAccountHttpHandler({
    appCheckVerifier: firebase.appCheckVerifier,
    expectedProjectId: environment.firebaseProjectId,
    expectedAppCheckAppIds: environment.appCheckAppIds,
    lifecycle: firebase.lifecycle,
    nowSeconds: dependencies.nowSeconds,
    service,
    verifier: firebase.verifier,
  }));
  server.listen(environment.port, "0.0.0.0");
  return server;
};

const invokedPath = process.argv[1];
if (invokedPath !== undefined && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  startServer();
}
