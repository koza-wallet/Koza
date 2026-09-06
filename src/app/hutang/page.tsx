"use client";

import { useState } from "react";
import Link from "next/link";
import { useFinance } from "@/lib/finance-context";
import { formatRupiahAmount } from "@/lib/format";
import { DebtDetailModal } from "@/components/DebtDetailModal";

export default function HutangPage() {
  const { debts } = useFinance();
  const [activeTab, setActiveTab] = useState<"HUTANG" | "PIUTANG">("HUTANG");
  const [selectedDebt, setSelectedDebt] = useState<any>(null);

  const filteredDebts = debts?.filter(d => d.type === activeTab) || [];
  
  const totalAmount = filteredDebts.reduce((sum, d) => sum + d.amount, 0);
  const totalRemaining = filteredDebts.reduce((sum, d) => sum + d.remainingAmount, 0);

  return (
    <div className="min-h-screen bg-surface flex flex-col pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 px-space-md py-space-sm flex items-center justify-between">
        <div className="flex items-center gap-space-sm">
          <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="font-title-lg text-title-lg text-on-surface">Hutang & Piutang</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="px-space-md py-space-sm">
        <div className="flex bg-surface-container-low rounded-2xl p-1 relative">
          <div
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-primary rounded-xl transition-transform duration-300 ease-spring"
            style={{ transform: `translateX(${activeTab === "HUTANG" ? "0" : "100%"})` }}
          />
          
          <button
            onClick={() => setActiveTab("HUTANG")}
            className={`flex-1 py-2.5 font-label-lg transition-colors relative z-10 ${
              activeTab === "HUTANG" ? "text-on-primary" : "text-on-surface-variant"
            }`}
          >
            Hutang Saya
          </button>
          
          <button
            onClick={() => setActiveTab("PIUTANG")}
            className={`flex-1 py-2.5 font-label-lg transition-colors relative z-10 ${
              activeTab === "PIUTANG" ? "text-on-primary" : "text-on-surface-variant"
            }`}
          >
            Piutang Saya
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="px-space-md py-2">
        <div className={`p-5 rounded-3xl text-white shadow-elevation-2 relative overflow-hidden ${
          activeTab === "HUTANG" ? "bg-error" : "bg-primary"
        }`}>
          <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
            <span className="material-symbols-outlined text-[80px]">
              {activeTab === "HUTANG" ? "money_off" : "account_balance"}
            </span>
          </div>
          <h3 className="font-label-md opacity-90 mb-1">
            {activeTab === "HUTANG" ? "Total Hutang Belum Dibayar" : "Total Uang Anda di Luar"}
          </h3>
          <p className="font-display-sm font-bold">
            Rp {formatRupiahAmount(totalRemaining)}
          </p>
          <p className="font-body-sm opacity-80 mt-2">
            Dari total pinjaman awal: Rp {formatRupiahAmount(totalAmount)}
          </p>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 px-space-md py-4 flex flex-col gap-3">
        {filteredDebts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10 opacity-60">
            <span className="material-symbols-outlined text-[48px] mb-2">check_circle</span>
            <p className="font-body-lg">
              {activeTab === "HUTANG" ? "Hore! Anda tidak memiliki hutang." : "Tidak ada orang yang berhutang ke Anda."}
            </p>
          </div>
        ) : (
          filteredDebts.map((debt) => (
            <div 
              key={debt.id} 
              onClick={() => {
                if (debt.status !== "PAID") setSelectedDebt(debt);
              }}
              className={`bg-surface-container-lowest p-4 rounded-2xl flex items-center justify-between gap-4 shadow-sm border border-outline-variant/20 transition-transform ${debt.status !== "PAID" ? "cursor-pointer active:scale-95 hover:bg-surface-container-low" : "opacity-60 grayscale"}`}
            >
              <div className="flex items-center gap-4 flex-1 overflow-hidden">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  debt.status === "PAID" 
                    ? "bg-surface-variant text-on-surface-variant" 
                    : activeTab === "HUTANG" 
                      ? "bg-error-container text-on-error-container" 
                      : "bg-primary-container text-on-primary-container"
                }`}>
                  <span className="material-symbols-outlined text-[24px]">
                    {debt.status === "PAID" ? "task_alt" : "person"}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-title-md font-bold text-on-surface truncate">{debt.contactName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      debt.status === "PAID" 
                        ? "bg-surface-variant text-on-surface-variant" 
                        : "bg-tertiary-container text-on-tertiary-container"
                    }`}>
                      {debt.status === "PAID" ? "LUNAS" : "BELUM LUNAS"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right shrink-0">
                <p className="font-label-lg font-bold text-on-surface">
                  Rp {formatRupiahAmount(debt.remainingAmount)}
                </p>
                <p className="font-body-sm text-on-surface-variant mt-0.5">
                  dari Rp {formatRupiahAmount(debt.amount)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedDebt && (
        <DebtDetailModal debt={selectedDebt} onClose={() => setSelectedDebt(null)} />
      )}
    </div>
  );
}
