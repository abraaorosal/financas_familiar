import { addDays, startOfMonth, subMonths } from 'date-fns';
import type { Account, Budget, Card, Category, Person, Transaction } from '@/domain/models';
import { db } from './db';
import { defaultCategories } from '@/shared/constants/defaultCategories';
import { createId } from '@/shared/utils/id';
import { toISODateOnly, toMonthKey } from '@/shared/utils/date';

export const AUTO_SEED_VERSION = '2';
export const DEMO_SEED_VERSION = '1';

interface SeedResult {
  persons: Person[];
  categories: Category[];
  accounts: Account[];
  cards: Card[];
  transactions: Transaction[];
  budgets: Budget[];
}

const now = () => new Date().toISOString();

const buildSeedData = (): SeedResult => {
  const timestamp = now();

  const persons: Person[] = [
    {
      id: createId(),
      nome: 'Pessoa 1',
      cor: '#2c9a5b',
      ativo: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId(),
      nome: 'Pessoa 2',
      cor: '#3a86ff',
      ativo: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];

  const categories = defaultCategories();

  const accounts: Account[] = [
    {
      id: createId(),
      nome: 'Conta Principal',
      tipo: 'conta_corrente',
      saldoInicialCentavos: 150000,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId(),
      nome: 'Carteira',
      tipo: 'dinheiro',
      saldoInicialCentavos: 20000,
      pessoaId: persons[0].id,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId(),
      nome: 'Poupança Família',
      tipo: 'poupanca',
      saldoInicialCentavos: 500000,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];

  const cards: Card[] = [
    {
      id: createId(),
      nome: 'Nubank',
      bandeira: 'Mastercard',
      pessoaId: persons[0].id,
      limiteTotalCentavos: 450000,
      fechamentoDia: 10,
      vencimentoDia: 17,
      ativo: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId(),
      nome: 'Inter',
      bandeira: 'Visa',
      pessoaId: persons[1].id,
      limiteTotalCentavos: 350000,
      fechamentoDia: 5,
      vencimentoDia: 12,
      ativo: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];

  const getCategory = (name: string) => categories.find((category) => category.nome === name)?.id ?? categories[0].id;

  const currentMonthStart = startOfMonth(new Date());
  const previousMonthStart = startOfMonth(subMonths(new Date(), 1));

  const transactions: Transaction[] = [
    {
      id: createId(),
      data: toISODateOnly(addDays(currentMonthStart, 2)),
      tipo: 'ganho',
      natureza: 'fixa',
      pessoaId: persons[0].id,
      valorCentavos: 450000,
      categoriaId: getCategory('Salário'),
      descricao: 'Salário principal',
      formaPagamento: 'transferencia',
      accountId: accounts[0].id,
      recorrente: true,
      recorrencia: 'mensal',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId(),
      data: toISODateOnly(addDays(currentMonthStart, 4)),
      tipo: 'ganho',
      natureza: 'variavel',
      pessoaId: persons[1].id,
      valorCentavos: 120000,
      categoriaId: getCategory('Freelance'),
      descricao: 'Projeto freelancer',
      formaPagamento: 'pix',
      accountId: accounts[0].id,
      recorrente: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId(),
      data: toISODateOnly(addDays(currentMonthStart, 5)),
      tipo: 'gasto',
      natureza: 'fixa',
      pessoaId: persons[0].id,
      valorCentavos: 180000,
      categoriaId: getCategory('Aluguel'),
      descricao: 'Aluguel mensal',
      formaPagamento: 'transferencia',
      accountId: accounts[0].id,
      recorrente: true,
      recorrencia: 'mensal',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId(),
      data: toISODateOnly(addDays(currentMonthStart, 6)),
      tipo: 'gasto',
      natureza: 'variavel',
      pessoaId: persons[1].id,
      valorCentavos: 62000,
      categoriaId: getCategory('Mercado'),
      descricao: 'Compra do mês',
      formaPagamento: 'cartao_credito',
      cardId: cards[1].id,
      recorrente: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId(),
      data: toISODateOnly(addDays(currentMonthStart, 9)),
      tipo: 'gasto',
      natureza: 'variavel',
      pessoaId: persons[0].id,
      valorCentavos: 18000,
      categoriaId: getCategory('Combustível'),
      descricao: 'Abastecimento',
      formaPagamento: 'debito',
      accountId: accounts[0].id,
      recorrente: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId(),
      data: toISODateOnly(addDays(currentMonthStart, 12)),
      tipo: 'gasto',
      natureza: 'fixa',
      pessoaId: persons[1].id,
      valorCentavos: 3990,
      categoriaId: getCategory('Streaming'),
      descricao: 'Assinatura streaming',
      formaPagamento: 'cartao_credito',
      cardId: cards[1].id,
      recorrente: true,
      recorrencia: 'mensal',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId(),
      data: toISODateOnly(addDays(previousMonthStart, 3)),
      tipo: 'ganho',
      natureza: 'fixa',
      pessoaId: persons[0].id,
      valorCentavos: 430000,
      categoriaId: getCategory('Salário'),
      descricao: 'Salário principal',
      formaPagamento: 'transferencia',
      accountId: accounts[0].id,
      recorrente: true,
      recorrencia: 'mensal',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId(),
      data: toISODateOnly(addDays(previousMonthStart, 8)),
      tipo: 'gasto',
      natureza: 'variavel',
      pessoaId: persons[0].id,
      valorCentavos: 53000,
      categoriaId: getCategory('Mercado'),
      descricao: 'Mercado mensal',
      formaPagamento: 'pix',
      accountId: accounts[0].id,
      recorrente: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId(),
      data: toISODateOnly(addDays(previousMonthStart, 10)),
      tipo: 'gasto',
      natureza: 'variavel',
      pessoaId: persons[1].id,
      valorCentavos: 21000,
      categoriaId: getCategory('Restaurante'),
      descricao: 'Jantar fora',
      formaPagamento: 'cartao_credito',
      cardId: cards[1].id,
      recorrente: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId(),
      data: toISODateOnly(addDays(previousMonthStart, 15)),
      tipo: 'gasto',
      natureza: 'fixa',
      pessoaId: persons[0].id,
      valorCentavos: 180000,
      categoriaId: getCategory('Aluguel'),
      descricao: 'Aluguel mensal',
      formaPagamento: 'transferencia',
      accountId: accounts[0].id,
      recorrente: true,
      recorrencia: 'mensal',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];

  const budgets: Budget[] = [
    {
      id: createId(),
      mes: toMonthKey(new Date()),
      categoriaId: getCategory('Mercado'),
      limiteCentavos: 90000,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId(),
      mes: toMonthKey(new Date()),
      categoriaId: getCategory('Restaurante'),
      limiteCentavos: 30000,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: createId(),
      mes: toMonthKey(new Date()),
      categoriaId: getCategory('Streaming'),
      limiteCentavos: 5000,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];

  return {
    persons,
    categories,
    accounts,
    cards,
    transactions,
    budgets,
  };
};

export const seedDatabase = async (): Promise<void> => {
  const existingSeed = await db.meta.get('autoSeedVersion');

  if (existingSeed?.value === AUTO_SEED_VERSION) {
    return;
  }

  await db.transaction('rw', [db.categories, db.meta], async () => {
    const categoryCount = await db.categories.count();
    if (categoryCount === 0) {
      await db.categories.bulkPut(defaultCategories());
    }

    await db.meta.put({
      key: 'autoSeedVersion',
      value: AUTO_SEED_VERSION,
      updatedAt: now(),
    });
  });
};

export const forceSeedDatabase = async (): Promise<void> => {
  await db.transaction('rw', [db.persons, db.categories, db.accounts, db.cards, db.transactions, db.budgets, db.meta], async () => {
    await db.persons.clear();
    await db.categories.clear();
    await db.accounts.clear();
    await db.cards.clear();
    await db.transactions.clear();
    await db.budgets.clear();

    const seed = buildSeedData();

    await db.persons.bulkPut(seed.persons);
    await db.categories.bulkPut(seed.categories);
    await db.accounts.bulkPut(seed.accounts);
    await db.cards.bulkPut(seed.cards);
    await db.transactions.bulkPut(seed.transactions);
    await db.budgets.bulkPut(seed.budgets);

    await db.meta.put({
      key: 'seedVersion',
      value: DEMO_SEED_VERSION,
      updatedAt: now(),
    });
    await db.meta.put({
      key: 'autoSeedVersion',
      value: AUTO_SEED_VERSION,
      updatedAt: now(),
    });
  });
};
