const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

export const formatCurrencyFromCents = (valueInCents: number): string => currencyFormatter.format(valueInCents / 100);

export const parseCurrencyInputToCents = (value: string): number => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
};

export const formatCentsToInput = (valueInCents: number): string => {
  const numeric = (valueInCents / 100).toFixed(2);
  return numeric.replace('.', ',');
};
