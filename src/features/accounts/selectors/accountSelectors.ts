import type { Account, Transaction } from '@/domain/models';

export interface AccountBalance {
  account: Account;
  saldoAtualCentavos: number;
  totalEntradasCentavos: number;
  totalSaidasCentavos: number;
}

export const buildAccountBalances = (accounts: Account[], transactions: Transaction[]): AccountBalance[] => {
  return accounts.map((account) => {
    const accountTransactions = transactions.filter((transaction) => transaction.accountId === account.id);

    const totalEntradasCentavos = accountTransactions
      .filter((transaction) => transaction.tipo === 'ganho')
      .reduce((acc, transaction) => acc + transaction.valorCentavos, 0);

    const totalSaidasCentavos = accountTransactions
      .filter((transaction) => transaction.tipo === 'gasto')
      .reduce((acc, transaction) => acc + transaction.valorCentavos, 0);

    return {
      account,
      saldoAtualCentavos: account.saldoInicialCentavos + totalEntradasCentavos - totalSaidasCentavos,
      totalEntradasCentavos,
      totalSaidasCentavos,
    };
  });
};
