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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="
        bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40
        backdrop-blur-3xl backdrop-saturate-150
        border border-white/20
        rounded-2xl
        shadow-[0_20px_60px_0_rgba(0,0,0,0.7),0_0_80px_0_rgba(138,92,246,0.2),inset_0_1px_0_0_rgba(255,255,255,0.2)]
        max-w-md w-full
        animate-scale-in
      ">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onCancel}>
            <X className="w-5 h-5 text-gray-300" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-200">{message}</p>
        </div>

        <div className="flex gap-3 p-6 border-t border-white/10">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2
              bg-white/5 backdrop-blur-xl
              text-white
              rounded-xl
              hover:bg-white/10
              transition-colors
              border border-white/10
              font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 ${variantStyles[variant]} text-white rounded-xl transition-colors font-medium shadow-lg`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
