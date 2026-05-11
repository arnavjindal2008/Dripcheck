"use client";

import { useUIStore } from "@/lib/store";
import { Loader2, X, CheckCircle, AlertCircle, Info } from "lucide-react";

export default function GlobalLoader() {
  const { loading, loadingMessage, loadingTitle, toasts, removeToast } = useUIStore();

  return (
    <>
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-3xl animate-in fade-in duration-700" />
          <div className="relative flex flex-col items-center gap-10 px-6 text-center animate-in zoom-in fade-in duration-500">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-2 border-white/5 animate-[spin_4s_linear_infinite]" />
              <div className="absolute inset-0 w-24 h-24 rounded-full border-t-2 border-white shadow-[0_0_30px_white] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-text-primary animate-pulse" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-text-primary tracking-tighter uppercase italic">
                {loadingTitle || "Refining Style"}
              </h2>
              <div className="flex items-center justify-center gap-3">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
              </div>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.4em] max-w-xs">{loadingMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="fixed bottom-24 md:bottom-8 right-0 left-0 md:left-auto md:right-8 z-[110] flex flex-col items-center md:items-end gap-3 px-6 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-4 px-6 py-4 rounded-[2rem] shadow-2xl min-w-[300px] max-w-md animate-in slide-in-from-bottom-8 fade-in bg-text-primary/10 backdrop-blur-3xl border border-border-color/20 text-text-primary pointer-events-auto ring-1 ring-white/10"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.type === 'success' ? 'bg-green-500/20 text-green-400' :
                t.type === 'error' ? 'bg-red-500/20 text-red-400' :
                  'bg-blue-500/20 text-blue-400'
              }`}>
              {t.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {t.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {t.type === 'info' && <Info className="w-5 h-5" />}
            </div>
            <span className="flex-1 text-sm font-black uppercase tracking-wider leading-none">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="w-8 h-8 rounded-full hover:bg-text-primary/10 flex items-center justify-center transition-all">
              <X className="w-4 h-4 opacity-40 hover:opacity-100" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
