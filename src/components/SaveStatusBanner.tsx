import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { forceSaveToServer, getServerSaveRejection } from '../db/sqlite';

export const SaveStatusBanner: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(() => Boolean(getServerSaveRejection()));
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const onRejected = () => {
      setFailed(false);
      setVisible(true);
    };
    const onAccepted = () => setVisible(false);
    window.addEventListener('djital:save-rejected', onRejected);
    window.addEventListener('djital:save-accepted', onAccepted);
    return () => {
      window.removeEventListener('djital:save-rejected', onRejected);
      window.removeEventListener('djital:save-accepted', onAccepted);
    };
  }, []);

  if (!visible) return null;

  const handleForceSave = async () => {
    setBusy(true);
    setFailed(false);
    const result = await forceSaveToServer();
    setBusy(false);
    if (result.ok) {
      setVisible(false);
    } else {
      setFailed(true);
    }
  };

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 z-[9999] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-xl border border-amber-500/40 bg-neutral-900/95 p-4 text-sm text-neutral-100 shadow-2xl backdrop-blur"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden="true" />
        <div className="flex-1">
          <p>Your latest changes were NOT saved to the server. Retry the server save before leaving this page.</p>
          {failed && <p className="mt-1 text-red-400">Force save failed. Please try again.</p>}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleForceSave}
              disabled={busy}
              className="rounded-lg bg-amber-500 px-3 py-1.5 font-semibold text-neutral-950 hover:bg-amber-400 disabled:opacity-60"
            >
              {busy ? 'Saving...' : 'Force save'}
            </button>
            <button
              type="button"
              onClick={() => setVisible(false)}
              disabled={busy}
              className="rounded-lg border border-neutral-600 px-3 py-1.5 text-neutral-200 hover:bg-neutral-800 disabled:opacity-60"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
