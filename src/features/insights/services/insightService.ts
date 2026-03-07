import type { Budget, Category, Transaction } from '@/domain/models';
import { getInsightBoardData } from '../selectors/insightSelectors';

export const insightService = {
  getInsightBoardData: (transactions: Transaction[], categories: Category[], budgets: Budget[], month: string) =>
    getInsightBoardData(transactions, categories, budgets, month),
};
