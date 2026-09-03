import { useEffect, useState } from "react";
import { reportsApi } from "../api/reports";
import { flushQueuedReports, queuedReportCount } from "../utils/offlineQueue";
import { useLanguage } from "../i18n/LanguageContext";

export default function OfflineBanner() {
  const { t } = useLanguage();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [queuedCount, setQueuedCount] = useState(queuedReportCount());
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(0);

  useEffect(() => {
    const onQueueChanged = (event) => setQueuedCount(event.detail.count);
    window.addEventListener("carelink:queue-changed", onQueueChanged);
    return () => window.removeEventListener("carelink:queue-changed", onQueueChanged);
  }, []);

  useEffect(() => {
    const sync = async () => {
      if (queuedReportCount() === 0) return;
      setIsSyncing(true);
      try {
        const { syncedCount } = await flushQueuedReports(reportsApi.submit);
        if (syncedCount > 0) {
          setJustSynced(syncedCount);
          setTimeout(() => setJustSynced(0), 6000);
        }
      } finally {
        setIsSyncing(false);
      }
    };

    const goOnline = () => {
      setIsOffline(false);
      sync();
    };
    const goOffline = () => setIsOffline(true);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    if (navigator.onLine) sync(); // also try once on load, in case reports were queued last session
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!isOffline && queuedCount === 0 && !justSynced) return null;

  return (
    <div className="offline-banner" role="status">
      {isOffline &&
        (queuedCount > 0
          ? t("offline.offlineWithQueue", { count: queuedCount })
          : t("offline.offlineOnly"))}
      {!isOffline && queuedCount > 0 && (isSyncing ? t("offline.syncing") : t("offline.waiting", { count: queuedCount }))}
      {!isOffline && queuedCount === 0 && justSynced > 0 && t("offline.synced", { count: justSynced })}
    </div>
  );
}
