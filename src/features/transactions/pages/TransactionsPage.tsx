import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState } from '@/shared/components/EmptyState';
import { Modal } from '@/shared/components/Modal';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import {
  createTransaction,
  duplicateTransaction,
  removeTransaction,
  updateTransaction,
  upsertBudget,
  removeBudget,
} from '@/db/repository';
import { useAccounts, useBudgets, useCards, useCategories, usePersons, useTransactions } from '@/shared/hooks/useAppData';
import { applyTransactionFilters } from '../selectors/transactionSelectors';
import { toMonthKey } from '@/shared/utils/date';
import { formatCurrencyFromCents } from '@/shared/utils/currency';
import { TransactionForm } from '../components/TransactionForm';
import type { Budget, Transaction, TransactionFilters } from '@/domain/models';
import { CurrencyInput } from '@/shared/components/CurrencyInput';

const defaultFilters = (): TransactionFilters => ({
  mes: toMonthKey(new Date()),
  tipo: 'todos',
  pessoaId: 'todas',
  categoriaId: 'todas',
  formaPagamento: 'todas',
  accountId: 'todas',
  cardId: 'todas',
  natureza: 'todas',
});

export const TransactionsPage = () => {
  const transactions = useTransactions();
  const persons = usePersons();
  const categories = useCategories();
  const accounts = useAccounts();
  const cards = useCards();
  const budgets = useBudgets();

  const [filters, setFilters] = useState<TransactionFilters>(() => defaultFilters());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const [budgetCategoryId, setBudgetCategoryId] = useState('');
  const [budgetValueInCents, setBudgetValueInCents] = useState(0);

  const filteredTransactions = useMemo(
    () => applyTransactionFilters(transactions, filters),
    [transactions, filters]
  );

  const monthBudgets = useMemo(
    () => budgets.filter((budget) => budget.mes === filters.mes),
    [budgets, filters.mes]
  );

  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const personById = useMemo(() => new Map(persons.map((person) => [person.id, person])), [persons]);
  const accountById = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts]);
  const cardById = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);

  const totalFiltered = filteredTransactions.reduce((acc, item) => {
    return acc + (item.tipo === 'ganho' ? item.valorCentavos : -item.valorCentavos);
  }, 0);

  const handleCreate = async (payload: Parameters<typeof createTransaction>[0]) => {
    await createTransaction(payload);
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleQuickCreate = async (payload: Parameters<typeof createTransaction>[0]) => {
    await createTransaction(payload);
  };

  const handleEditSave = async (payload: Parameters<typeof createTransaction>[0]) => {
    if (!editingTransaction) return;

    await updateTransaction(editingTransaction.id, {
      ...payload,
      linkedTransactionId: editingTransaction.linkedTransactionId,
      parcelaNumero: editingTransaction.parcelaNumero,
      anexos: editingTransaction.anexos,
    });

    setEditingTransaction(null);
    setIsModalOpen(false);
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleSaveBudget = async () => {
    if (!filters.mes || !budgetCategoryId || budgetValueInCents <= 0) return;

    await upsertBudget({
      mes: filters.mes,
      categoriaId: budgetCategoryId,
      limiteCentavos: budgetValueInCents,
    });

    setBudgetCategoryId('');
    setBudgetValueInCents(0);
  };

  const removeExistingBudget = async (budget: Budget) => {
    await removeBudget(budget.id);
  };

  return (
    <div>
      <PageHeader
        title="Lançamentos"
        description="Cadastre e filtre ganhos/gastos com fluxo rápido para uso diário."
        actions={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white"
          >
            <Plus size={16} /> Novo lançamento
          </button>
        }
      />

      <section className="mb-6 rounded-xl2 border border-primary-100 bg-primary-50/40 p-4 shadow-card">
        <h2 className="mb-3 font-display text-lg font-semibold text-primary-800">Lançamento rápido</h2>
        <TransactionForm
          persons={persons}
          categories={categories}
          accounts={accounts}
          cards={cards}
          compact
          submitLabel="Lançar"
          onSubmit={handleQuickCreate}
        />
      </section>

      <section className="mb-6 grid gap-3 rounded-xl2 border border-slate-200 bg-white p-4 shadow-card md:grid-cols-4 xl:grid-cols-10 [&>*]:min-w-0">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Mês</span>
          <input
            type="month"
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            value={filters.mes}
            onChange={(event) => setFilters((prev) => ({ ...prev, mes: event.target.value }))}
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Data início</span>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            value={filters.dataInicio ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                dataInicio: event.target.value || undefined,
              }))
            }
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Data fim</span>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            value={filters.dataFim ?? ''}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                dataFim: event.target.value || undefined,
              }))
            }
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Tipo</span>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            value={filters.tipo}
            onChange={(event) => setFilters((prev) => ({ ...prev, tipo: event.target.value as TransactionFilters['tipo'] }))}
          >
            <option value="todos">Todos</option>
            <option value="gasto">Gasto</option>
            <option value="ganho">Ganho</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Pessoa</span>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            value={filters.pessoaId}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                pessoaId: event.target.value as string | 'todas',
              }))
            }
          >
            <option value="todas">Todas</option>
            {persons.map((person) => (
              <option key={person.id} value={person.id}>
                {person.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Categoria</span>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            value={filters.categoriaId}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, categoriaId: event.target.value as string | 'todas' }))
            }
          >
            <option value="todas">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Pagamento</span>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            value={filters.formaPagamento}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                formaPagamento: event.target.value as TransactionFilters['formaPagamento'],
              }))
            }
          >
            <option value="todas">Todos</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="debito">Débito</option>
            <option value="pix">Pix</option>
            <option value="boleto">Boleto</option>
            <option value="transferencia">Transferência</option>
            <option value="cartao_credito">Cartão</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Conta</span>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            value={filters.accountId}
            onChange={(event) => setFilters((prev) => ({ ...prev, accountId: event.target.value as string | 'todas' }))}
          >
            <option value="todas">Todas</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Cartão</span>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            value={filters.cardId}
            onChange={(event) => setFilters((prev) => ({ ...prev, cardId: event.target.value as string | 'todas' }))}
          >
            <option value="todas">Todos</option>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Natureza</span>
          <select
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
            value={filters.natureza}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, natureza: event.target.value as TransactionFilters['natureza'] }))
            }
          >
            <option value="todas">Todas</option>
            <option value="fixa">Fixa</option>
            <option value="variavel">Variável</option>
          </select>
        </label>
      </section>

      <section className="mb-6 rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-semibold">Lista de transações</h2>
          <p className="text-sm text-slate-600">Saldo filtrado: {formatCurrencyFromCents(totalFiltered)}</p>
        </div>

        {filteredTransactions.length === 0 ? (
          <EmptyState
            title="Nenhum lançamento no filtro"
            message="Ajuste os filtros ou use o formulário rápido para criar um novo lançamento."
          />
        ) : (
          <>
            <div className="space-y-2 md:hidden">
              {filteredTransactions.map((transaction) => {
                const entity =
                  transaction.formaPagamento === 'cartao_credito'
                    ? cardById.get(transaction.cardId ?? '')?.nome
                    : accountById.get(transaction.accountId ?? '')?.nome;

                return (
                  <article key={transaction.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-800">{transaction.descricao}</p>
                        <p className="text-xs text-slate-500">
                          {format(parseISO(transaction.data), 'dd/MM/yyyy')} • {transaction.natureza}
                        </p>
                      </div>
                      <p
                        className={`text-sm font-semibold ${
                          transaction.tipo === 'ganho' ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {transaction.tipo === 'ganho' ? '+' : '-'}
                        {formatCurrencyFromCents(transaction.valorCentavos)}
                      </p>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <p>Pessoa: {personById.get(transaction.pessoaId)?.nome ?? '-'}</p>
                      <p>Categoria: {categoryById.get(transaction.categoriaId)?.nome ?? '-'}</p>
                      <p>Pagamento: {transaction.formaPagamento.replace('_', ' ')}</p>
                      <p>Conta/Cartão: {entity ?? '-'}</p>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                        onClick={() => openEditModal(transaction)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                        onClick={async () => {
                          await duplicateTransaction(transaction.id);
                        }}
                      >
                        Duplicar
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700"
                        onClick={() => setDeletingTransaction(transaction)}
                      >
                        Excluir
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="px-2">Data</th>
                    <th className="px-2">Descrição</th>
                    <th className="px-2">Pessoa</th>
                    <th className="px-2">Categoria</th>
                    <th className="px-2">Pagamento</th>
                    <th className="px-2">Conta/Cartão</th>
                    <th className="px-2">Valor</th>
                    <th className="px-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => {
                    const entity =
                      transaction.formaPagamento === 'cartao_credito'
                        ? cardById.get(transaction.cardId ?? '')?.nome
                        : accountById.get(transaction.accountId ?? '')?.nome;
                    return (
                      <tr key={transaction.id} className="rounded-lg bg-slate-50">
                        <td className="px-2 py-2">{format(parseISO(transaction.data), 'dd/MM/yyyy')}</td>
                        <td className="px-2 py-2">
                          <p className="font-semibold text-slate-800">{transaction.descricao}</p>
                          <p className="text-xs text-slate-500">{transaction.natureza}</p>
                        </td>
                        <td className="px-2 py-2">{personById.get(transaction.pessoaId)?.nome}</td>
                        <td className="px-2 py-2">{categoryById.get(transaction.categoriaId)?.nome}</td>
                        <td className="px-2 py-2">{transaction.formaPagamento.replace('_', ' ')}</td>
                        <td className="px-2 py-2">{entity ?? '-'}</td>
                        <td
                          className={`px-2 py-2 font-semibold ${
                            transaction.tipo === 'ganho' ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {transaction.tipo === 'ganho' ? '+' : '-'}
                          {formatCurrencyFromCents(transaction.valorCentavos)}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                              onClick={() => openEditModal(transaction)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                              onClick={async () => {
                                await duplicateTransaction(transaction.id);
                              }}
                            >
                              Duplicar
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700"
                              onClick={() => setDeletingTransaction(transaction)}
                            >
                              Excluir
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="mb-6 rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
        <h2 className="mb-3 font-display text-lg font-semibold">Metas do mês por categoria</h2>

        <div className="grid gap-3 md:grid-cols-4">
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block text-slate-600">Categoria de gasto</span>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              value={budgetCategoryId}
              onChange={(event) => setBudgetCategoryId(event.target.value)}
            >
              <option value="">Selecione</option>
              {categories
                .filter((category) => category.tipo === 'gasto')
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nome}
                  </option>
                ))}
            </select>
          </label>

          <div className="text-sm">
            <span className="mb-1 block text-slate-600">Limite mensal</span>
            <CurrencyInput valueInCents={budgetValueInCents} onChange={setBudgetValueInCents} />
          </div>

          <button
            type="button"
            className="self-end rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white"
            onClick={handleSaveBudget}
          >
            Salvar meta
          </button>
        </div>

        {monthBudgets.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {monthBudgets.map((budget) => (
              <li
                key={budget.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="min-w-0 break-words">{categoryById.get(budget.categoriaId)?.nome ?? 'Categoria removida'}</span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{formatCurrencyFromCents(budget.limiteCentavos)}</span>
                  <button
                    type="button"
                    className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700"
                    onClick={() => removeExistingBudget(budget)}
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-500">Nenhuma meta cadastrada para este mês.</p>
        )}
      </section>

      <Modal
        isOpen={isModalOpen}
        title={editingTransaction ? 'Editar lançamento' : 'Novo lançamento'}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
      >
        <TransactionForm
          persons={persons}
          categories={categories}
          accounts={accounts}
          cards={cards}
          initialData={editingTransaction ?? undefined}
          submitLabel={editingTransaction ? 'Salvar alterações' : 'Salvar lançamento'}
          onSubmit={editingTransaction ? handleEditSave : handleCreate}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingTransaction(null);
          }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingTransaction)}
        title="Excluir lançamento"
        message="Essa ação não pode ser desfeita. Deseja excluir a transação?"
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (!deletingTransaction) return;
          await removeTransaction(deletingTransaction.id);
          setDeletingTransaction(null);
        }}
        onClose={() => setDeletingTransaction(null)}
      />
    </div>
  );
};
