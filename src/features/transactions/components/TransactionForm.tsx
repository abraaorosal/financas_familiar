import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Account, Card, Category, Person, Transaction } from '@/domain/models';
import { transactionSchema, type TransactionInput } from '@/domain/validators';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { toISODateOnly } from '@/shared/utils/date';

export interface TransactionFormValues {
  data: string;
  tipo: 'gasto' | 'ganho';
  natureza: 'fixa' | 'variavel';
  pessoaId: string;
  valorCentavos: number;
  categoriaId: string;
  descricao: string;
  formaPagamento: 'dinheiro' | 'debito' | 'pix' | 'boleto' | 'transferencia' | 'cartao_credito';
  accountId?: string;
  cardId?: string;
  parcelaTotal?: number;
  recorrente: boolean;
  recorrencia?: 'mensal' | 'semanal' | 'anual';
  tags?: string;
}

interface TransactionFormProps {
  persons: Person[];
  categories: Category[];
  accounts: Account[];
  cards: Card[];
  initialData?: Transaction;
  compact?: boolean;
  submitLabel?: string;
  onSubmit: (payload: TransactionInput) => Promise<void>;
  onCancel?: () => void;
}

export const TransactionForm = ({
  persons,
  categories,
  accounts,
  cards,
  initialData,
  compact,
  submitLabel = 'Salvar',
  onSubmit,
  onCancel,
}: TransactionFormProps) => {
  const defaultValues: TransactionFormValues = {
    data: initialData?.data ?? toISODateOnly(new Date()),
    tipo: initialData?.tipo ?? 'gasto',
    natureza: initialData?.natureza ?? 'variavel',
    pessoaId: initialData?.pessoaId ?? persons[0]?.id ?? '',
    valorCentavos: initialData?.valorCentavos ?? 0,
    categoriaId: initialData?.categoriaId ?? categories[0]?.id ?? '',
    descricao: initialData?.descricao ?? '',
    formaPagamento: initialData?.formaPagamento ?? 'pix',
    accountId: initialData?.accountId,
    cardId: initialData?.cardId,
    parcelaTotal: initialData?.parcelaTotal,
    recorrente: initialData?.recorrente ?? false,
    recorrencia: initialData?.recorrencia,
    tags: initialData?.tags?.join(', '),
  };

  const {
    register,
    watch,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as never,
    defaultValues,
  });

  const paymentMethod = watch('formaPagamento');
  const transactionType = watch('tipo');
  const isRecurring = watch('recorrente');

  const availableCategories = useMemo(() => {
    return categories.filter((category) => category.tipo === transactionType);
  }, [categories, transactionType]);

  const submit = handleSubmit(async (values) => {
    const payload: TransactionInput = {
      data: values.data,
      tipo: values.tipo,
      natureza: values.natureza,
      pessoaId: values.pessoaId,
      valorCentavos: values.valorCentavos,
      categoriaId: values.categoriaId,
      descricao: values.descricao,
      formaPagamento: values.formaPagamento,
      accountId: values.formaPagamento === 'cartao_credito' ? undefined : values.accountId || undefined,
      cardId: values.formaPagamento === 'cartao_credito' ? values.cardId : undefined,
      parcelaTotal:
        values.formaPagamento === 'cartao_credito' && values.parcelaTotal && values.parcelaTotal > 1
          ? values.parcelaTotal
          : undefined,
      recorrente: values.recorrente,
      recorrencia: values.recorrente ? values.recorrencia : undefined,
      tags: values.tags
        ?.split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    await onSubmit(payload);

    if (!initialData) {
      reset({
        ...defaultValues,
        descricao: '',
        valorCentavos: 0,
      });
    }
  });

  const fieldClassName = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div className={`grid gap-3 ${compact ? 'md:grid-cols-5' : 'md:grid-cols-2'}`}>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Data</span>
          <input type="date" className={fieldClassName} {...register('data')} />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Tipo</span>
          <select className={fieldClassName} {...register('tipo')}>
            <option value="gasto">Gasto</option>
            <option value="ganho">Ganho</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Pessoa</span>
          <select className={fieldClassName} {...register('pessoaId')}>
            {persons.map((person) => (
              <option key={person.id} value={person.id}>
                {person.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Natureza</span>
          <select className={fieldClassName} {...register('natureza')}>
            <option value="variavel">Variável</option>
            <option value="fixa">Fixa</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Categoria</span>
          <select className={fieldClassName} {...register('categoriaId')}>
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={`grid gap-3 ${compact ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Descrição</span>
          <input type="text" className={fieldClassName} placeholder="Ex: Mercado" {...register('descricao')} />
          {errors.descricao ? <span className="text-xs text-rose-600">{errors.descricao.message}</span> : null}
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Forma de pagamento</span>
          <select className={fieldClassName} {...register('formaPagamento')}>
            <option value="pix">Pix</option>
            <option value="debito">Débito</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="boleto">Boleto</option>
            <option value="transferencia">Transferência</option>
            <option value="cartao_credito">Cartão de crédito</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Conta</span>
          <select className={fieldClassName} {...register('accountId')} disabled={paymentMethod === 'cartao_credito'}>
            <option value="">Selecione</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Cartão</span>
          <select className={fieldClassName} {...register('cardId')} disabled={paymentMethod !== 'cartao_credito'}>
            <option value="">Selecione</option>
            {cards.map((card) => (
              <option key={card.id} value={card.id}>
                {card.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={`grid gap-3 ${compact ? 'md:grid-cols-4' : 'md:grid-cols-2'}`}>
        <div className="text-sm">
          <span className="mb-1 block text-slate-600">Valor</span>
          <Controller
            control={control}
            name="valorCentavos"
            render={({ field }) => (
              <CurrencyInput
                valueInCents={field.value}
                onChange={(value) => field.onChange(value)}
                className="min-h-[44px]"
              />
            )}
          />
          {errors.valorCentavos ? <span className="text-xs text-rose-600">{errors.valorCentavos.message}</span> : null}
        </div>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Parcelas</span>
          <input
            type="number"
            min={1}
            max={48}
            className={fieldClassName}
            placeholder="1"
            {...register('parcelaTotal', {
              setValueAs: (value: string) => (value === '' ? undefined : Number(value)),
            })}
            disabled={paymentMethod !== 'cartao_credito'}
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Recorrente?</span>
          <select
            className={fieldClassName}
            {...register('recorrente', {
              setValueAs: (value: string) => value === 'true',
            })}
          >
            <option value="false">Não</option>
            <option value="true">Sim</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Frequência</span>
          <select className={fieldClassName} {...register('recorrencia')} disabled={!isRecurring}>
            <option value="">Selecione</option>
            <option value="mensal">Mensal</option>
            <option value="semanal">Semanal</option>
            <option value="anual">Anual</option>
          </select>
        </label>
      </div>

      {!compact ? (
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Tags (separadas por vírgula)</span>
          <input type="text" className={fieldClassName} placeholder="saúde, casa" {...register('tags')} />
        </label>
      ) : null}

      {(errors.accountId || errors.cardId || errors.recorrencia) && (
        <p className="text-xs text-rose-600">
          {errors.accountId?.message || errors.cardId?.message || errors.recorrencia?.message}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onClick={onCancel}>
            Cancelar
          </button>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {isSubmitting ? 'Salvando...' : submitLabel}
        </button>
      </div>
    </form>
  );
};
