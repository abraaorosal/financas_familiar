import { useMemo, useState } from 'react';
import { useBudgets, useCategories, useTransactions } from '@/shared/hooks/useAppData';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState } from '@/shared/components/EmptyState';
import { toMonthKey } from '@/shared/utils/date';
import { getInsightBoardData } from '../selectors/insightSelectors';
import { formatCurrencyFromCents } from '@/shared/utils/currency';

export const InsightsPage = () => {
  const transactions = useTransactions();
  const categories = useCategories();
  const budgets = useBudgets();

  const [month, setMonth] = useState(toMonthKey(new Date()));

  const board = useMemo(() => {
    return getInsightBoardData(transactions, categories, budgets, month);
  }, [transactions, categories, budgets, month]);

  return (
    <div>
      <PageHeader
        title="Insights"
        description="Descubra o que está pesando no orçamento e oportunidades de melhoria."
      />

      <section className="mb-6 rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Mês analisado</span>
          <input
            type="month"
            className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
        </label>
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
          <h2 className="mb-3 font-display text-lg font-semibold">Categorias que mais cresceram</h2>
          {board.growth.length === 0 ? (
            <EmptyState title="Sem variação relevante" message="Não há gastos para comparar com o mês anterior." />
          ) : (
            <ul className="space-y-2">
              {board.growth.map((item) => (
                <li key={item.categoriaId} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="font-semibold text-slate-800">{item.categoriaNome}</p>
                    <span className={`${item.crescimentoPercentual > 0 ? 'text-rose-700' : 'text-emerald-700'} font-semibold`}>
                      {item.crescimentoPercentual.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-slate-600">
                    Atual: {formatCurrencyFromCents(item.atualCentavos)} • Anterior:{' '}
                    {formatCurrencyFromCents(item.anteriorCentavos)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
          <h2 className="mb-3 font-display text-lg font-semibold">Gastos recorrentes detectados</h2>
          {board.recurring.length === 0 ? (
            <EmptyState title="Sem padrões recorrentes" message="Quando despesas se repetirem no mês, elas aparecerão aqui." />
          ) : (
            <ul className="space-y-2">
              {board.recurring.map((item) => (
                <li key={`${item.descricao}-${item.categoriaNome}`} className="rounded-lg border border-slate-200 p-3 text-sm">
                  <p className="font-semibold text-slate-800">{item.descricao}</p>
                  <p className="text-slate-600">
                    {item.categoriaNome} • {item.ocorrencias} ocorrências • Total {formatCurrencyFromCents(item.totalCentavos)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
          <h2 className="mb-3 font-display text-lg font-semibold">Alertas de orçamento</h2>
          {board.alerts.length === 0 ? (
            <EmptyState title="Nenhuma meta estourada" message="As metas acima de 100% aparecerão nesta área." />
          ) : (
            <ul className="space-y-2">
              {board.alerts.map((alert) => (
                <li key={alert.categoriaId} className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm">
                  <p className="font-semibold text-rose-800">{alert.categoriaNome}</p>
                  <p className="text-rose-700">
                    {alert.percentualConsumido.toFixed(0)}% consumido ({formatCurrencyFromCents(alert.realizadoCentavos)} de{' '}
                    {formatCurrencyFromCents(alert.limiteCentavos)})
                  </p>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
          <h2 className="mb-3 font-display text-lg font-semibold">Sugestões automáticas</h2>
          <ul className="space-y-2">
            {board.suggestions.map((item, index) => (
              <li key={`${item.title}-${index}`} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-semibold text-slate-800">{item.title}</p>
                <p className="text-slate-600">{item.description}</p>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
};
