import { ipc } from "@/lib/apiCore";

export type LocalApiStatus = {
  enabled: boolean;
  port: number;
  suggestedLanIp: string;
  apiBaseUrl: string;
  operatorPasswordSet: boolean;
};

export type QrPairingPayload = {
  apiUrl: string;
  pairingToken: string;
  expiresIn: number;
};

export type LocalApiSessionRow = {
  id: string;
  workspaceId: string;
  label: string | null;
  createdAt: string;
  revokedAt: string | null;
};

export async function localApiGetStatus(): Promise<LocalApiStatus> {
  return ipc("local_api_get_status");
}

export async function localApiSetEnabled(enabled: boolean): Promise<void> {
  return ipc("local_api_set_enabled", { enabled });
}

export async function localApiSetPort(port: number): Promise<void> {
  return ipc("local_api_set_port", { port });
}

export async function localApiStartPairing(
  workspaceId: string,
): Promise<QrPairingPayload> {
  return ipc("local_api_start_pairing", { payload: { workspaceId } });
}

export async function localApiListSessions(
  workspaceId: string | null,
): Promise<LocalApiSessionRow[]> {
  return ipc("local_api_list_sessions", {
    payload: { workspaceId: workspaceId ?? null },
  });
}

export async function localApiRevokeSession(sessionId: string): Promise<void> {
  return ipc("local_api_revoke_session", { sessionId });
}

export async function localApiSetOperatorPassword(
  password: string,
): Promise<void> {
  return ipc("local_api_set_operator_password", { password });
}
