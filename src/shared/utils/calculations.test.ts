import { describe, expect, it } from 'vitest';
import { getDashboardSummary, getDailyBalanceSeries } from './calculations';
import type { Category, DashboardFilters, Transaction } from '@/domain/models';

const categories: Category[] = [
  {
    id: 'cat-renda',
    nome: 'Salário',
    tipo: 'ganho',
    grupo: 'Renda',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'cat-mercado',
    nome: 'Mercado',
    tipo: 'gasto',
    grupo: 'Alimentação',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'cat-transporte',
    nome: 'Transporte',
    tipo: 'gasto',
    grupo: 'Transporte',
    createdAt: '',
    updatedAt: '',
  },
];

const transactions: Transaction[] = [
  {
    id: 't1',
    data: '2026-02-03',
    tipo: 'ganho',
    natureza: 'fixa',
    pessoaId: 'p1',
    valorCentavos: 400000,
    categoriaId: 'cat-renda',
    descricao: 'Salário',
    formaPagamento: 'transferencia',
    accountId: 'a1',
    recorrente: true,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 't2',
    data: '2026-02-04',
    tipo: 'gasto',
    natureza: 'variavel',
    pessoaId: 'p1',
    valorCentavos: 50000,
    categoriaId: 'cat-mercado',
    descricao: 'Mercado',
    formaPagamento: 'pix',
    accountId: 'a1',
    recorrente: false,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 't3',
    data: '2026-02-10',
    tipo: 'gasto',
    natureza: 'variavel',
    pessoaId: 'p1',
    valorCentavos: 20000,
    categoriaId: 'cat-transporte',
    descricao: 'Combustível',
    formaPagamento: 'debito',
    accountId: 'a1',
    recorrente: false,
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 't4',
    data: '2026-01-08',
    tipo: 'gasto',
    natureza: 'variavel',
    pessoaId: 'p1',
    valorCentavos: 30000,
    categoriaId: 'cat-mercado',
    descricao: 'Mercado',
    formaPagamento: 'pix',
    accountId: 'a1',
    recorrente: false,
    createdAt: '',
    updatedAt: '',
  },
];

const filters: DashboardFilters = {
  mes: '2026-02',
  pessoaId: 'todas',
  natureza: 'todas',
  formaPagamento: 'todas',
};

describe('getDashboardSummary', () => {
  it('calculates totals and top categories', () => {
    const summary = getDashboardSummary(transactions, categories, filters);

    expect(summary.ganhosCentavos).toBe(400000);
    expect(summary.gastosCentavos).toBe(70000);
    expect(summary.saldoCentavos).toBe(330000);
    expect(summary.topCategorias[0].categoria).toBe('Mercado');
    expect(summary.topCategorias[0].valorCentavos).toBe(50000);
  });
});

describe('getDailyBalanceSeries', () => {
  it('returns one point per day with cumulative balance', () => {
    const series = getDailyBalanceSeries(transactions, '2026-02');

    expect(series.length).toBe(28);
    expect(series[2].saldoCentavos).toBe(400000);
    expect(series[3].saldoCentavos).toBe(350000);
  });
});
