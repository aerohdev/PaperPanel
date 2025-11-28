import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType, duration: number = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: (message: string, duration?: number) => addToast(message, 'success', duration),
    error: (message: string, duration?: number) => addToast(message, 'error', duration ?? 6000),
    warning: (message: string, duration?: number) => addToast(message, 'warning', duration ?? 5000),
    info: (message: string, duration?: number) => addToast(message, 'info', duration),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
  };

  const styles = {
    success: {
      bg: 'bg-gradient-to-r from-emerald-500/95 to-green-500/95',
      border: 'border-emerald-400/50',
      icon: 'text-white',
      text: 'text-white',
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500/95 to-rose-500/95',
      border: 'border-red-400/50',
      icon: 'text-white',
      text: 'text-white',
    },
    warning: {
      bg: 'bg-gradient-to-r from-amber-500/95 to-orange-500/95',
      border: 'border-amber-400/50',
      icon: 'text-white',
      text: 'text-white',
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-500/95 to-cyan-500/95',
      border: 'border-blue-400/50',
      icon: 'text-white',
      text: 'text-white',
    },
  };

  const style = styles[toast.type];

  return (
    <div
      className={`
        ${style.bg} ${style.border}
        backdrop-blur-lg border rounded-xl shadow-2xl
        px-4 py-3 min-w-[300px] max-w-md
        flex items-center gap-3
        animate-[slideIn_0.3s_ease-out]
      `}
    >
      <div className={`flex-shrink-0 ${style.icon}`}>
        {icons[toast.type]}
      </div>
      <p className={`flex-1 text-sm font-medium ${style.text}`}>
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
