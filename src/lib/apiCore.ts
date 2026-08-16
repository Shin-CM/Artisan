import { invoke as tauriInvoke, isTauri } from "@tauri-apps/api/core";
import { mockInvoke } from "@/lib/apiMock";

export function ipc<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri()) {
    return mockInvoke(cmd, args ?? {}) as Promise<T>;
  }
  return tauriInvoke(cmd, args);
}
