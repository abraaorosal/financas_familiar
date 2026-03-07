import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Account, Person } from '@/domain/models';
import { accountSchema, type AccountInput } from '@/domain/validators';
import { CurrencyInput } from '@/shared/components/CurrencyInput';

interface AccountFormProps {
  persons: Person[];
  initialData?: Account;
  onSubmit: (payload: AccountInput) => Promise<void>;
  onCancel: () => void;
}

interface AccountFormValues {
  nome: string;
  tipo: 'conta_corrente' | 'dinheiro' | 'poupanca' | 'investimento';
  saldoInicialCentavos: number;
  pessoaId?: string;
}

export const AccountForm = ({ persons, initialData, onSubmit, onCancel }: AccountFormProps) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema) as never,
    defaultValues: {
      nome: initialData?.nome ?? '',
      tipo: initialData?.tipo ?? 'conta_corrente',
      saldoInicialCentavos: initialData?.saldoInicialCentavos ?? 0,
      pessoaId: initialData?.pessoaId,
    },
  });

  const fieldClass = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';

  return (
    <form
      className="space-y-3"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({ ...values, pessoaId: values.pessoaId || undefined });
      })}
    >
      <label className="text-sm">
        <span className="mb-1 block text-slate-600">Nome da conta</span>
        <input className={fieldClass} {...register('nome')} placeholder="Ex: Conta Principal" />
        {errors.nome ? <span className="text-xs text-rose-600">{errors.nome.message}</span> : null}
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-slate-600">Tipo</span>
        <select className={fieldClass} {...register('tipo')}>
          <option value="conta_corrente">Conta corrente</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="poupanca">Poupança</option>
          <option value="investimento">Investimento</option>
        </select>
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-slate-600">Pessoa responsável (opcional)</span>
        <select className={fieldClass} {...register('pessoaId')}>
          <option value="">Compartilhada</option>
          {persons.map((person) => (
            <option key={person.id} value={person.id}>
              {person.nome}
            </option>
          ))}
        </select>
      </label>

      <div className="text-sm">
        <span className="mb-1 block text-slate-600">Saldo inicial</span>
        <Controller
          control={control}
          name="saldoInicialCentavos"
          render={({ field }) => <CurrencyInput valueInCents={field.value} onChange={field.onChange} />}
        />
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar conta'}
        </button>
      </div>
    </form>
  );
};
