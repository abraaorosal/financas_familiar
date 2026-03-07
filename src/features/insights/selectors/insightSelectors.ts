import type { Budget, Category, Transaction } from '@/domain/models';
import { buildInsights, getBudgetStatus } from '@/shared/utils/calculations';
import { getMonthBounds, isDateWithinInclusiveRange, shiftMonthKey } from '@/shared/utils/date';

export interface CategoryGrowth {
  categoriaId: string;
  categoriaNome: string;
  atualCentavos: number;
  anteriorCentavos: number;
  crescimentoPercentual: number;
}

export const getCategoryGrowth = (
  transactions: Transaction[],
  categories: Category[],
  monthKey: string
): CategoryGrowth[] => {
  const currentBounds = getMonthBounds(monthKey);
  const previousBounds = getMonthBounds(shiftMonthKey(monthKey, -1));

  const currentMap = new Map<string, number>();
  const previousMap = new Map<string, number>();

  transactions
    .filter((transaction) => transaction.tipo === 'gasto')
    .forEach((transaction) => {
      if (isDateWithinInclusiveRange(transaction.data, currentBounds.start, currentBounds.end)) {
        currentMap.set(transaction.categoriaId, (currentMap.get(transaction.categoriaId) ?? 0) + transaction.valorCentavos);
      }
      if (isDateWithinInclusiveRange(transaction.data, previousBounds.start, previousBounds.end)) {
        previousMap.set(transaction.categoriaId, (previousMap.get(transaction.categoriaId) ?? 0) + transaction.valorCentavos);
      }
    });

  return [...currentMap.entries()]
    .map(([categoriaId, atualCentavos]) => {
      const anteriorCentavos = previousMap.get(categoriaId) ?? 0;
      const crescimentoPercentual = anteriorCentavos === 0 ? 100 : ((atualCentavos - anteriorCentavos) / anteriorCentavos) * 100;
      return {
        categoriaId,
        categoriaNome: categories.find((category) => category.id === categoriaId)?.nome ?? 'Sem categoria',
        atualCentavos,
        anteriorCentavos,
        crescimentoPercentual,
      };
    })
    .sort((a, b) => b.crescimentoPercentual - a.crescimentoPercentual)
    .slice(0, 5);
};

export interface RecurringExpense {
  descricao: string;
  categoriaNome: string;
  ocorrencias: number;
  totalCentavos: number;
}

export const getRecurringExpenses = (
  transactions: Transaction[],
  categories: Category[],
  monthKey: string
): RecurringExpense[] => {
  const bounds = getMonthBounds(monthKey);

  const map = new Map<string, { ocorrencias: number; totalCentavos: number; categoriaId: string; descricao: string }>();

  transactions
    .filter((transaction) => transaction.tipo === 'gasto')
    .filter((transaction) => isDateWithinInclusiveRange(transaction.data, bounds.start, bounds.end))
    .forEach((transaction) => {
      const key = `${transaction.descricao.toLowerCase()}::${transaction.categoriaId}`;
      const current = map.get(key) ?? {
        ocorrencias: 0,
        totalCentavos: 0,
        categoriaId: transaction.categoriaId,
        descricao: transaction.descricao,
      };
      map.set(key, {
        ...current,
        ocorrencias: current.ocorrencias + 1,
        totalCentavos: current.totalCentavos + transaction.valorCentavos,
      });
    });

  return [...map.values()]
    .filter((item) => item.ocorrencias >= 2)
    .sort((a, b) => b.totalCentavos - a.totalCentavos)
    .map((item) => ({
      descricao: item.descricao,
      categoriaNome: categories.find((category) => category.id === item.categoriaId)?.nome ?? 'Sem categoria',
      ocorrencias: item.ocorrencias,
      totalCentavos: item.totalCentavos,
    }))
    .slice(0, 8);
};

export const getInsightBoardData = (
  transactions: Transaction[],
  categories: Category[],
  budgets: Budget[],
  monthKey: string
) => {
  return {
    growth: getCategoryGrowth(transactions, categories, monthKey),
    recurring: getRecurringExpenses(transactions, categories, monthKey),
    alerts: getBudgetStatus(budgets, transactions, categories, monthKey).filter((item) => item.percentualConsumido > 100),
    suggestions: buildInsights(transactions, categories, monthKey, budgets),
  };
};
