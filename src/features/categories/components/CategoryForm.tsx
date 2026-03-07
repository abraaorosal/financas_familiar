import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Category } from '@/domain/models';
import { categorySchema, type CategoryInput } from '@/domain/validators';

interface CategoryFormProps {
  initialData?: Category;
  onSubmit: (payload: CategoryInput) => Promise<void>;
  onCancel: () => void;
}

interface CategoryFormValues {
  nome: string;
  tipo: 'gasto' | 'ganho';
  grupo: string;
  cor?: string;
  icone?: string;
}

export const CategoryForm = ({ initialData, onSubmit, onCancel }: CategoryFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema) as never,
    defaultValues: {
      nome: initialData?.nome ?? '',
      tipo: initialData?.tipo ?? 'gasto',
      grupo: initialData?.grupo ?? '',
      cor: initialData?.cor ?? '#2c9a5b',
      icone: initialData?.icone,
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

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Tipo</span>
          <select className={fieldClass} {...register('tipo')}>
            <option value="gasto">Gasto</option>
            <option value="ganho">Ganho</option>
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Grupo</span>
          <input className={fieldClass} {...register('grupo')} />
          {errors.grupo ? <span className="text-xs text-rose-600">{errors.grupo.message}</span> : null}
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Cor</span>
          <input type="color" className="h-11 w-full rounded-lg border border-slate-200 px-2 py-2" {...register('cor')} />
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Ícone (opcional)</span>
          <input className={fieldClass} {...register('icone')} placeholder="Ex: shopping-cart" />
        </label>
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
          {isSubmitting ? 'Salvando...' : 'Salvar categoria'}
        </button>
      </div>
    </form>
  );
};
