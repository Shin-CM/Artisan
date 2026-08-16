import type { MockHandler } from "@/lib/apiMock/handlerTypes";

export const localApiHandlers: Record<string, MockHandler> = {
  local_api_get_status: async () => ({
    enabled: false,
    port: 3847,
    suggestedLanIp: "127.0.0.1",
    apiBaseUrl: "http://127.0.0.1:3847",
    operatorPasswordSet: false,
  }),
  local_api_set_enabled: async () => undefined,
  local_api_set_port: async () => undefined,
  local_api_start_pairing: async (_args: Record<string, unknown>) => ({
    apiUrl: "http://127.0.0.1:3847",
    pairingToken: "mock_pairing_token",
    expiresIn: 300,
  }),
  local_api_list_sessions: async () => [],
  local_api_revoke_session: async () => undefined,
  local_api_set_operator_password: async () => undefined,
};
