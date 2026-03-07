import { parseISO } from 'date-fns';
import type { Transaction, TransactionFilters } from '@/domain/models';
import { getMonthBounds, isDateWithinInclusiveRange } from '@/shared/utils/date';

export const applyTransactionFilters = (
  transactions: Transaction[],
  filters: TransactionFilters
): Transaction[] => {
  const monthBounds = filters.mes ? getMonthBounds(filters.mes) : undefined;
  const usingCustomDateRange = Boolean(filters.dataInicio || filters.dataFim);

  const filtered = transactions.filter((transaction) => {
    if (
      filters.mes &&
      monthBounds &&
      !usingCustomDateRange &&
      !isDateWithinInclusiveRange(transaction.data, monthBounds.start, monthBounds.end)
    ) {
      return false;
    }

    if (filters.dataInicio && parseISO(transaction.data) < parseISO(filters.dataInicio)) {
      return false;
    }

    if (filters.dataFim && parseISO(transaction.data) > parseISO(filters.dataFim)) {
      return false;
    }

    if (filters.tipo && filters.tipo !== 'todos' && transaction.tipo !== filters.tipo) {
      return false;
    }

    if (filters.pessoaId && filters.pessoaId !== 'todas' && transaction.pessoaId !== filters.pessoaId) {
      return false;
    }

    if (filters.categoriaId && filters.categoriaId !== 'todas' && transaction.categoriaId !== filters.categoriaId) {
      return false;
    }

    if (filters.formaPagamento && filters.formaPagamento !== 'todas' && transaction.formaPagamento !== filters.formaPagamento) {
      return false;
    }

    if (filters.accountId && filters.accountId !== 'todas' && transaction.accountId !== filters.accountId) {
      return false;
    }

    if (filters.cardId && filters.cardId !== 'todas' && transaction.cardId !== filters.cardId) {
      return false;
    }

    if (filters.natureza && filters.natureza !== 'todas' && transaction.natureza !== filters.natureza) {
      return false;
    }

    return true;
  });

  return filtered.sort((a, b) => (a.data < b.data ? 1 : -1));
};
