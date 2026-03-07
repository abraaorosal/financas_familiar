import { addDays, addMonths, format, getDate, parseISO, setDate, startOfMonth, subMonths } from 'date-fns';
import type { Card } from '@/domain/models';
import { clampDayInMonth } from './date';

const buildDateWithDay = (baseDate: Date, day: number): Date => {
  const monthStart = startOfMonth(baseDate);
  return setDate(monthStart, clampDayInMonth(monthStart, day));
};

export interface InvoiceCycleWindow {
  cycleStart: string;
  cycleEnd: string;
  dueDate: string;
  invoiceMonth: string;
}

export const calculateInvoiceByPurchaseDate = (
  purchaseDateISO: string,
  fechamentoDia: number,
  vencimentoDia: number
): InvoiceCycleWindow => {
  const purchaseDate = parseISO(purchaseDateISO);
  const closureInPurchaseMonth = buildDateWithDay(purchaseDate, fechamentoDia);

  const invoiceBaseMonthDate = getDate(purchaseDate) > getDate(closureInPurchaseMonth)
    ? addMonths(startOfMonth(purchaseDate), 1)
    : startOfMonth(purchaseDate);

  const dueMonthDate = vencimentoDia > fechamentoDia ? invoiceBaseMonthDate : addMonths(invoiceBaseMonthDate, 1);
  const dueDate = buildDateWithDay(dueMonthDate, vencimentoDia);

  const cycleEnd = buildDateWithDay(invoiceBaseMonthDate, fechamentoDia);
  const previousClosure = buildDateWithDay(subMonths(invoiceBaseMonthDate, 1), fechamentoDia);
  const cycleStart = addDays(previousClosure, 1);

  return {
    cycleStart: format(cycleStart, 'yyyy-MM-dd'),
    cycleEnd: format(cycleEnd, 'yyyy-MM-dd'),
    dueDate: format(dueDate, 'yyyy-MM-dd'),
    invoiceMonth: format(dueDate, 'yyyy-MM'),
  };
};

export const getCurrentCardCycle = (card: Card, referenceDateISO: string): InvoiceCycleWindow => {
  return calculateInvoiceByPurchaseDate(referenceDateISO, card.fechamentoDia, card.vencimentoDia);
};
