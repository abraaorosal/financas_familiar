import { parseISO } from 'date-fns';
import type { Card, Transaction } from '@/domain/models';
import { calculateInvoiceByPurchaseDate, getCurrentCardCycle } from '@/shared/utils/cardCycle';

export interface CardCycleSummary {
  cycleStart: string;
  cycleEnd: string;
  dueDate: string;
  invoiceMonth: string;
  gastoCicloCentavos: number;
  percentualLimite: number;
  melhorDiaCompra: number;
  transacoesCiclo: Transaction[];
}

export const getCardCycleSummary = (
  card: Card,
  transactions: Transaction[],
  referenceDateISO: string
): CardCycleSummary => {
  const currentCycle = getCurrentCardCycle(card, referenceDateISO);
  const startDate = parseISO(currentCycle.cycleStart);
  const endDate = parseISO(currentCycle.cycleEnd);

  const transacoesCiclo = transactions
    .filter((transaction) => transaction.tipo === 'gasto' && transaction.formaPagamento === 'cartao_credito')
    .filter((transaction) => transaction.cardId === card.id)
    .filter((transaction) => {
      const date = parseISO(transaction.data);
      return date >= startDate && date <= endDate;
    })
    .sort((a, b) => (a.data > b.data ? 1 : -1));

  const gastoCicloCentavos = transacoesCiclo.reduce((acc, transaction) => acc + transaction.valorCentavos, 0);

  return {
    ...currentCycle,
    gastoCicloCentavos,
    percentualLimite: card.limiteTotalCentavos === 0 ? 0 : (gastoCicloCentavos / card.limiteTotalCentavos) * 100,
    melhorDiaCompra: Math.min(card.fechamentoDia + 1, 28),
    transacoesCiclo,
  };
};

export const mapTransactionToInvoiceMonth = (transactionDate: string, card: Card): string => {
  return calculateInvoiceByPurchaseDate(transactionDate, card.fechamentoDia, card.vencimentoDia).invoiceMonth;
};
