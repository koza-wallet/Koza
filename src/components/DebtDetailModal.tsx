"use client";

import { useState } from "react";
import { useFinance } from "@/lib/finance-context";
import { formatRupiahAmount } from "@/lib/format";

interface DebtDetailModalProps {
  debt: any;
  onClose: () => void;
}

export function DebtDetailModal({ debt, onClose }: DebtDetailModalProps) {
  const { payDebt, wallets } = useFinance();
  const [amount, setAmount] = useState("");
  const [walletId, setWalletId] = useState(wallets[0]?.id || "");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isDebt = debt.type === "HUTANG";

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = Number(amount.replace(/\D/g, ""));
    
    if (rawAmount <= 0) {
      setErrorMsg("Nominal harus lebih dari 0");
      return;
    }
    
    if (rawAmount > debt.remainingAmount) {
      setErrorMsg(`Nominal melebihi sisa ${isDebt ? 'hutang' : 'piutang'}`);
      return;
    }

    if (isDebt) {
      const selectedWallet = wallets.find(w => w.id === walletId);
      if (selectedWallet && rawAmount > selectedWallet.balance) {
        setErrorMsg(`Saldo dompet tidak cukup`);
        return;
      }
    }

    setStatus("saving");
    try {
      await payDebt({
        debtId: debt.id,
        amount: rawAmount,
        walletId,
        date: new Date().toISOString()
      });
      setStatus("success");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setStatus("error");
      setErrorMsg("Gagal menyimpan pembayaran");
    }
  };

  const formatInputRupiah = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (!numbers) return "";
    return new Intl.NumberFormat("id-ID").format(Number(numbers));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl overflow-hidden shadow-elevation-3 animate-slide-up sm:animate-zoom-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-outline-variant/30">
          <h2 className="text-title-lg font-title-lg text-on-surface">
            {isDebt ? "Bayar Cicilan Hutang" : "Terima Cicilan Piutang"}
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Info */}
        <div className="p-4 bg-surface-container-low">
          <p className="text-body-md text-on-surface-variant">
            {isDebt ? "Ke: " : "Dari: "}
            <span className="font-bold text-on-surface">{debt.contactName}</span>
          </p>
          <div className="mt-2 flex justify-between items-center">
            <span className="text-label-lg text-on-surface-variant">Sisa belum dibayar:</span>
            <span className="text-title-md font-bold text-on-surface">Rp {formatRupiahAmount(debt.remainingAmount)}</span>
          </div>
        </div>

        {/* Form */}
        <div className="p-4 overflow-y-auto">
          {status === "success" ? (
            <div className="py-8 flex flex-col items-center justify-center text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px]">check_circle</span>
              </div>
              <h3 className="text-title-md font-bold text-on-surface">Pembayaran Berhasil!</h3>
              <p className="text-body-md text-on-surface-variant mt-2">Sisa hutang telah diperbarui.</p>
            </div>
          ) : (
            <form onSubmit={handlePay} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-label-md text-on-surface-variant">Nominal Cicilan</label>
                <div className="relative flex items-center bg-surface-container-low rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all">
                  <span className="pl-4 font-bold text-on-surface-variant">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => {
                      setAmount(formatInputRupiah(e.target.value));
                      setErrorMsg("");
                    }}
                    placeholder="0"
                    className="w-full bg-transparent p-4 text-title-lg font-bold text-on-surface outline-none"
                    autoFocus
                  />
                </div>
                {errorMsg && <p className="text-error text-label-sm mt-1">{errorMsg}</p>}
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-label-md text-on-surface-variant">Sumber Dompet</label>
                <div className="relative">
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full appearance-none bg-surface-container-low rounded-2xl p-4 pr-12 text-body-lg text-on-surface outline-none focus:ring-2 focus:ring-primary transition-all"
                  >
                    {wallets.map(w => (
                      <option key={w.id} value={w.id}>{w.name} (Rp {formatRupiahAmount(w.balance)})</option>
                    ))}
                  </select>
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={status === "saving" || !amount}
                className="mt-4 w-full rounded-full py-3.5 px-6 font-label-lg font-bold flex items-center justify-center gap-2 transition-all bg-primary text-on-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "saving" ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Memproses...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">payments</span>
                    Simpan Cicilan
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
