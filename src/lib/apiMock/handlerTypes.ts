/** Handler IPC mock : synchrone ou asynchrone. */
export type MockHandler = (
  args: Record<string, unknown>,
) => unknown | Promise<unknown>;
