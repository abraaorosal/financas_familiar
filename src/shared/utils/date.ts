import {
  addMonths,
  endOfMonth,
  format,
  getDaysInMonth,
  isAfter,
  isBefore,
  isEqual,
  parseISO,
  startOfMonth,
} from 'date-fns';

export const toMonthKey = (date: Date): string => format(date, 'yyyy-MM');

export const monthKeyToDate = (monthKey: string): Date => parseISO(`${monthKey}-01`);

export const clampDayInMonth = (date: Date, targetDay: number): number =>
  Math.min(Math.max(targetDay, 1), getDaysInMonth(date));

export const getMonthBounds = (monthKey: string): { start: Date; end: Date } => {
  const baseDate = monthKeyToDate(monthKey);
  return {
    start: startOfMonth(baseDate),
    end: endOfMonth(baseDate),
  };
};

export const isDateWithinInclusiveRange = (dateISO: string, start: Date, end: Date): boolean => {
  const date = parseISO(dateISO);
  return (isAfter(date, start) || isEqual(date, start)) && (isBefore(date, end) || isEqual(date, end));
};

export const monthLabel = (monthKey: string): string => {
  const date = monthKeyToDate(monthKey);
  return format(date, 'MMM/yyyy');
};

export const shiftMonthKey = (monthKey: string, offset: number): string => toMonthKey(addMonths(monthKeyToDate(monthKey), offset));

export const toISODateOnly = (date: Date): string => format(date, 'yyyy-MM-dd');
