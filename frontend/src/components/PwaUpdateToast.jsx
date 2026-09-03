import { useEffect, useState } from "react";
import { registerSW } from "virtual:pwa-register";

/**
 * Registers the service worker once on app load and surfaces two states
 * the person may care about: a new version is ready to apply, or the app
 * has finished caching itself and will now work offline.
 */
export default function PwaUpdateToast() {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateFn, setUpdateFn] = useState(null);

  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        setNeedsRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
        setTimeout(() => setOfflineReady(false), 5000);
      },
    });
    setUpdateFn(() => update);
  }, []);

  if (!needsRefresh && !offlineReady) return null;

  return (
    <div className="pwa-toast glass-strong" role="status">
      {needsRefresh ? (
        <>
          <span>A new version of CareLink is ready.</span>
          <button className="btn btn-primary btn-sm" onClick={() => updateFn && updateFn(true)}>
            Reload to update
          </button>
        </>
      ) : (
        <span>CareLink is ready to work offline.</span>
      )}
    </div>
  );
}
