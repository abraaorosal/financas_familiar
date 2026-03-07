import { addMonths, formatISO, parseISO } from 'date-fns';
import { db, DB_SCHEMA_VERSION } from './db';
import type {
  Account,
  AppMeta,
  Budget,
  Card,
  Category,
  DataBundle,
  Person,
  Transaction,
} from '@/domain/models';
import {
  accountSchema,
  budgetSchema,
  cardSchema,
  categorySchema,
  dataBundleSchema,
  personSchema,
  transactionSchema,
} from '@/domain/validators';
import { createId } from '@/shared/utils/id';
import { splitInstallmentsInCents } from '@/shared/utils/installments';

const now = (): string => new Date().toISOString();

export type ImportStrategy = 'merge' | 'overwrite';

export const getAllData = async (): Promise<DataBundle['data']> => {
  const [persons, categories, accounts, cards, transactions, budgets, meta] = await Promise.all([
    db.persons.toArray(),
    db.categories.toArray(),
    db.accounts.toArray(),
    db.cards.toArray(),
    db.transactions.orderBy('data').reverse().toArray(),
    db.budgets.toArray(),
    db.meta.toArray(),
  ]);

  return {
    persons,
    categories,
    accounts,
    cards,
    transactions,
    budgets,
    meta,
  };
};

export const exportDataBundle = async (): Promise<DataBundle> => {
  const data = await getAllData();

  return {
    schemaVersion: DB_SCHEMA_VERSION,
    exportedAt: now(),
    data,
  };
};

export const importDataBundle = async (bundle: unknown, strategy: ImportStrategy): Promise<void> => {
  const parsed = dataBundleSchema.parse(bundle);

  const runMerge = async (): Promise<void> => {
    await db.persons.bulkPut(parsed.data.persons);
    await db.categories.bulkPut(parsed.data.categories);
    await db.accounts.bulkPut(parsed.data.accounts);
    await db.cards.bulkPut(parsed.data.cards);
    await db.transactions.bulkPut(parsed.data.transactions);
    await db.budgets.bulkPut(parsed.data.budgets);
    await db.meta.bulkPut(parsed.data.meta);
  };

  await db.transaction('rw', [db.persons, db.categories, db.accounts, db.cards, db.transactions, db.budgets, db.meta], async () => {
    if (strategy === 'overwrite') {
      await db.persons.clear();
      await db.categories.clear();
      await db.accounts.clear();
      await db.cards.clear();
      await db.transactions.clear();
      await db.budgets.clear();
      await db.meta.clear();
    }

    await runMerge();

    await db.meta.put({
      key: 'lastImportAt',
      value: now(),
      updatedAt: now(),
    });
  });
};

export const clearAllData = async (): Promise<void> => {
  await db.transaction('rw', [db.persons, db.categories, db.accounts, db.cards, db.transactions, db.budgets, db.meta], async () => {
    await db.persons.clear();
    await db.categories.clear();
    await db.accounts.clear();
    await db.cards.clear();
    await db.transactions.clear();
    await db.budgets.clear();
    await db.meta.clear();
    await db.meta.put({
      key: 'seedVersion',
      value: '1',
      updatedAt: now(),
    });
  });
};

export const upsertPerson = async (payload: Omit<Person, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Person> => {
  const validated = personSchema.parse(payload);
  const timestamp = now();
  const record: Person = {
    id: validated.id ?? createId(),
    nome: validated.nome,
    cor: validated.cor,
    ativo: validated.ativo,
    createdAt: validated.id ? (await db.persons.get(validated.id))?.createdAt ?? timestamp : timestamp,
    updatedAt: timestamp,
  };

  await db.persons.put(record);
  return record;
};

export const removePerson = async (personId: string): Promise<void> => {
  await db.persons.delete(personId);
};

export const upsertCategory = async (
  payload: Omit<Category, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<Category> => {
  const validated = categorySchema.parse(payload);
  const timestamp = now();

  const record: Category = {
    id: validated.id ?? createId(),
    nome: validated.nome,
    tipo: validated.tipo,
    grupo: validated.grupo,
    cor: validated.cor,
    icone: validated.icone,
    createdAt: validated.id ? (await db.categories.get(validated.id))?.createdAt ?? timestamp : timestamp,
    updatedAt: timestamp,
  };

  await db.categories.put(record);
  return record;
};

export const removeCategory = async (categoryId: string): Promise<void> => {
  await db.categories.delete(categoryId);
};

export const upsertAccount = async (
  payload: Omit<Account, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<Account> => {
  const validated = accountSchema.parse(payload);
  const timestamp = now();

  const record: Account = {
    id: validated.id ?? createId(),
    nome: validated.nome,
    tipo: validated.tipo,
    saldoInicialCentavos: validated.saldoInicialCentavos,
    pessoaId: validated.pessoaId,
    createdAt: validated.id ? (await db.accounts.get(validated.id))?.createdAt ?? timestamp : timestamp,
    updatedAt: timestamp,
  };

  await db.accounts.put(record);
  return record;
};

export const removeAccount = async (accountId: string): Promise<void> => {
  await db.accounts.delete(accountId);
};

export const upsertCard = async (payload: Omit<Card, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Card> => {
  const validated = cardSchema.parse(payload);
  const timestamp = now();

  const record: Card = {
    id: validated.id ?? createId(),
    nome: validated.nome,
    bandeira: validated.bandeira,
    pessoaId: validated.pessoaId,
    limiteTotalCentavos: validated.limiteTotalCentavos,
    fechamentoDia: validated.fechamentoDia,
    vencimentoDia: validated.vencimentoDia,
    ativo: validated.ativo,
    createdAt: validated.id ? (await db.cards.get(validated.id))?.createdAt ?? timestamp : timestamp,
    updatedAt: timestamp,
  };

  await db.cards.put(record);
  return record;
};

export const removeCard = async (cardId: string): Promise<void> => {
  await db.cards.delete(cardId);
};

const buildInstallmentDescription = (description: string, current: number, total: number): string =>
  total > 1 ? `${description} (${current}/${total})` : description;

export const createTransaction = async (
  payload: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'parcelaNumero'>
): Promise<Transaction[]> => {
  const validated = transactionSchema.parse(payload);
  const timestamp = now();

  const installmentCount = validated.parcelaTotal && validated.parcelaTotal > 1 ? validated.parcelaTotal : 1;
  const installmentValues = splitInstallmentsInCents(validated.valorCentavos, installmentCount);
  const parcelGroupId = installmentCount > 1 ? createId() : undefined;

  const records: Transaction[] = installmentValues.map((value, index) => {
    const installmentNumber = index + 1;
    const baseDate = parseISO(validated.data);
    const installmentDate = addMonths(baseDate, index);

    return {
      id: createId(),
      linkedTransactionId: parcelGroupId,
      data: formatISO(installmentDate, { representation: 'date' }),
      tipo: validated.tipo,
      natureza: validated.natureza,
      pessoaId: validated.pessoaId,
      valorCentavos: value,
      categoriaId: validated.categoriaId,
      descricao: buildInstallmentDescription(validated.descricao, installmentNumber, installmentCount),
      formaPagamento: validated.formaPagamento,
      accountId: validated.accountId,
      cardId: validated.cardId,
      parcelaTotal: installmentCount > 1 ? installmentCount : undefined,
      parcelaNumero: installmentCount > 1 ? installmentNumber : undefined,
      recorrente: validated.recorrente,
      recorrencia: validated.recorrencia,
      tags: validated.tags,
      anexos: validated.anexos,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });

  await db.transactions.bulkAdd(records);
  return records;
};

export const updateTransaction = async (
  transactionId: string,
  payload: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Transaction> => {
  const validated = transactionSchema.parse(payload);

  const existing = await db.transactions.get(transactionId);
  if (!existing) {
    throw new Error('Transação não encontrada');
  }

  const record: Transaction = {
    ...existing,
    ...validated,
    id: transactionId,
    updatedAt: now(),
  };

  await db.transactions.put(record);
  return record;
};

export const duplicateTransaction = async (transactionId: string): Promise<Transaction[]> => {
  const existing = await db.transactions.get(transactionId);
  if (!existing) {
    throw new Error('Transação não encontrada para duplicar');
  }

  return createTransaction({
    linkedTransactionId: existing.linkedTransactionId,
    data: now().slice(0, 10),
    tipo: existing.tipo,
    natureza: existing.natureza,
    pessoaId: existing.pessoaId,
    valorCentavos: existing.valorCentavos,
    categoriaId: existing.categoriaId,
    descricao: existing.descricao,
    formaPagamento: existing.formaPagamento,
    accountId: existing.accountId,
    cardId: existing.cardId,
    parcelaTotal: undefined,
    recorrente: existing.recorrente,
    recorrencia: existing.recorrencia,
    tags: existing.tags,
    anexos: existing.anexos,
  });
};

export const removeTransaction = async (transactionId: string): Promise<void> => {
  await db.transactions.delete(transactionId);
};

const ensureTransferCategories = async (): Promise<{ outCategoryId: string; inCategoryId: string }> => {
  const outCategory = await db.categories.where('nome').equals('Transferência Saída').and((category) => category.tipo === 'gasto').first();
  const inCategory = await db.categories.where('nome').equals('Transferência Entrada').and((category) => category.tipo === 'ganho').first();

  const timestamp = now();

  if (!outCategory) {
    await db.categories.add({
      id: createId(),
      nome: 'Transferência Saída',
      tipo: 'gasto',
      grupo: 'Transferências',
      cor: '#9c6644',
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  if (!inCategory) {
    await db.categories.add({
      id: createId(),
      nome: 'Transferência Entrada',
      tipo: 'ganho',
      grupo: 'Transferências',
      cor: '#2a9d8f',
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  const refreshedOut =
    outCategory ??
    (await db.categories.where('nome').equals('Transferência Saída').and((category) => category.tipo === 'gasto').first());
  const refreshedIn =
    inCategory ??
    (await db.categories.where('nome').equals('Transferência Entrada').and((category) => category.tipo === 'ganho').first());

  if (!refreshedOut || !refreshedIn) {
    throw new Error('Falha ao preparar categorias de transferência');
  }

  return {
    outCategoryId: refreshedOut.id,
    inCategoryId: refreshedIn.id,
  };
};

export const createAccountTransfer = async (params: {
  data: string;
  valorCentavos: number;
  pessoaId: string;
  origemAccountId: string;
  destinoAccountId: string;
  descricao?: string;
}): Promise<Transaction[]> => {
  const { outCategoryId, inCategoryId } = await ensureTransferCategories();
  const linkId = createId();
  const timestamp = now();
  const description = params.descricao?.trim() || 'Transferência entre contas';

  const outTransaction: Transaction = {
    id: createId(),
    linkedTransactionId: linkId,
    data: params.data,
    tipo: 'gasto',
    natureza: 'variavel',
    pessoaId: params.pessoaId,
    valorCentavos: params.valorCentavos,
    categoriaId: outCategoryId,
    descricao: `${description} (saída)`,
    formaPagamento: 'transferencia',
    accountId: params.origemAccountId,
    recorrente: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  const inTransaction: Transaction = {
    id: createId(),
    linkedTransactionId: linkId,
    data: params.data,
    tipo: 'ganho',
    natureza: 'variavel',
    pessoaId: params.pessoaId,
    valorCentavos: params.valorCentavos,
    categoriaId: inCategoryId,
    descricao: `${description} (entrada)`,
    formaPagamento: 'transferencia',
    accountId: params.destinoAccountId,
    recorrente: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.transactions.bulkAdd([outTransaction, inTransaction]);

  return [outTransaction, inTransaction];
};

export const upsertBudget = async (
  payload: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<Budget> => {
  const validated = budgetSchema.parse(payload);
  const timestamp = now();

  const existingByPair = await db.budgets.where('[mes+categoriaId]').equals([validated.mes, validated.categoriaId]).first();

  const budgetId = validated.id ?? existingByPair?.id ?? createId();
  const existing = await db.budgets.get(budgetId);

  const record: Budget = {
    id: budgetId,
    mes: validated.mes,
    categoriaId: validated.categoriaId,
    limiteCentavos: validated.limiteCentavos,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };

  await db.budgets.put(record);
  return record;
};

export const removeBudget = async (budgetId: string): Promise<void> => {
  await db.budgets.delete(budgetId);
};

export const saveMeta = async (meta: AppMeta): Promise<void> => {
  await db.meta.put(meta);
};
