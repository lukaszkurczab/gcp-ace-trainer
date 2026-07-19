/** Runtime-owned nondeterminism used by Algorithms application commands. */
export type AlgorithmsSessionRuntimePorts = Readonly<{
  wallClock: Readonly<{ now(): string }>;
  sessionIds: Readonly<{ next(modeId: string): string }>;
}>;

let ports: AlgorithmsSessionRuntimePorts | null = null;

export function installAlgorithmsSessionRuntimePorts(value: AlgorithmsSessionRuntimePorts): void {
  ports = value;
}

export function getAlgorithmsSessionRuntimePorts(): AlgorithmsSessionRuntimePorts {
  if (!ports) throw new Error("Algorithms session runtime is unavailable until application bootstrap has completed.");
  return ports;
}
