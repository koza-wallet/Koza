"use client";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Tampilkan tombol konfirmasi dengan warna bahaya (mis. untuk aksi hapus). */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Modal konfirmasi in-app — pengganti `window.confirm`, mengikuti gaya bottom-sheet aplikasi. */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Ya, Lanjutkan",
  cancelLabel = "Batal",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <button
        aria-label="Tutup"
        type="button"
        onClick={onCancel}
        className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm bg-surface-container-lowest rounded-t-[28px] sm:rounded-[28px] p-space-lg pb-safe shadow-2xl space-y-space-md">
        <div className="flex items-center gap-space-sm">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
              danger ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">
              {danger ? "warning" : "help"}
            </span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant">{message}</p>

        <div className="flex items-center gap-space-sm pt-space-xs">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 h-12 rounded-xl border border-outline-variant text-on-surface font-label-lg text-label-lg hover:bg-surface-container-low transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 h-12 rounded-xl font-label-lg text-label-lg transition-colors ${
              danger
                ? "bg-error text-on-error hover:bg-error/90"
                : "bg-primary text-on-primary hover:bg-primary/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
