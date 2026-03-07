import { eachDayOfInterval, format, parseISO } from 'date-fns';
import type { Budget, Category, DashboardFilters, Transaction } from '@/domain/models';
import { getMonthBounds, isDateWithinInclusiveRange, shiftMonthKey } from './date';

const filterTransactions = (transactions: Transaction[], filters: DashboardFilters): Transaction[] => {
  const { start, end } = getMonthBounds(filters.mes);

  return transactions.filter((transaction) => {
    if (!isDateWithinInclusiveRange(transaction.data, start, end)) return false;
    if (filters.pessoaId !== 'todas' && transaction.pessoaId !== filters.pessoaId) return false;
    if (filters.natureza !== 'todas' && transaction.natureza !== filters.natureza) return false;
    if (filters.formaPagamento !== 'todas' && transaction.formaPagamento !== filters.formaPagamento) return false;
    return true;
  });
};

export interface DashboardSummary {
  ganhosCentavos: number;
  gastosCentavos: number;
  saldoCentavos: number;
  fixoPercentual: number;
  variavelPercentual: number;
  topCategorias: Array<{ categoria: string; valorCentavos: number; cor?: string }>;
  comparativoGastosPercentual: number;
}

export const getDashboardSummary = (
  transactions: Transaction[],
  categories: Category[],
  filters: DashboardFilters
): DashboardSummary => {
  const monthTransactions = filterTransactions(transactions, filters);
  const previousMonthFilters: DashboardFilters = {
    ...filters,
    mes: shiftMonthKey(filters.mes, -1),
  };
  const previousMonthTransactions = filterTransactions(transactions, previousMonthFilters);

  const ganhosCentavos = monthTransactions
    .filter((transaction) => transaction.tipo === 'ganho')
    .reduce((acc, transaction) => acc + transaction.valorCentavos, 0);
  const gastosCentavos = monthTransactions
    .filter((transaction) => transaction.tipo === 'gasto')
    .reduce((acc, transaction) => acc + transaction.valorCentavos, 0);
  const saldoCentavos = ganhosCentavos - gastosCentavos;

  const fixoCentavos = monthTransactions
    .filter((transaction) => transaction.natureza === 'fixa')
    .reduce((acc, transaction) => acc + transaction.valorCentavos, 0);
  const variavelCentavos = monthTransactions
    .filter((transaction) => transaction.natureza === 'variavel')
    .reduce((acc, transaction) => acc + transaction.valorCentavos, 0);
  const naturezaTotal = fixoCentavos + variavelCentavos;

  const expensesByCategory = new Map<string, number>();

  monthTransactions
    .filter((transaction) => transaction.tipo === 'gasto')
    .forEach((transaction) => {
      expensesByCategory.set(
        transaction.categoriaId,
        (expensesByCategory.get(transaction.categoriaId) ?? 0) + transaction.valorCentavos
      );
    });

  const topCategorias = [...expensesByCategory.entries()]
    .map(([categoriaId, valorCentavos]) => {
      const category = categories.find((item) => item.id === categoriaId);
      return {
        categoria: category?.nome ?? 'Sem categoria',
        valorCentavos,
        cor: category?.cor,
      };
    })
    .sort((a, b) => b.valorCentavos - a.valorCentavos)
    .slice(0, 5);

  const previousExpenses = previousMonthTransactions
    .filter((transaction) => transaction.tipo === 'gasto')
    .reduce((acc, transaction) => acc + transaction.valorCentavos, 0);

  const comparativoGastosPercentual =
    previousExpenses === 0 ? (gastosCentavos > 0 ? 100 : 0) : ((gastosCentavos - previousExpenses) / previousExpenses) * 100;

  return {
    ganhosCentavos,
    gastosCentavos,
    saldoCentavos,
    fixoPercentual: naturezaTotal === 0 ? 0 : (fixoCentavos / naturezaTotal) * 100,
    variavelPercentual: naturezaTotal === 0 ? 0 : (variavelCentavos / naturezaTotal) * 100,
    topCategorias,
    comparativoGastosPercentual,
  };
};

export interface DailyBalancePoint {
  data: string;
  saldoCentavos: number;
}

export const getDailyBalanceSeries = (
  transactions: Transaction[],
  monthKey: string,
  openingBalanceCentavos = 0,
  personFilter: string | 'todas' = 'todas'
): DailyBalancePoint[] => {
  const { start, end } = getMonthBounds(monthKey);

  const relevant = transactions.filter((transaction) => {
    if (!isDateWithinInclusiveRange(transaction.data, start, end)) return false;
    if (personFilter !== 'todas' && transaction.pessoaId !== personFilter) return false;
    return true;
  });

  const byDate = new Map<string, number>();

  relevant.forEach((transaction) => {
    const day = format(parseISO(transaction.data), 'yyyy-MM-dd');
    const signedValue = transaction.tipo === 'ganho' ? transaction.valorCentavos : -transaction.valorCentavos;
    byDate.set(day, (byDate.get(day) ?? 0) + signedValue);
  });

  const days = eachDayOfInterval({ start, end });
  let currentBalance = openingBalanceCentavos;

  return days.map((day) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    currentBalance += byDate.get(dayKey) ?? 0;
    return {
      data: format(day, 'dd/MM'),
      saldoCentavos: currentBalance,
    };
  });
};

export interface BudgetStatus {
  categoriaId: string;
  categoriaNome: string;
  limiteCentavos: number;
  realizadoCentavos: number;
  percentualConsumido: number;
}

export const getBudgetStatus = (
  budgets: Budget[],
  transactions: Transaction[],
  categories: Category[],
  monthKey: string
): BudgetStatus[] => {
  const { start, end } = getMonthBounds(monthKey);
  return budgets
    .filter((budget) => budget.mes === monthKey)
    .map((budget) => {
      const spent = transactions
        .filter((transaction) => transaction.tipo === 'gasto' && transaction.categoriaId === budget.categoriaId)
        .filter((transaction) => isDateWithinInclusiveRange(transaction.data, start, end))
        .reduce((acc, transaction) => acc + transaction.valorCentavos, 0);

      const category = categories.find((item) => item.id === budget.categoriaId);

      return {
        categoriaId: budget.categoriaId,
        categoriaNome: category?.nome ?? 'Sem categoria',
        limiteCentavos: budget.limiteCentavos,
        realizadoCentavos: spent,
        percentualConsumido: budget.limiteCentavos === 0 ? 0 : (spent / budget.limiteCentavos) * 100,
      };
    })
    .sort((a, b) => b.percentualConsumido - a.percentualConsumido);
};

export interface InsightSuggestion {
  type: 'increase' | 'recurring' | 'alert' | 'suggestion';
  title: string;
  description: string;
}

export const buildInsights = (
  transactions: Transaction[],
  categories: Category[],
  monthKey: string,
  budgets: Budget[]
): InsightSuggestion[] => {
  const currentBounds = getMonthBounds(monthKey);
  const previousBounds = getMonthBounds(shiftMonthKey(monthKey, -1));

  const currentExpenses = transactions.filter(
    (transaction) =>
      transaction.tipo === 'gasto' &&
      isDateWithinInclusiveRange(transaction.data, currentBounds.start, currentBounds.end)
  );
  const previousExpenses = transactions.filter(
    (transaction) =>
      transaction.tipo === 'gasto' &&
      isDateWithinInclusiveRange(transaction.data, previousBounds.start, previousBounds.end)
  );

  const mapCurrent = new Map<string, number>();
  const mapPrevious = new Map<string, number>();

  currentExpenses.forEach((transaction) => {
    mapCurrent.set(transaction.categoriaId, (mapCurrent.get(transaction.categoriaId) ?? 0) + transaction.valorCentavos);
  });

  previousExpenses.forEach((transaction) => {
    mapPrevious.set(transaction.categoriaId, (mapPrevious.get(transaction.categoriaId) ?? 0) + transaction.valorCentavos);
  });

  const growths = [...mapCurrent.entries()]
    .map(([categoryId, currentValue]) => {
      const previousValue = mapPrevious.get(categoryId) ?? 0;
      const delta = currentValue - previousValue;
      const percent = previousValue === 0 ? 100 : (delta / previousValue) * 100;
      return { categoryId, delta, percent };
    })
    .filter((item) => item.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3)
    .map((item) => {
      const category = categories.find((cat) => cat.id === item.categoryId);
      return {
        type: 'increase' as const,
        title: `${category?.nome ?? 'Categoria'} subiu ${item.percent.toFixed(1)}%`,
        description: 'Revise despesas recentes nessa categoria para reduzir excesso no próximo ciclo.',
      };
    });

  const recurringCandidates = new Map<string, number>();
  currentExpenses.forEach((transaction) => {
    const key = `${transaction.descricao.toLowerCase()}::${transaction.categoriaId}`;
    recurringCandidates.set(key, (recurringCandidates.get(key) ?? 0) + 1);
  });

  const recurringInsights = [...recurringCandidates.entries()]
    .filter(([, frequency]) => frequency >= 2)
    .slice(0, 3)
    .map(([key, frequency]) => {
      const [description] = key.split('::');
      return {
        type: 'recurring' as const,
        title: `Despesa recorrente detectada (${frequency}x)`,
        description: `"${description}" apareceu várias vezes neste mês. Verifique se há opção mais econômica.`,
      };
    });

  const budgetStatus = getBudgetStatus(budgets, transactions, categories, monthKey);
  const alerts = budgetStatus
    .filter((item) => item.percentualConsumido > 100)
    .slice(0, 3)
    .map((item) => ({
      type: 'alert' as const,
      title: `Meta estourada em ${item.categoriaNome}`,
      description: `${item.percentualConsumido.toFixed(0)}% consumido da meta mensal.`,
    }));

  const defaultSuggestions: InsightSuggestion[] = [
    {
      type: 'suggestion',
      title: 'Negocie contratos fixos',
      description: 'Revisar internet, telefone e moradia costuma gerar economia relevante no médio prazo.',
    },
    {
      type: 'suggestion',
      title: 'Concentre assinaturas',
      description: 'Cancele serviços com baixa utilização e mantenha só os essenciais.',
    },
  ];

  return [...growths, ...recurringInsights, ...alerts, ...defaultSuggestions].slice(0, 10);
};
