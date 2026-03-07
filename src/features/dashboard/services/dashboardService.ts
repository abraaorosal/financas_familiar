import type { Budget, Category, DashboardFilters, Transaction } from '@/domain/models';
import { buildDashboardData } from '../selectors/dashboardSelectors';

export const getDashboardViewModel = (
  transactions: Transaction[],
  categories: Category[],
  budgets: Budget[],
  filters: DashboardFilters
) => buildDashboardData(transactions, categories, budgets, filters);
