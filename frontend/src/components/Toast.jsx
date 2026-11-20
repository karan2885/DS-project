import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-900 text-white shadow-lg border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
      {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
      {isError && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
      {!isSuccess && !isError && <Info className="w-5 h-5 text-sky-400 shrink-0" />}
      
      <div className="text-xs">
        {toast.title && <p className="font-semibold">{toast.title}</p>}
        <p className="text-slate-300">{toast.message}</p>
      </div>

      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white ml-2 p-1 rounded"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
