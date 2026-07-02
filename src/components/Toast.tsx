import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, Info, Bell, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  const success = useCallback((message: string, duration?: number) => addToast(message, 'success', duration), [addToast]);
  const warning = useCallback((message: string, duration?: number) => addToast(message, 'warning', duration), [addToast]);
  const info = useCallback((message: string, duration?: number) => addToast(message, 'info', duration), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, warning, info }}>
      {children}
      
      {/* Toast Portal Container */}
      <div 
        className="fixed bottom-6 right-6 z-100 flex flex-col gap-3 w-full max-w-sm pointer-events-none" 
        id="toast-notification-portal"
        aria-live="assertive"
      >
        <AnimatePresence>
          {toasts.map((t) => {
            let icon = <Info className="w-5 h-5 text-indigo-500" />;
            let bgClass = "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-lg";
            let accentBar = "bg-indigo-500";
            
            if (t.type === 'success') {
              icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
              bgClass = "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-md";
              accentBar = "bg-emerald-500";
            } else if (t.type === 'warning') {
              icon = <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
              bgClass = "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-md";
              accentBar = "bg-amber-500";
            } else if (t.type === 'info') {
              icon = <Bell className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
              bgClass = "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-md";
              accentBar = "bg-teal-500";
            }

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className={`pointer-events-auto flex items-center justify-between gap-3.5 p-4 rounded-xl border ${bgClass} relative overflow-hidden transition-colors duration-200`}
                id={`toast-item-${t.id}`}
              >
                {/* Left accent bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentBar}`} />
                
                <div className="flex items-center gap-3 pl-1">
                  <div className="shrink-0">{icon}</div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-normal">
                    {t.message}
                  </p>
                </div>
                
                <button
                  onClick={() => removeToast(t.id)}
                  className="shrink-0 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                  aria-label="Dismiss Notification"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
