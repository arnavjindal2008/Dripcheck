"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from "react";

type ToastType = "success" | "error" | "info";

interface ToastMsg {
  message: string;
  type: ToastType;
  id: number;
}

interface UIStoreContext {
  loading: boolean;
  loadingMessage: string;
  loadingTitle?: string;
  setLoading: (state: boolean, message?: string, title?: string) => void;
  toast: (message: string, type?: ToastType) => void;
  toasts: ToastMsg[];
  removeToast: (id: number) => void;
}

const UIContext = createContext<UIStoreContext | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [loading, setLoadingState] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingTitle, setLoadingTitle] = useState("");
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const setLoading = useCallback((state: boolean, message: string = "", title: string = "") => {
    setLoadingState(state);
    setLoadingMessage(message);
    setLoadingTitle(title);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now();
    setToasts([{ message, type, id }]);
    setTimeout(() => {
      removeToast(id);
    }, 3000);
  }, [removeToast]);

  const value = useMemo(() => ({
    loading,
    setLoading,
    loadingMessage,
    loadingTitle,
    toast,
    toasts,
    removeToast
  }), [loading, setLoading, loadingMessage, loadingTitle, toast, toasts, removeToast]);

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

export function useUIStore() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUIStore must be used within a UIProvider");
  }
  return context;
}
