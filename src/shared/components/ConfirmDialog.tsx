import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  onConfirm,
  onClose,
}: ConfirmDialogProps) => {
  return (
    <Modal isOpen={isOpen} title={title} onClose={onClose}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
