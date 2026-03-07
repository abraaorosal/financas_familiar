import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState } from '@/shared/components/EmptyState';
import { Modal } from '@/shared/components/Modal';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { useCategories } from '@/shared/hooks/useAppData';
import { removeCategory, upsertCategory } from '@/db/repository';
import { CategoryForm } from '../components/CategoryForm';
import type { Category } from '@/domain/models';

export const CategoriesPage = () => {
  const categories = useCategories();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [typeFilter, setTypeFilter] = useState<'todos' | 'gasto' | 'ganho'>('todos');

  const filteredCategories = useMemo(() => {
    if (typeFilter === 'todos') return categories;
    return categories.filter((category) => category.tipo === typeFilter);
  }, [categories, typeFilter]);

  return (
    <div>
      <PageHeader
        title="Categorias"
        description="Organize ganhos e gastos por grupo para análises mais claras."
        actions={
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white"
            onClick={() => {
              setEditingCategory(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={16} /> Nova categoria
          </button>
        }
      />

      <section className="mb-4 rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Filtrar por tipo</span>
          <select
            className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as 'todos' | 'gasto' | 'ganho')}
          >
            <option value="todos">Todos</option>
            <option value="gasto">Gastos</option>
            <option value="ganho">Ganhos</option>
          </select>
        </label>
      </section>

      <section className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
        {filteredCategories.length === 0 ? (
          <EmptyState title="Sem categorias" message="Cadastre categorias para classificar os lançamentos." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredCategories.map((category) => (
              <article key={category.id} className="rounded-lg border border-slate-200 p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: category.cor ?? '#94a3b8' }} />
                    <h3 className="font-semibold text-slate-800">{category.nome}</h3>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      category.tipo === 'ganho' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {category.tipo}
                  </span>
                </div>

                <p className="text-sm text-slate-600">Grupo: {category.grupo}</p>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs"
                    onClick={() => {
                      setEditingCategory(category);
                      setIsModalOpen(true);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700"
                    onClick={() => setDeletingCategory(category)}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Modal
        isOpen={isModalOpen}
        title={editingCategory ? 'Editar categoria' : 'Nova categoria'}
        onClose={() => {
          setEditingCategory(null);
          setIsModalOpen(false);
        }}
      >
        <CategoryForm
          initialData={editingCategory ?? undefined}
          onSubmit={async (payload) => {
            await upsertCategory({ ...payload, id: editingCategory?.id });
            setEditingCategory(null);
            setIsModalOpen(false);
          }}
          onCancel={() => {
            setEditingCategory(null);
            setIsModalOpen(false);
          }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingCategory)}
        title="Excluir categoria"
        message="A categoria será removida. Lançamentos já existentes manterão o ID da categoria removida."
        confirmLabel="Excluir"
        onConfirm={async () => {
          if (!deletingCategory) return;
          await removeCategory(deletingCategory.id);
          setDeletingCategory(null);
        }}
        onClose={() => setDeletingCategory(null)}
      />
    </div>
  );
};
