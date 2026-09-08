"use client";

import { useState } from "react";

interface ToastProps {
  message: string | null;
  variant?: "info" | "error";
}

/** Notifikasi ringan di bawah layar — pengganti `alert()`, mengikuti gaya toast yang sudah dipakai di Beranda/Kategori. */
export function Toast({ message, variant = "info" }: ToastProps) {
  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-space-md py-space-xs rounded-full bg-inverse-surface text-inverse-on-surface shadow-2xl flex items-center gap-space-xs z-[110] max-w-[90vw] transition-all duration-300 ${
        message ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      }`}
    >
      <span
        className={`material-symbols-outlined text-[18px] ${variant === "error" ? "text-error" : "text-primary-fixed"}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        {variant === "error" ? "error" : "info"}
      </span>
      <span className="font-body-sm text-body-sm text-center">{message}</span>
    </div>
  );
}

/** Hook kecil untuk mengelola state toast (pesan + varian + auto-hide). */
export function useToast() {
  const [state, setState] = useState<{ message: string | null; variant: "info" | "error" }>({
    message: null,
    variant: "info",
  });

  function showToast(message: string, variant: "info" | "error" = "info") {
    setState({ message, variant });
    window.setTimeout(() => setState((s) => ({ ...s, message: null })), 2400);
  }

  return { toast: state.message, toastVariant: state.variant, showToast };
}
