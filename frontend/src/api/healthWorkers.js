import { apiClient } from "./client";

export const healthWorkersApi = {
  list: (query) => apiClient.get("/health-workers", { auth: true, query }),
  me: () => apiClient.get("/health-workers/me", { auth: true }),
};
