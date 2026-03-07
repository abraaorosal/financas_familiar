import Dexie, { type Table } from 'dexie';
import type { Account, AppMeta, Budget, Card, Category, Person, Transaction } from '@/domain/models';

export const DB_SCHEMA_VERSION = 1;

export class FinancasDB extends Dexie {
  persons!: Table<Person, string>;
  categories!: Table<Category, string>;
  accounts!: Table<Account, string>;
  cards!: Table<Card, string>;
  transactions!: Table<Transaction, string>;
  budgets!: Table<Budget, string>;
  meta!: Table<AppMeta, string>;

  constructor() {
    super('financas-da-casa-db');

    this.version(DB_SCHEMA_VERSION).stores({
      persons: 'id,nome,ativo',
      categories: 'id,tipo,grupo,nome',
      accounts: 'id,tipo,pessoaId,nome',
      cards: 'id,pessoaId,ativo,fechamentoDia,vencimentoDia',
      transactions:
        'id,data,tipo,natureza,pessoaId,categoriaId,formaPagamento,accountId,cardId,[tipo+data],[pessoaId+data],[categoriaId+data]',
      budgets: 'id,mes,categoriaId,[mes+categoriaId]',
      meta: 'key',
    });
  }
}

export const db = new FinancasDB();
