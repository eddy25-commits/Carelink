import { apiClient } from "./client";

export const triageApi = {
  queue: (query) => apiClient.get("/triage/queue", { auth: true, query }),
  history: (reportId) => apiClient.get(`/triage/${reportId}/history`, { auth: true }),
  triage: (reportId, notes) => apiClient.post(`/triage/${reportId}/triage`, { notes }, { auth: true }),
  assign: (reportId, assigneeId, notes) =>
    apiClient.post(`/triage/${reportId}/assign`, { assigneeId, notes }, { auth: true }),
  escalate: (reportId, notes) => apiClient.post(`/triage/${reportId}/escalate`, { notes }, { auth: true }),
  resolve: (reportId, notes) => apiClient.post(`/triage/${reportId}/resolve`, { notes }, { auth: true }),
  close: (reportId, notes) => apiClient.post(`/triage/${reportId}/close`, { notes }, { auth: true }),
  reopen: (reportId, notes) => apiClient.post(`/triage/${reportId}/reopen`, { notes }, { auth: true }),
  comment: (reportId, notes) => apiClient.post(`/triage/${reportId}/comment`, { notes }, { auth: true }),
};
