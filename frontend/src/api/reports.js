import { apiClient } from "./client";

export const reportsApi = {
  submit: (payload) => apiClient.post("/reports", payload),
  getByToken: (token) => apiClient.get(`/reports/status/${encodeURIComponent(token)}`),
  getById: (id) => apiClient.get(`/reports/${id}`, { auth: true }),
  list: (query) => apiClient.get("/reports", { auth: true, query }),

  // Attachments — uploading is public (identified by the report id a reporter was just
  // given); listing/viewing requires a health worker's auth.
  uploadAttachments: (reportId, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return apiClient.postForm(`/reports/${reportId}/attachments`, formData);
  },
  listAttachments: (reportId) => apiClient.get(`/reports/${reportId}/attachments`, { auth: true }),
  getAttachmentFileUrl: (reportId, attachmentId) =>
    apiClient.getBlobUrl(`/reports/${reportId}/attachments/${attachmentId}/file`),
};
