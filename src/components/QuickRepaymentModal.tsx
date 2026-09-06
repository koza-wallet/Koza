"use client";

import { useState, useMemo } from "react";
import { useFinance } from "@/lib/finance-context";
import { formatRupiahAmount } from "@/lib/format";
import { getWalletDisplayLabel } from "@/lib/finance";

interface QuickRepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickRepaymentModal({ isOpen, onClose }: QuickRepaymentModalProps) {
  const { debts, wallets, payDebt } = useFinance();

  const [repayType, setRepayType] = useState<"PAY_HUTANG" | "COLLECT_PIUTANG">("PAY_HUTANG");
  const [selectedDebtId, setSelectedDebtId] = useState("");
  const [rawAmount, setRawAmount] = useState<number>(0);
  const [walletId, setWalletId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving">("idle");

  const defaultWalletId = useMemo(() => wallets[0]?.id ?? "", [wallets]);
  const resolvedWalletId = wallets.some((w) => w.id === walletId) ? walletId : defaultWalletId;

  if (!isOpen) return null;

  const targetType = repayType === "PAY_HUTANG" ? "HUTANG" : "PIUTANG";
  const activeDebts = debts.filter(d => d.type === targetType && d.status !== "PAID");
  const selectedDebt = activeDebts.find(d => d.id === selectedDebtId);

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    if (!digitsOnly) {
      setRawAmount(0);
      setError(null);
      return;
    }
    const parsed = parseInt(digitsOnly, 10);
    if (!isNaN(parsed) && parsed <= 999_999_999_999) {
      setRawAmount(parsed);
      setError(null);
    }
  }

  async function handleSave() {
    if (!selectedDebtId) {
      setError("Pilih tagihan terlebih dahulu");
      return;
    }
    if (!rawAmount || rawAmount <= 0) {
      setError("Nominal harus lebih dari 0");
      return;
    }
    if (!resolvedWalletId) {
      setError("Pilih dompet yang akan digunakan");
      return;
    }

    setStatus("saving");
    try {
      await payDebt({
        debtId: selectedDebtId,
        amount: rawAmount,
        walletId: resolvedWalletId,
        date: new Date().toISOString(),
      });
      setStatus("idle");
      setRawAmount(0);
      setSelectedDebtId("");
      onClose();
    } catch (e) {
      setError("Terjadi kesalahan saat menyimpan pembayaran.");
      setStatus("idle");
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 pb-0">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-surface sm:rounded-[24px] rounded-t-[24px] shadow-2xl flex flex-col overflow-hidden animate-slide-up-fade">
        <div className="flex items-center justify-between p-margin-screen border-b border-outline-variant/20">
          <h2 className="font-headline-sm text-headline-sm text-on-surface">Bayar / Cicil</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-margin-screen overflow-y-auto max-h-[70vh] flex flex-col gap-space-md">
          
          <div className="flex gap-2 p-1 bg-surface-container-low rounded-lg">
            <button
              type="button"
              onClick={() => { setRepayType("PAY_HUTANG"); setSelectedDebtId(""); }}
              className={`flex-1 py-2 rounded-md font-label-md transition-colors ${
                repayType === "PAY_HUTANG" ? "bg-surface shadow-sm text-error font-bold" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Bayar Hutang Saya
            </button>
            <button
              type="button"
              onClick={() => { setRepayType("COLLECT_PIUTANG"); setSelectedDebtId(""); }}
              className={`flex-1 py-2 rounded-md font-label-md transition-colors ${
                repayType === "COLLECT_PIUTANG" ? "bg-surface shadow-sm text-primary font-bold" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Terima Cicilan
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              {repayType === "PAY_HUTANG" ? "Bayar Ke:" : "Terima Dari:"}
            </label>
            <div className="relative flex items-center gap-space-xs p-space-sm rounded-lg bg-surface-container-low focus-within:ring-2 ring-primary transition-shadow">
              <span className="material-symbols-outlined text-outline text-[20px]">person</span>
              <select
                className="flex-1 bg-transparent font-body-lg text-body-lg text-on-surface appearance-none focus:outline-none cursor-pointer"
                value={selectedDebtId}
                onChange={(e) => setSelectedDebtId(e.target.value)}
              >
                <option value="" disabled>Pilih nama kontak...</option>
                {activeDebts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.contactName} - Sisa Rp {formatRupiahAmount(d.remainingAmount)}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-outline pointer-events-none absolute right-3">expand_more</span>
            </div>
            {activeDebts.length === 0 && (
              <p className="text-body-sm text-error mt-1">Tidak ada tagihan aktif.</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Nominal
            </label>
            <div className="flex items-center gap-space-xs p-space-sm rounded-lg bg-surface-container-low focus-within:ring-2 ring-primary transition-shadow">
              <span className="font-body-lg text-body-lg text-on-surface-variant opacity-70">Rp</span>
              <input
                type="text"
                className="flex-1 bg-transparent font-headline-md text-headline-md text-on-surface placeholder:text-outline focus:outline-none"
                placeholder="0"
                value={rawAmount > 0 ? formatRupiahAmount(rawAmount) : ""}
                onChange={handleAmountChange}
              />
            </div>
            {selectedDebt && rawAmount > selectedDebt.remainingAmount && (
              <p className="text-body-sm text-secondary mt-1">
                Wah, bayarnya lebih dari sisa tagihan (Rp {formatRupiahAmount(selectedDebt.remainingAmount)}). Sisa tagihan akan otomatis lunas.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              {repayType === "PAY_HUTANG" ? "Gunakan Saldo Dari:" : "Masukkan Saldo Ke:"}
            </label>
            <div className="relative flex items-center gap-space-xs p-space-sm rounded-lg bg-surface-container-low focus-within:ring-2 ring-primary transition-shadow">
              <span className="material-symbols-outlined text-outline text-[20px]">account_balance_wallet</span>
              <select
                className="flex-1 bg-transparent font-body-lg text-body-lg text-on-surface appearance-none focus:outline-none cursor-pointer"
                value={resolvedWalletId}
                onChange={(e) => setWalletId(e.target.value)}
              >
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {getWalletDisplayLabel(wallet)}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined text-outline pointer-events-none absolute right-3">expand_more</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
              {error}
            </div>
          )}
        </div>

        <div className="p-margin-screen border-t border-outline-variant/20 bg-surface pb-safe">
          <button
            type="button"
            disabled={status !== "idle" || !selectedDebtId}
            onClick={handleSave}
            className="w-full h-[52px] bg-primary hover:bg-primary-container text-on-primary rounded-2xl flex items-center justify-center font-label-lg text-label-lg shadow-md hover:shadow-lg active:scale-[0.99] transition-all disabled:opacity-80 disabled:pointer-events-none"
          >
            {status === "idle" ? "Simpan Pembayaran" : "Menyimpan..."}
          </button>
        </div>
      </div>
    </div>
  );
}
