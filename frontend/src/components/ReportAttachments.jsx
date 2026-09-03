import { useEffect, useState } from "react";
import { reportsApi } from "../api/reports";
import { ApiError } from "../api/client";
import { formatDateTime } from "../utils/formatters";

/**
 * Fetches each attachment's file as an authenticated blob (see api/client.js
 * getBlobUrl) rather than linking directly to the API — the endpoint requires
 * a health worker's JWT, which a plain <img src> can't send.
 */
export default function ReportAttachments({ reportId }) {
  const [attachments, setAttachments] = useState(null);
  const [previews, setPreviews] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const objectUrls = [];

    async function load() {
      try {
        const res = await reportsApi.listAttachments(reportId);
        if (cancelled) return;
        setAttachments(res.data);

        for (const attachment of res.data) {
          if (!attachment.file_type.startsWith("image/")) continue;
          try {
            const url = await reportsApi.getAttachmentFileUrl(reportId, attachment.id);
            if (cancelled) {
              URL.revokeObjectURL(url);
              return;
            }
            objectUrls.push(url);
            setPreviews((prev) => ({ ...prev, [attachment.id]: url }));
          } catch {
            // A single failed preview shouldn't block the rest of the list.
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Could not load attachments.");
      }
    }

    load();
    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [reportId]);

  const openFile = async (attachment) => {
    try {
      const url = previews[attachment.id] || (await reportsApi.getAttachmentFileUrl(reportId, attachment.id));
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setError("Could not open that file.");
    }
  };

  if (error) return <p className="field-hint" style={{ color: "var(--red-700, #b3261e)" }}>{error}</p>;
  if (!attachments) return <p className="field-hint">Loading attachments…</p>;
  if (attachments.length === 0) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <p className="field-label" style={{ marginBottom: 10 }}>
        Attachments ({attachments.length})
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {attachments.map((attachment) => (
          <button
            key={attachment.id}
            type="button"
            onClick={() => openFile(attachment)}
            className="glass"
            style={{
              width: 108,
              padding: 0,
              overflow: "hidden",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
            }}
            title={`Uploaded ${formatDateTime(attachment.uploaded_at)}`}
          >
            {previews[attachment.id] ? (
              <img
                src={previews[attachment.id]}
                alt="Report attachment"
                style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: 80,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  color: "#7c8aa5",
                }}
              >
                {attachment.file_type === "application/pdf" ? "PDF" : "File"}
              </div>
            )}
            <span
              style={{
                display: "block",
                fontSize: "0.7rem",
                color: "#7c8aa5",
                padding: "4px 8px",
              }}
            >
              {Math.round(attachment.file_size_bytes / 1024)} KB
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
