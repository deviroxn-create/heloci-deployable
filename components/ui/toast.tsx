"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${toastIdCounter++}`;
    const newToast = { ...toast, id };
    console.log("Adding toast:", newToast);
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-0 right-0 z-[9999] p-6 space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto animate-in slide-in-from-right-full duration-300"
        >
          <ToastItem toast={toast} onClose={() => onRemove(toast.id)} />
        </div>
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: () => void;
}) {
  const bgColor = {
    success: "bg-success/10 border-success/30",
    error: "bg-error/10 border-error/30",
    info: "bg-brand/10 border-brand/30",
  }[toast.type];

  const textColor = {
    success: "text-success",
    error: "text-error",
    info: "text-brand",
  }[toast.type];

  const Icon = {
    success: CheckCircle2,
    error: AlertCircle,
    info: AlertCircle,
  }[toast.type];

  return (
    <div
      className={`rounded-xl border ${bgColor} p-4 flex items-start gap-3 max-w-md shadow-lg`}
    >
      <Icon className={`h-5 w-5 ${textColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className={`font-semibold ${textColor}`}>{toast.title}</p>
        {toast.message && (
          <p className="text-sm text-slate-600 mt-1">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
