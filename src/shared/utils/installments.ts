export const splitInstallmentsInCents = (totalInCents: number, installmentCount: number): number[] => {
  if (!Number.isInteger(totalInCents) || totalInCents <= 0) {
    throw new Error('Total deve ser inteiro positivo em centavos');
  }

  if (!Number.isInteger(installmentCount) || installmentCount < 1) {
    throw new Error('Quantidade de parcelas inválida');
  }

  const base = Math.floor(totalInCents / installmentCount);
  const remainder = totalInCents % installmentCount;

  return Array.from({ length: installmentCount }, (_, index) => (index < remainder ? base + 1 : base));
};
