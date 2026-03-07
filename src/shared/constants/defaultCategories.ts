import type { Category } from '@/domain/models';
import { createId } from '@/shared/utils/id';

const now = new Date().toISOString();

const expenseGroups = [
  ['Moradia', '#52796f'],
  ['Alimentação', '#f4a261'],
  ['Transporte', '#2a9d8f'],
  ['Saúde', '#e76f51'],
  ['Educação', '#457b9d'],
  ['Lazer', '#8d99ae'],
  ['Assinaturas', '#b08968'],
  ['Impostos', '#6d597a'],
  ['Investimentos', '#1d3557'],
] as const;

export const defaultCategories = (): Category[] => {
  const categories: Array<[string, 'gasto' | 'ganho', string, string]> = [
    ['Aluguel', 'gasto', 'Moradia', '#52796f'],
    ['Mercado', 'gasto', 'Alimentação', '#f4a261'],
    ['Restaurante', 'gasto', 'Alimentação', '#f4a261'],
    ['Combustível', 'gasto', 'Transporte', '#2a9d8f'],
    ['Plano de Saúde', 'gasto', 'Saúde', '#e76f51'],
    ['Cursos', 'gasto', 'Educação', '#457b9d'],
    ['Cinema/Lazer', 'gasto', 'Lazer', '#8d99ae'],
    ['Streaming', 'gasto', 'Assinaturas', '#b08968'],
    ['Impostos', 'gasto', 'Impostos', '#6d597a'],
    ['Aporte', 'gasto', 'Investimentos', '#1d3557'],
    ['Salário', 'ganho', 'Renda', '#2c9a5b'],
    ['Freelance', 'ganho', 'Renda', '#3a86ff'],
    ['Rendimentos', 'ganho', 'Renda', '#1d3557'],
  ];

  return categories.map(([nome, tipo, grupo, cor]) => ({
    id: createId(),
    nome,
    tipo,
    grupo,
    cor,
    createdAt: now,
    updatedAt: now,
  }));
};

export const defaultExpenseGroups = expenseGroups.map(([name]) => name);
