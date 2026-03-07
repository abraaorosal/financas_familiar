import { useCallback, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { cloudSyncService } from './cloudSyncService';
import { isSupabaseConfigured } from './supabaseClient';
import { db } from '@/db/db';

const SYNC_INTERVAL_MS = 5 * 60 * 1000;
const CHANGE_SYNC_DEBOUNCE_MS = 2500;

export const useCloudAutoSync = (enabled: boolean, isAuthenticated: boolean): void => {
  const isRunningRef = useRef(false);
  const hasSeenInitialFingerprintRef = useRef(false);

  const localDataFingerprint = useLiveQuery(
    async () => {
      if (!enabled || !isSupabaseConfigured || !isAuthenticated) {
        return '';
      }

      const [persons, categories, accounts, cards, transactions, budgets] = await Promise.all([
        db.persons.orderBy('id').toArray(),
        db.categories.orderBy('id').toArray(),
        db.accounts.orderBy('id').toArray(),
        db.cards.orderBy('id').toArray(),
        db.transactions.orderBy('id').toArray(),
        db.budgets.orderBy('id').toArray(),
      ]);

      return JSON.stringify({
        persons,
        categories,
        accounts,
        cards,
        transactions,
        budgets,
      });
    },
    [enabled, isAuthenticated],
    ''
  );

  const runSync = useCallback(async () => {
    if (!enabled || !isSupabaseConfigured || !isAuthenticated || !navigator.onLine || isRunningRef.current) {
      return;
    }

    isRunningRef.current = true;

    try {
      await cloudSyncService.syncNow();
    } catch {
      // Falhas de rede/autenticação não devem quebrar o app offline.
    } finally {
      isRunningRef.current = false;
    }
  }, [enabled, isAuthenticated]);

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured || !isAuthenticated) return;

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
  }, [enabled, isAuthenticated, runSync]);

  useEffect(() => {
    if (!enabled || !isSupabaseConfigured || !isAuthenticated || !localDataFingerprint) {
      hasSeenInitialFingerprintRef.current = false;
      return;
    }

    if (!hasSeenInitialFingerprintRef.current) {
      hasSeenInitialFingerprintRef.current = true;
      return;
    }

    const timeout = window.setTimeout(() => {
      void runSync();
    }, CHANGE_SYNC_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [enabled, isAuthenticated, localDataFingerprint, runSync]);
};
