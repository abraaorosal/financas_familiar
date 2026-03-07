import {
  createTransaction,
  duplicateTransaction,
  removeTransaction,
  updateTransaction,
  upsertBudget,
  removeBudget,
} from '@/db/repository';

export const transactionService = {
  createTransaction,
  updateTransaction,
  duplicateTransaction,
  removeTransaction,
  upsertBudget,
  removeBudget,
};
