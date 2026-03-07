import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Card, Person } from '@/domain/models';
import { cardSchema, type CardInput } from '@/domain/validators';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { Controller } from 'react-hook-form';

interface CardFormProps {
  persons: Person[];
  initialData?: Card;
  onSubmit: (payload: CardInput) => Promise<void>;
  onCancel: () => void;
}

interface CardFormValues {
  nome: string;
  bandeira?: string;
  pessoaId: string;
  limiteTotalCentavos: number;
  fechamentoDia: number;
  vencimentoDia: number;
  ativo: boolean;
}

export const CardForm = ({ persons, initialData, onSubmit, onCancel }: CardFormProps) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CardFormValues>({
    resolver: zodResolver(cardSchema) as never,
    defaultValues: {
      nome: initialData?.nome ?? '',
      bandeira: initialData?.bandeira,
      pessoaId: initialData?.pessoaId ?? persons[0]?.id ?? '',
      limiteTotalCentavos: initialData?.limiteTotalCentavos ?? 0,
      fechamentoDia: initialData?.fechamentoDia ?? 10,
      vencimentoDia: initialData?.vencimentoDia ?? 17,
      ativo: initialData?.ativo ?? true,
    },
  });

  const fieldClass = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm';

  return (
    <form
      className="space-y-3"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <label className="text-sm">
        <span className="mb-1 block text-slate-600">Nome</span>
        <input className={fieldClass} {...register('nome')} placeholder="Ex: Nubank" />
        {errors.nome ? <span className="text-xs text-rose-600">{errors.nome.message}</span> : null}
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-slate-600">Bandeira</span>
        <input className={fieldClass} {...register('bandeira')} placeholder="Ex: Visa" />
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-slate-600">Pessoa dona do cartão</span>
        <select className={fieldClass} {...register('pessoaId')}>
          {persons.map((person) => (
            <option key={person.id} value={person.id}>
              {person.nome}
            </option>
          ))}
        </select>
      </label>

      <div className="text-sm">
        <span className="mb-1 block text-slate-600">Limite total</span>
        <Controller
          control={control}
          name="limiteTotalCentavos"
          render={({ field }) => <CurrencyInput valueInCents={field.value} onChange={field.onChange} />}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Dia fechamento (1-28)</span>
          <input
            type="number"
            min={1}
            max={28}
            className={fieldClass}
            {...register('fechamentoDia', { valueAsNumber: true })}
          />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Dia vencimento (1-28)</span>
          <input
            type="number"
            min={1}
            max={28}
            className={fieldClass}
            {...register('vencimentoDia', { valueAsNumber: true })}
          />
        </label>
      </div>

      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('ativo')} />
        Cartão ativo
      </label>

      <div className="flex justify-end gap-2">
        <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar cartão'}
        </button>
      </div>
    </form>
  );
};
