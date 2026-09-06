"use client";

import { useState } from "react";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PaywallModal({ isOpen, onClose, onSuccess }: PaywallModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");

  if (!isOpen) return null;

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate payment gateway redirect/processing
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0">
      <div 
        className="w-full max-w-md bg-surface-container-lowest rounded-[28px] overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:fade-in-0 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface-variant z-10 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="relative pt-12 pb-6 px-6 bg-gradient-to-b from-primary-container/40 to-surface-container-lowest">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px] text-on-primary">workspace_premium</span>
          </div>
          <h2 className="font-headline-md text-headline-md text-center text-on-surface mb-2 tracking-tight">
            Tingkatkan ke KoZa <span className="text-primary font-bold">PREMIUM</span>
          </h2>
          <p className="font-body-md text-body-md text-center text-on-surface-variant max-w-[280px] mx-auto">
            Buka seluruh fitur eksklusif dan jadilah ahli dalam mengelola keuangan Anda.
          </p>
        </div>

        <div className="px-6 pb-6">
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-primary mt-0.5">check_circle</span>
              <span className="font-body-md text-body-md text-on-surface">Fitur <strong>Pengingat Harian</strong> (Notifikasi Push)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-primary mt-0.5">check_circle</span>
              <span className="font-body-md text-body-md text-on-surface">Ekspor pembukuan ke <strong>CSV tanpa batas</strong></span>
            </li>
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-primary mt-0.5">check_circle</span>
              <span className="font-body-md text-body-md text-on-surface">Analisis kesehatan finansial lebih mendalam</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-primary mt-0.5">check_circle</span>
              <span className="font-body-md text-body-md text-on-surface">Prioritas dukungan pelanggan (Customer Support)</span>
            </li>
          </ul>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`p-3 rounded-xl border-2 text-left transition-all relative ${
                selectedPlan === "monthly" 
                  ? "border-primary bg-primary-container/20" 
                  : "border-outline-variant bg-surface"
              }`}
            >
              <div className="font-label-md text-label-md text-on-surface-variant mb-1">Bulanan</div>
              <div className="font-title-md text-title-md text-on-surface font-bold">Rp 19.000</div>
              <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">/ bulan</div>
            </button>

            <button
              onClick={() => setSelectedPlan("yearly")}
              className={`p-3 rounded-xl border-2 text-left transition-all relative overflow-hidden ${
                selectedPlan === "yearly" 
                  ? "border-primary bg-primary-container/20" 
                  : "border-outline-variant bg-surface"
              }`}
            >
              <div className="absolute top-0 right-0 bg-primary text-on-primary font-label-sm text-label-sm px-2 py-0.5 rounded-bl-lg font-bold">
                Hemat 34%
              </div>
              <div className="font-label-md text-label-md text-on-surface-variant mb-1">Tahunan</div>
              <div className="font-title-md text-title-md text-on-surface font-bold">Rp 149.000</div>
              <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">/ tahun</div>
            </button>
          </div>

          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full bg-primary text-on-primary font-label-lg text-label-lg py-4 rounded-full shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                <span>Memproses Pembayaran...</span>
              </>
            ) : (
              <span>Lanjutkan Pembayaran</span>
            )}
          </button>
          
          <p className="font-label-sm text-label-sm text-center text-on-surface-variant mt-4">
            Berlangganan dapat dibatalkan kapan saja.
          </p>
        </div>
      </div>
    </div>
  );
}
