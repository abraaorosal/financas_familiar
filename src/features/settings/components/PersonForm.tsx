import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Person } from '@/domain/models';
import { personSchema, type PersonInput } from '@/domain/validators';

interface PersonFormProps {
  initialData?: Person;
  onSubmit: (payload: PersonInput) => Promise<void>;
  onCancel: () => void;
}

interface PersonFormValues {
  nome: string;
  cor: string;
  ativo: boolean;
}

export const PersonForm = ({ initialData, onSubmit, onCancel }: PersonFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema) as never,
    defaultValues: {
      nome: initialData?.nome ?? '',
      cor: initialData?.cor ?? '#2c9a5b',
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
        <input className={fieldClass} {...register('nome')} />
        {errors.nome ? <span className="text-xs text-rose-600">{errors.nome.message}</span> : null}
      </label>

      <label className="text-sm">
        <span className="mb-1 block text-slate-600">Cor na interface</span>
        <input type="color" className="h-11 w-full rounded-lg border border-slate-200 px-2 py-2" {...register('cor')} />
      </label>

      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('ativo')} /> Pessoa ativa
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
          {isSubmitting ? 'Salvando...' : 'Salvar pessoa'}
        </button>
      </div>
    </form>
  );
};
