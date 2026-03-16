import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: { bg: '#f0fdf4', border: '#22c55e', text: '#166534' },
  error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b' },
  warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e' },
  info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {toasts.map((toast) => {
          const colors = TOAST_COLORS[toast.type];
          return (
            <div
              key={toast.id}
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                backgroundColor: colors.bg,
                borderLeft: `4px solid ${colors.border}`,
                color: colors.text,
                fontSize: 14,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                animation: 'toast-slide-in 0.3s ease-out',
                cursor: 'pointer',
                maxWidth: 360,
                wordBreak: 'break-word',
              }}
              onClick={() => removeToast(toast.id)}
              role="alert"
            >
              {toast.message}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toast-slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
