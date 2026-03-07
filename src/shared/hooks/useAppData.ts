import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';

export const usePersons = () => useLiveQuery(() => db.persons.toArray(), [], []);
export const useCategories = () => useLiveQuery(() => db.categories.toArray(), [], []);
export const useAccounts = () => useLiveQuery(() => db.accounts.toArray(), [], []);
export const useCards = () => useLiveQuery(() => db.cards.toArray(), [], []);
export const useTransactions = () =>
  useLiveQuery(
    () =>
      db.transactions
        .orderBy('data')
        .reverse()
        .toArray(),
    [],
    []
  );
export const useBudgets = () => useLiveQuery(() => db.budgets.toArray(), [], []);
export const useMeta = () => useLiveQuery(() => db.meta.toArray(), [], []);
