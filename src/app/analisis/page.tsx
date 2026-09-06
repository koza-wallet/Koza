"use client";

import Link from "next/link";
import { useFinance } from "@/lib/finance-context";
import { calculateHealthScore } from "@/lib/analysis";
import { useMemo } from "react";

export default function AnalisisPage() {
  const { transactions, wallets, pockets } = useFinance();
  const healthData = useMemo(() => calculateHealthScore(transactions, wallets, pockets?.length || 0), [transactions, wallets, pockets]);

  return (
    <>
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-margin-screen flex items-center gap-space-sm">
          <Link
            href="/"
            aria-label="Kembali ke Beranda"
            className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </Link>
          <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Analisis Kesehatan</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-20 pb-10 bg-surface min-h-screen px-margin-screen space-y-space-lg">
        
        {/* Main Score Card */}
        <div className="bg-primary-container p-space-lg rounded-[24px] flex flex-col items-center justify-center text-center shadow-sm mt-space-sm relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary/10 pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-primary/10 pointer-events-none" />
          
          <span className="font-label-lg text-label-lg text-on-primary-container opacity-80 uppercase tracking-widest mb-1">
            Skor Finansial
          </span>
          <div className="flex items-end gap-1 relative z-10">
            <span className="font-display-lg text-display-lg text-on-primary-container leading-none">
              {healthData.totalScore}
            </span>
            <span className="font-headline-sm text-headline-sm text-on-primary-container opacity-70 mb-1">
              /100
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-primary-container mt-space-sm font-medium z-10">
            {healthData.overallTip}
          </p>
        </div>

        <h2 className="font-headline-sm text-headline-sm text-on-surface">Rincian Penilaian</h2>

        <div className="space-y-space-md">
          {/* Cashflow */}
          <div className="bg-surface-container-lowest p-space-md rounded-[18px] shadow-sm flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">account_balance</span>
                <span className="font-label-lg text-label-lg text-on-surface">Arus Kas</span>
              </div>
              <span className="font-label-md text-label-md text-primary font-bold">
                {healthData.cashflow.score} / {healthData.cashflow.max}
              </span>
            </div>
            <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-1000" 
                style={{ width: `${(healthData.cashflow.score / healthData.cashflow.max) * 100}%` }} 
              />
            </div>
            <div className="flex flex-col mt-1">
              <span className="font-label-md text-label-md text-on-surface">{healthData.cashflow.label}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{healthData.cashflow.tip}</span>
            </div>
          </div>

          {/* Savings */}
          <div className="bg-surface-container-lowest p-space-md rounded-[18px] shadow-sm flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">savings</span>
                <span className="font-label-lg text-label-lg text-on-surface">Rasio Tabungan</span>
              </div>
              <span className="font-label-md text-label-md text-secondary font-bold">
                {healthData.savings.score} / {healthData.savings.max}
              </span>
            </div>
            <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-secondary h-full rounded-full transition-all duration-1000" 
                style={{ width: `${(healthData.savings.score / healthData.savings.max) * 100}%` }} 
              />
            </div>
            <div className="flex flex-col mt-1">
              <span className="font-label-md text-label-md text-on-surface">{healthData.savings.label}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{healthData.savings.tip}</span>
            </div>
          </div>

          {/* Debt */}
          <div className="bg-surface-container-lowest p-space-md rounded-[18px] shadow-sm flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-[20px]">credit_card_off</span>
                <span className="font-label-lg text-label-lg text-on-surface">Beban Hutang</span>
              </div>
              <span className="font-label-md text-label-md text-error font-bold">
                {healthData.debt.score} / {healthData.debt.max}
              </span>
            </div>
            <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-error h-full rounded-full transition-all duration-1000" 
                style={{ width: `${(healthData.debt.score / healthData.debt.max) * 100}%` }} 
              />
            </div>
            <div className="flex flex-col mt-1">
              <span className="font-label-md text-label-md text-on-surface">{healthData.debt.label}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{healthData.debt.tip}</span>
            </div>
          </div>

          {/* Pockets */}
          <div className="bg-surface-container-lowest p-space-md rounded-[18px] shadow-sm flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[20px]">inventory_2</span>
                <span className="font-label-lg text-label-lg text-on-surface">Alokasi Kantong</span>
              </div>
              <span className="font-label-md text-label-md text-tertiary font-bold">
                {healthData.pocket.score} / {healthData.pocket.max}
              </span>
            </div>
            <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden mt-1">
              <div 
                className="bg-tertiary h-full rounded-full transition-all duration-1000" 
                style={{ width: `${(healthData.pocket.score / healthData.pocket.max) * 100}%` }} 
              />
            </div>
            <div className="flex flex-col mt-1">
              <span className="font-label-md text-label-md text-on-surface">{healthData.pocket.label}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{healthData.pocket.tip}</span>
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
