import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useCards, usePersons, useTransactions } from '@/shared/hooks/useAppData';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState } from '@/shared/components/EmptyState';
import { Modal } from '@/shared/components/Modal';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { formatCurrencyFromCents } from '@/shared/utils/currency';
import { getCardCycleSummary, mapTransactionToInvoiceMonth } from '../selectors/cardSelectors';
import { upsertCard, removeCard } from '@/db/repository';
import { CardForm } from '../components/CardForm';
import type { Card } from '@/domain/models';
import { format, parseISO } from 'date-fns';

export const CardsPage = () => {
  const cards = useCards();
  const persons = usePersons();
  const transactions = useTransactions();

  const [selectedCardId, setSelectedCardId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [deletingCard, setDeletingCard] = useState<Card | null>(null);

  const activeCards = cards.filter((card) => card.ativo);

  const selectedCard = useMemo(() => {
    const fallback = activeCards[0]?.id ?? cards[0]?.id;
    const targetId = selectedCardId || fallback;
    return cards.find((card) => card.id === targetId) ?? null;
  }, [cards, selectedCardId, activeCards]);

  const cycleSummary = useMemo(() => {
    if (!selectedCard) return null;
    return getCardCycleSummary(selectedCard, transactions, new Date().toISOString().slice(0, 10));
  }, [selectedCard, transactions]);

  const personById = useMemo(() => new Map(persons.map((person) => [person.id, person])), [persons]);

  const openCreate = () => {
    setEditingCard(null);
    setIsModalOpen(true);
  };

  const openEdit = (card: Card) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingCard(null);
    setIsModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        title="Cartões"
        description="Gerencie limites, ciclos e previsão de fatura automaticamente."
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white"
            onClick={openCreate}
          >
            <Plus size={16} /> Novo cartão
          </button>
        }
      />

      <section className="mb-6 grid gap-4 lg:grid-cols-[320px,1fr]">
        <article className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
          <h2 className="mb-3 font-display text-lg font-semibold">Seus cartões</h2>

          {cards.length === 0 ? (
            <EmptyState title="Sem cartões" message="Cadastre seu primeiro cartão para acompanhar limites e fatura." />
          ) : (
            <ul className="space-y-2">
              {cards.map((card) => {
                const isSelected = selectedCard?.id === card.id;
                const person = personById.get(card.pessoaId);

                return (
                  <li key={card.id} className={`rounded-lg border p-3 ${isSelected ? 'border-primary-300 bg-primary-50' : 'border-slate-200'}`}>
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => setSelectedCardId(card.id)}
                    >
                      <p className="font-semibold text-slate-800">{card.nome}</p>
                      <p className="text-xs text-slate-500">
                        {person?.nome ?? 'Sem pessoa'} • Fech. {card.fechamentoDia} • Venc. {card.vencimentoDia}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">Limite: {formatCurrencyFromCents(card.limiteTotalCentavos)}</p>
                    </button>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                        onClick={() => openEdit(card)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700"
                        onClick={() => setDeletingCard(card)}
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <article className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
          {!selectedCard || !cycleSummary ? (
            <EmptyState title="Selecione um cartão" message="Escolha um cartão para ver os dados do ciclo atual." />
          ) : (
            <>
              <div className="mb-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-sm text-slate-500">Gasto no ciclo</p>
                  <p className="text-xl font-bold text-slate-800">{formatCurrencyFromCents(cycleSummary.gastoCicloCentavos)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-sm text-slate-500">Previsão de fatura</p>
                  <p className="text-xl font-bold text-slate-800">{formatCurrencyFromCents(cycleSummary.gastoCicloCentavos)}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-sm text-slate-500">Uso do limite</p>
                  <p className="text-xl font-bold text-slate-800">{cycleSummary.percentualLimite.toFixed(1)}%</p>
                </div>
              </div>

              <div className="mb-4 rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
                <p>
                  Ciclo atual: <strong>{format(parseISO(cycleSummary.cycleStart), 'dd/MM/yyyy')}</strong> até{' '}
                  <strong>{format(parseISO(cycleSummary.cycleEnd), 'dd/MM/yyyy')}</strong>
                </p>
                <p>
                  Vencimento previsto: <strong>{format(parseISO(cycleSummary.dueDate), 'dd/MM/yyyy')}</strong>
                </p>
                <p>
                  Melhor dia de compra: <strong>dia {cycleSummary.melhorDiaCompra}</strong>
                </p>
              </div>

              <h3 className="mb-2 font-display text-base font-semibold">Transações no ciclo</h3>

              {cycleSummary.transacoesCiclo.length === 0 ? (
                <EmptyState title="Sem compras no ciclo" message="As compras em crédito deste ciclo aparecerão aqui." />
              ) : (
                <ul className="space-y-2">
                  {cycleSummary.transacoesCiclo.map((transaction) => (
                    <li key={transaction.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-800">{transaction.descricao}</p>
                          <p className="text-xs text-slate-500">
                            {format(parseISO(transaction.data), 'dd/MM/yyyy')} • Fatura {mapTransactionToInvoiceMonth(transaction.data, selectedCard)}
                          </p>
                        </div>
                        <p className="font-semibold text-rose-700">{formatCurrencyFromCents(transaction.valorCentavos)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </article>
      </section>

      <Modal
        isOpen={isModalOpen}
        title={editingCard ? 'Editar cartão' : 'Novo cartão'}
        onClose={closeModal}
      >
        <CardForm
          persons={persons}
          initialData={editingCard ?? undefined}
          onSubmit={async (payload) => {
            await upsertCard({ ...payload, id: editingCard?.id });
            closeModal();
          }}
          onCancel={closeModal}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingCard)}
        title="Excluir cartão"
        message="Essa ação removerá apenas o cadastro do cartão. As transações já lançadas continuarão no histórico."
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (!deletingCard) return;
          await removeCard(deletingCard.id);
          setDeletingCard(null);
        }}
        onClose={() => setDeletingCard(null)}
      />
    </div>
  );
};
