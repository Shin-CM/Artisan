import { mockHandlers } from "@/lib/apiMock/mockHandlersRegistry";

export async function mockInvoke(
  cmd: string,
  args: Record<string, unknown> = {},
): Promise<unknown> {
  const fn = mockHandlers[cmd];
  if (!fn) {
    throw new Error(`[mock IPC] Commande non implémentée : ${cmd}`);
  }
  return await fn(args);
}
