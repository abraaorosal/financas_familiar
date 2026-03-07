import type { Budget, Category, DashboardFilters, Transaction } from '@/domain/models';
import { buildInsights, getBudgetStatus, getDashboardSummary, getDailyBalanceSeries } from '@/shared/utils/calculations';

export const buildDashboardData = (
  transactions: Transaction[],
  categories: Category[],
  budgets: Budget[],
  filters: DashboardFilters
) => {
  const summary = getDashboardSummary(transactions, categories, filters);
  const dailyBalance = getDailyBalanceSeries(transactions, filters.mes, 0, filters.pessoaId);
  const budgetStatus = getBudgetStatus(budgets, transactions, categories, filters.mes);
  const quickInsights = buildInsights(transactions, categories, filters.mes, budgets).slice(0, 3);

  return {
    summary,
    dailyBalance,
    budgetStatus,
    quickInsights,
  };
};
