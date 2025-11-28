import { X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-orange-500 hover:bg-orange-600',
    info: 'bg-primary-500 hover:bg-primary-600'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-2xl shadow-strong dark:shadow-dark-strong max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-light-border dark:border-dark-border">
          <h3 className="text-xl font-bold text-light-text-primary dark:text-dark-text-primary">{title}</h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-light-card dark:hover:bg-dark-card transition-colors"
          >
            <X className="w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-light-text-secondary dark:text-dark-text-secondary">{message}</p>
        </div>

        <div className="flex gap-3 p-6 border-t border-light-border dark:border-dark-border">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-light-card dark:bg-dark-card text-light-text-primary dark:text-dark-text-primary rounded-xl hover:bg-light-surface dark:hover:bg-dark-surface transition-colors border border-light-border dark:border-dark-border"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 ${variantStyles[variant]} text-white rounded-xl transition-colors font-medium`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
