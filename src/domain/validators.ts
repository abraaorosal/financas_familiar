import { z } from 'zod';

const entityId = z.string().min(1);
const optionalEntityId = z.preprocess((value) => (value === '' ? undefined : value), entityId.optional());
const optionalRecorrencia = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.enum(['mensal', 'semanal', 'anual']).optional()
);
const optionalInstallmentNumber = z.preprocess(
  (value) => (value === '' || Number.isNaN(value) ? undefined : value),
  z.number().int().min(2).max(48).optional()
);
const optionalStringArray = z.preprocess((value) => {
  if (value == null || value === '') return undefined;

  if (Array.isArray(value)) {
    const parsed = value
      .map((item) => String(item).trim())
      .filter(Boolean);
    return parsed.length > 0 ? parsed : undefined;
  }

  if (typeof value === 'string') {
    const parsed = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return parsed.length > 0 ? parsed : undefined;
  }

  return value;
}, z.array(z.string().trim()).optional());

export const personSchema = z.object({
  id: entityId.optional(),
  nome: z.string().trim().min(2, 'Nome obrigatório'),
  cor: z.string().trim().min(4, 'Cor inválida'),
  ativo: z.boolean().default(true),
});

export const categorySchema = z.object({
  id: entityId.optional(),
  nome: z.string().trim().min(2, 'Nome obrigatório'),
  tipo: z.enum(['gasto', 'ganho']),
  grupo: z.string().trim().min(2, 'Grupo obrigatório'),
  cor: z.string().trim().optional(),
  icone: z.string().trim().optional(),
});

export const accountSchema = z.object({
  id: entityId.optional(),
  nome: z.string().trim().min(2, 'Nome obrigatório'),
  tipo: z.enum(['conta_corrente', 'dinheiro', 'poupanca', 'investimento']),
  saldoInicialCentavos: z.number().int(),
  pessoaId: optionalEntityId,
});

export const cardSchema = z.object({
  id: entityId.optional(),
  nome: z.string().trim().min(2, 'Nome obrigatório'),
  bandeira: z.string().trim().optional(),
  pessoaId: entityId,
  limiteTotalCentavos: z.number().int().min(0),
  fechamentoDia: z.number().int().min(1).max(28),
  vencimentoDia: z.number().int().min(1).max(28),
  ativo: z.boolean().default(true),
});

export const transactionSchema = z
  .object({
    id: entityId.optional(),
    linkedTransactionId: optionalEntityId,
    data: z.string().min(1, 'Data obrigatória'),
    tipo: z.enum(['gasto', 'ganho']),
    natureza: z.enum(['fixa', 'variavel']),
    pessoaId: entityId,
    valorCentavos: z.number().int().positive('Valor deve ser maior que zero'),
    categoriaId: entityId,
    descricao: z.string().trim().min(2, 'Descrição obrigatória'),
    formaPagamento: z.enum(['dinheiro', 'debito', 'pix', 'boleto', 'transferencia', 'cartao_credito']),
    accountId: optionalEntityId,
    cardId: optionalEntityId,
    parcelaTotal: optionalInstallmentNumber,
    parcelaNumero: z.preprocess(
      (value) => (value === '' || Number.isNaN(value) ? undefined : value),
      z.number().int().min(1).max(48).optional()
    ),
    recorrente: z.boolean().default(false),
    recorrencia: optionalRecorrencia,
    tags: optionalStringArray,
    anexos: optionalStringArray,
  })
  .superRefine((value, ctx) => {
    if (value.formaPagamento === 'cartao_credito' && !value.cardId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Cartão é obrigatório para pagamento em crédito',
        path: ['cardId'],
      });
    }

    if (value.formaPagamento !== 'cartao_credito' && !value.accountId && value.tipo === 'gasto') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Conta é obrigatória para gastos fora do cartão',
        path: ['accountId'],
      });
    }

    if (value.recorrente && !value.recorrencia) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Defina a frequência da recorrência',
        path: ['recorrencia'],
      });
    }
  });

export const budgetSchema = z.object({
  id: entityId.optional(),
  mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  categoriaId: entityId,
  limiteCentavos: z.number().int().positive(),
});

export const dataBundleSchema = z.object({
  schemaVersion: z.number().int().min(1),
  exportedAt: z.string(),
  data: z.object({
    persons: z.array(
      z.object({
        id: entityId,
        nome: z.string(),
        cor: z.string(),
        ativo: z.boolean(),
        createdAt: z.string(),
        updatedAt: z.string(),
      })
    ),
    categories: z.array(
      z.object({
        id: entityId,
        nome: z.string(),
        tipo: z.enum(['gasto', 'ganho']),
        grupo: z.string(),
        cor: z.string().optional(),
        icone: z.string().optional(),
        createdAt: z.string(),
        updatedAt: z.string(),
      })
    ),
    accounts: z.array(
      z.object({
        id: entityId,
        nome: z.string(),
        tipo: z.enum(['conta_corrente', 'dinheiro', 'poupanca', 'investimento']),
        saldoInicialCentavos: z.number().int(),
        pessoaId: entityId.optional(),
        createdAt: z.string(),
        updatedAt: z.string(),
      })
    ),
    cards: z.array(
      z.object({
        id: entityId,
        nome: z.string(),
        bandeira: z.string().optional(),
        pessoaId: entityId,
        limiteTotalCentavos: z.number().int(),
        fechamentoDia: z.number().int(),
        vencimentoDia: z.number().int(),
        ativo: z.boolean(),
        createdAt: z.string(),
        updatedAt: z.string(),
      })
    ),
    transactions: z.array(
      z.object({
        id: entityId,
        linkedTransactionId: entityId.optional(),
        data: z.string(),
        tipo: z.enum(['gasto', 'ganho']),
        natureza: z.enum(['fixa', 'variavel']),
        pessoaId: entityId,
        valorCentavos: z.number().int(),
        categoriaId: entityId,
        descricao: z.string(),
        formaPagamento: z.enum(['dinheiro', 'debito', 'pix', 'boleto', 'transferencia', 'cartao_credito']),
        accountId: entityId.optional(),
        cardId: entityId.optional(),
        parcelaTotal: z.number().int().optional(),
        parcelaNumero: z.number().int().optional(),
        recorrente: z.boolean(),
        recorrencia: z.enum(['mensal', 'semanal', 'anual']).optional(),
        tags: z.array(z.string()).optional(),
        anexos: z.array(z.string()).optional(),
        createdAt: z.string(),
        updatedAt: z.string(),
      })
    ),
    budgets: z.array(
      z.object({
        id: entityId,
        mes: z.string(),
        categoriaId: entityId,
        limiteCentavos: z.number().int(),
        createdAt: z.string(),
        updatedAt: z.string(),
      })
    ),
    meta: z.array(
      z.object({
        key: z.string(),
        value: z.string(),
        updatedAt: z.string(),
      })
    ),
  }),
});

export type PersonInput = z.infer<typeof personSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type AccountInput = z.infer<typeof accountSchema>;
export type CardInput = z.infer<typeof cardSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
