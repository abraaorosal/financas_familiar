import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState } from '@/shared/components/EmptyState';
import { Modal } from '@/shared/components/Modal';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useAccounts, usePersons, useTransactions } from '@/shared/hooks/useAppData';
import { formatCurrencyFromCents } from '@/shared/utils/currency';
import { AccountForm } from '../components/AccountForm';
import { buildAccountBalances } from '../selectors/accountSelectors';
import { createAccountTransfer, removeAccount, upsertAccount } from '@/db/repository';
import type { Account } from '@/domain/models';
import { toISODateOnly } from '@/shared/utils/date';
import { CurrencyInput } from '@/shared/components/CurrencyInput';

export const AccountsPage = () => {
  const accounts = useAccounts();
  const persons = usePersons();
  const transactions = useTransactions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

  const [transferDate, setTransferDate] = useState(toISODateOnly(new Date()));
  const [transferPersonId, setTransferPersonId] = useState('');
  const [originAccountId, setOriginAccountId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [transferValue, setTransferValue] = useState(0);
  const [transferDescription, setTransferDescription] = useState('');

  const accountBalances = useMemo(() => buildAccountBalances(accounts, transactions), [accounts, transactions]);

  const personById = useMemo(() => new Map(persons.map((person) => [person.id, person])), [persons]);

  const openCreate = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
  };

  const openEdit = (account: Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingAccount(null);
    setIsModalOpen(false);
  };

  const handleTransfer = async () => {
    if (!transferPersonId || !originAccountId || !destinationAccountId || transferValue <= 0) return;
    if (originAccountId === destinationAccountId) return;

    await createAccountTransfer({
      data: transferDate,
      pessoaId: transferPersonId,
      origemAccountId: originAccountId,
      destinoAccountId: destinationAccountId,
      valorCentavos: transferValue,
      descricao: transferDescription,
    });

    setTransferValue(0);
    setTransferDescription('');
  };

  return (
    <div>
      <PageHeader
        title="Contas e saldos"
        description="Acompanhe saldo estimado por conta e registre transferências internas."
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white"
            onClick={openCreate}
          >
            <Plus size={16} /> Nova conta
          </button>
        }
      />

      <section className="mb-6 rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
        <h2 className="mb-3 font-display text-lg font-semibold">Saldos estimados</h2>

        {accountBalances.length === 0 ? (
          <EmptyState title="Sem contas" message="Cadastre contas para consolidar os saldos da família." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {accountBalances.map((item) => (
              <article key={item.account.id} className="rounded-lg border border-slate-200 p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-800">{item.account.nome}</h3>
                    <p className="text-xs text-slate-500">
                      {item.account.tipo.replace('_', ' ')} •{' '}
                      {item.account.pessoaId ? personById.get(item.account.pessoaId)?.nome : 'Compartilhada'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                      onClick={() => openEdit(item.account)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700"
                      onClick={() => setDeletingAccount(item.account)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-600">Saldo estimado</p>
                <p className={`text-2xl font-bold ${item.saldoAtualCentavos >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {formatCurrencyFromCents(item.saldoAtualCentavos)}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Entradas: {formatCurrencyFromCents(item.totalEntradasCentavos)} • Saídas:{' '}
                  {formatCurrencyFromCents(item.totalSaidasCentavos)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mb-6 rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
        <h2 className="mb-3 font-display text-lg font-semibold">Transferência entre contas</h2>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Data</span>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              value={transferDate}
              onChange={(event) => setTransferDate(event.target.value)}
            />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Pessoa</span>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              value={transferPersonId}
              onChange={(event) => setTransferPersonId(event.target.value)}
            >
              <option value="">Selecione</option>
              {persons.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Valor</span>
            <CurrencyInput valueInCents={transferValue} onChange={setTransferValue} />
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Conta origem</span>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              value={originAccountId}
              onChange={(event) => setOriginAccountId(event.target.value)}
            >
              <option value="">Selecione</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Conta destino</span>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              value={destinationAccountId}
              onChange={(event) => setDestinationAccountId(event.target.value)}
            >
              <option value="">Selecione</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm md:col-span-3">
            <span className="mb-1 block text-slate-600">Descrição (opcional)</span>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              value={transferDescription}
              onChange={(event) => setTransferDescription(event.target.value)}
            />
          </label>
        </div>

        <button
          type="button"
          className="mt-4 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white"
          onClick={handleTransfer}
        >
          Registrar transferência
        </button>
      </section>

      <Modal isOpen={isModalOpen} title={editingAccount ? 'Editar conta' : 'Nova conta'} onClose={closeModal}>
        <AccountForm
          persons={persons}
          initialData={editingAccount ?? undefined}
          onSubmit={async (payload) => {
            await upsertAccount({ ...payload, id: editingAccount?.id });
            closeModal();
          }}
          onCancel={closeModal}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingAccount)}
        title="Excluir conta"
        message="A conta será removida do cadastro. As transações históricas continuarão registradas."
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (!deletingAccount) return;
          await removeAccount(deletingAccount.id);
          setDeletingAccount(null);
        }}
        onClose={() => setDeletingAccount(null)}
      />
    </div>
  );
};
