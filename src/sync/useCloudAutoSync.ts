import { useEffect, useRef } from 'react';
import { cloudSyncService } from './cloudSyncService';
import { isSupabaseConfigured } from './supabaseClient';

const SYNC_INTERVAL_MS = 5 * 60 * 1000;

export const useCloudAutoSync = (enabled: boolean): void => {
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured) return;

    const runSync = async () => {
      if (isRunningRef.current || !navigator.onLine) return;

      isRunningRef.current = true;
      try {
        await cloudSyncService.syncNow();
      } catch {
        // Falhas de rede/autenticação não devem quebrar o app offline.
      } finally {
        isRunningRef.current = false;
      }
    };

    void runSync();

    const interval = window.setInterval(() => {
      void runSync();
    }, SYNC_INTERVAL_MS);

    const onOnline = () => {
      void runSync();
    };

    window.addEventListener('online', onOnline);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', onOnline);
    };
  }, [enabled]);
};
