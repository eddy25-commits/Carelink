import { apiClient } from "./client";

export const incidentsApi = {
  list: (query) => apiClient.get("/incidents", { auth: true, query }),
  getById: (id) => apiClient.get(`/incidents/${id}`, { auth: true }),
  updateStatus: (id, status) => apiClient.patch(`/incidents/${id}/status`, { status }, { auth: true }),
  runClusteringNow: () => apiClient.post("/incidents/run-clustering", {}, { auth: true }),
};
