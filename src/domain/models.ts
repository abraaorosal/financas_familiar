export type EntityId = string;

export type TipoTransacao = 'gasto' | 'ganho';
export type NaturezaTransacao = 'fixa' | 'variavel';
export type FormaPagamento = 'dinheiro' | 'debito' | 'pix' | 'boleto' | 'transferencia' | 'cartao_credito';
export type TipoConta = 'conta_corrente' | 'dinheiro' | 'poupanca' | 'investimento';
export type FrequenciaRecorrencia = 'mensal' | 'semanal' | 'anual';

export interface Person {
  id: EntityId;
  nome: string;
  cor: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: EntityId;
  nome: string;
  tipo: TipoTransacao;
  grupo: string;
  cor?: string;
  icone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: EntityId;
  nome: string;
  tipo: TipoConta;
  saldoInicialCentavos: number;
  pessoaId?: EntityId;
  createdAt: string;
  updatedAt: string;
}

export interface Card {
  id: EntityId;
  nome: string;
  bandeira?: string;
  pessoaId: EntityId;
  limiteTotalCentavos: number;
  fechamentoDia: number;
  vencimentoDia: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: EntityId;
  linkedTransactionId?: EntityId;
  data: string;
  tipo: TipoTransacao;
  natureza: NaturezaTransacao;
  pessoaId: EntityId;
  valorCentavos: number;
  categoriaId: EntityId;
  descricao: string;
  formaPagamento: FormaPagamento;
  accountId?: EntityId;
  cardId?: EntityId;
  parcelaTotal?: number;
  parcelaNumero?: number;
  recorrente: boolean;
  recorrencia?: FrequenciaRecorrencia;
  tags?: string[];
  anexos?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: EntityId;
  mes: string;
  categoriaId: EntityId;
  limiteCentavos: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppMeta {
  key: string;
  value: string;
  updatedAt: string;
}

export interface DataBundle {
  schemaVersion: number;
  exportedAt: string;
  data: {
    persons: Person[];
    categories: Category[];
    accounts: Account[];
    cards: Card[];
    transactions: Transaction[];
    budgets: Budget[];
    meta: AppMeta[];
  };
}

export interface TransactionFilters {
  mes?: string;
  dataInicio?: string;
  dataFim?: string;
  tipo?: TipoTransacao | 'todos';
  pessoaId?: string | 'todas';
  categoriaId?: string | 'todas';
  formaPagamento?: FormaPagamento | 'todas';
  accountId?: string | 'todas';
  cardId?: string | 'todas';
  natureza?: NaturezaTransacao | 'todas';
}

export interface DashboardFilters {
  mes: string;
  pessoaId: string | 'todas';
  natureza: NaturezaTransacao | 'todas';
  formaPagamento: FormaPagamento | 'todas';
}
