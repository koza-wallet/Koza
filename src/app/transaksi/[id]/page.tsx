"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { getCategoryById } from "@/lib/categories";
import { useFinance } from "@/lib/finance-context";
import { getWalletDisplayLabel } from "@/lib/finance";
import { formatFullDateId, formatRupiahAmount, formatTimeId } from "@/lib/format";

export default function DetailTransaksiPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { transactions, wallets, deleteTransaction } = useFinance();
  const [toast, setToast] = useState<string | null>(null);

  const transaction = transactions.find((t) => t.id === id);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  }

  function handleCopyId(transactionId: string) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(transactionId).then(
        () => showToast("ID Referensi disalin ke clipboard"),
        () => showToast(`ID Transaksi: ${transactionId}`)
      );
    } else {
      showToast(`ID Transaksi: ${transactionId}`);
    }
  }

  function handleShare(title: string, amountLabel: string) {
    if (navigator.share) {
      navigator
        .share({ title: "Bukti Transaksi KoZa", text: `${title} - ${amountLabel}`, url: window.location.href })
        .catch(() => {});
    } else {
      showToast("Tautan rincian disalin untuk dibagikan");
    }
  }

  function handleDelete(transactionId: string) {
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus transaksi ini? Saldo Anda akan dikalkulasi ulang."
    );
    if (!confirmed) return;
    deleteTransaction(transactionId);
    router.push("/transaksi");
  }

  return (
    <>
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-margin-screen flex items-center justify-between">
          <div className="flex items-center gap-space-xs">
            <button
              aria-label="Kembali"
              onClick={() => router.back()}
              className="w-11 h-11 flex items-center justify-center -ml-2 rounded-full text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Detail Transaksi</h1>
          </div>
          <div className="flex items-center gap-space-xs">
            {transaction && (
              <button
                aria-label="Bagikan bukti transaksi"
                onClick={() =>
                  handleShare(
                    transaction.title,
                    `${transaction.direction === "income" ? "+" : "-"}Rp ${formatRupiahAmount(transaction.amount)}`
                  )
                }
                className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {!transaction ? (
        <main className="flex-1 flex flex-col items-center justify-center gap-space-sm px-margin-screen pt-16 pb-28 bg-surface text-center">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[32px]">receipt_long</span>
          </div>
          <span className="font-headline-sm text-headline-sm text-on-surface">Transaksi Tidak Ditemukan</span>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
            Transaksi ini mungkin sudah dihapus atau tautannya tidak valid.
          </p>
        </main>
      ) : (
        <DetailTransaksiContent
          transaction={transaction}
          walletLabel={
            transaction.walletId
              ? (() => {
                  const wallet = wallets.find((w) => w.id === transaction.walletId);
                  return wallet ? getWalletDisplayLabel(wallet) : "Tidak diketahui";
                })()
              : "Tidak diketahui"
          }
          onCopyId={() => handleCopyId(transaction.id)}
          onDownload={() => showToast("Mengunduh resi transaksi (PDF)...")}
          onEdit={() => router.push(`/transaksi/tambah?id=${transaction.id}`)}
          onDelete={() => handleDelete(transaction.id)}
        />
      )}

      <div
        className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-space-md py-space-xs rounded-full bg-inverse-surface text-inverse-on-surface shadow-2xl flex items-center gap-space-xs z-50 max-w-[90vw] transition-all duration-300 ${
          toast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <span
          className="material-symbols-outlined text-[18px] text-primary-fixed"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          check_circle
        </span>
        <span className="font-body-sm text-body-sm">{toast}</span>
      </div>

      <BottomNav />
    </>
  );
}

interface DetailTransaksiContentProps {
  transaction: ReturnType<typeof useFinance>["transactions"][number];
  walletLabel: string;
  onCopyId: () => void;
  onDownload: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function DetailTransaksiContent({
  transaction,
  walletLabel,
  onCopyId,
  onDownload,
  onEdit,
  onDelete,
}: DetailTransaksiContentProps) {
  const category = getCategoryById(transaction.categoryId);
  const isIncome = transaction.direction === "income";
  const sign = isIncome ? "+" : "-";
  const amountColor = isIncome ? "text-primary" : "text-tertiary";
  const date = new Date(transaction.timestamp);

  return (
    <main className="flex-1 flex flex-col relative w-full pt-16 pb-28 bg-surface">
      <div className="flex flex-col w-full px-margin-screen space-y-space-md pb-space-lg">
        {/* Hero Card Nominal & Status */}
        <section className="bg-surface-container-lowest rounded-[24px] p-space-lg shadow-sm flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-tertiary/10 rounded-full blur-3xl pointer-events-none" />
          <div
            className={`w-16 h-16 rounded-2xl ${category.bg} ${category.text} flex items-center justify-center mb-space-sm shadow-inner relative`}
          >
            <span className="material-symbols-outlined text-[32px]">{transaction.categoryIcon}</span>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-surface-container-lowest border border-surface-container flex items-center justify-center">
              <span className={`material-symbols-outlined text-[12px] font-bold ${amountColor}`}>
                {isIncome ? "arrow_upward" : "arrow_downward"}
              </span>
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-primary/10 text-primary mb-space-xs">
            <span
              className="material-symbols-outlined text-[15px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
            <span className="font-label-caps text-label-caps uppercase tracking-wider">Transaksi Berhasil</span>
          </div>
          <div className="mt-1 flex items-baseline justify-center gap-1">
            <span className={`text-[34px] font-bold tracking-tight ${amountColor}`}>
              {sign}Rp {formatRupiahAmount(transaction.amount)}
            </span>
          </div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface mt-1">{transaction.title}</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
            {formatFullDateId(date)} • {formatTimeId(date)} WIB
          </p>
        </section>

        {/* Data Lengkap Card */}
        <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-md">
          <div className="flex items-center justify-between pb-space-xs border-b border-surface-container">
            <h3 className="font-label-lg text-label-lg text-on-surface">Data Lengkap</h3>
            <span className={`font-label-md text-label-md ${amountColor}`}>
              {isIncome ? "Pemasukan" : "Pengeluaran"}
            </span>
          </div>
          <div className="flex items-start justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs text-on-surface-variant">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">{transaction.categoryIcon}</span>
              </div>
              <span className="font-body-md text-body-md">Kategori</span>
            </div>
            <div className="text-right">
              <span className="font-label-md text-label-md text-on-surface block">{category.name}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{transaction.category}</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs text-on-surface-variant">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              </div>
              <span className="font-body-md text-body-md">Sumber Dana</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-label-md text-label-md text-on-surface">{walletLabel}</span>
              {walletLabel !== "Tidak diketahui" && <span className="w-2 h-2 rounded-full bg-primary" />}
            </div>
          </div>
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs text-on-surface-variant">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">tag</span>
              </div>
              <span className="font-body-md text-body-md">ID Referensi</span>
            </div>
            <button
              type="button"
              onClick={onCopyId}
              title="Salin ID Referensi"
              className="flex items-center gap-1.5 bg-surface-container-low hover:bg-surface-container px-space-xs py-1.5 rounded-lg transition-colors"
            >
              <span className="font-label-md text-label-md text-on-surface font-mono">{transaction.id}</span>
              <span className="material-symbols-outlined text-[15px] text-on-surface-variant">content_copy</span>
            </button>
          </div>
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-xs text-on-surface-variant">
              <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
              </div>
              <span className="font-body-md text-body-md">Metode Bayar</span>
            </div>
            <span className="font-label-md text-label-md text-on-surface">{transaction.paymentMethod}</span>
          </div>

          {transaction.note && (
            <div className="bg-surface-container-low rounded-xl p-space-sm space-y-1">
              <div className="flex items-center gap-1.5 text-on-surface-variant">
                <span className="material-symbols-outlined text-[15px]">edit_note</span>
                <span className="font-label-caps text-label-caps uppercase tracking-wider">Catatan Tambahan</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface italic">&ldquo;{transaction.note}&rdquo;</p>
            </div>
          )}
        </section>

        {/* Rincian Pembayaran Card */}
        <section className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm space-y-space-sm">
          <h3 className="font-label-lg text-label-lg text-on-surface pb-space-xs border-b border-surface-container">
            Rincian Pembayaran
          </h3>
          <div className="flex justify-between items-center">
            <span className="font-body-md text-body-md text-on-surface-variant">Nominal Transaksi</span>
            <span className="font-label-md text-label-md text-on-surface">
              Rp {formatRupiahAmount(transaction.amount)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-body-md text-body-md text-on-surface-variant">Biaya Admin</span>
            <span className="font-label-md text-label-md text-primary">Rp 0 (Gratis)</span>
          </div>
          <div className="pt-space-xs mt-space-xxs border-t border-surface-container flex justify-between items-center">
            <span className="font-label-lg text-label-lg text-on-surface">Total</span>
            <span className={`font-headline-sm text-headline-sm ${amountColor}`}>
              {sign}Rp {formatRupiahAmount(transaction.amount)}
            </span>
          </div>
        </section>

        {/* Tombol Aksi */}
        <div className="space-y-space-xs pt-space-xxs">
          <button
            type="button"
            onClick={onDownload}
            className="w-full h-12 rounded-xl bg-surface-container-lowest shadow-sm text-on-surface flex items-center justify-center gap-space-xs font-label-lg text-label-lg hover:bg-surface-container-low transition-all active:scale-[0.99]"
          >
            <span className="material-symbols-outlined text-[20px] text-primary">download</span>
            <span>Unduh Resi / Bukti Pembayaran</span>
          </button>
          <div className="grid grid-cols-2 gap-space-xs">
            <button
              type="button"
              onClick={onEdit}
              className="h-11 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center gap-1.5 font-label-lg text-label-lg transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">edit</span>
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="h-11 rounded-xl bg-error-container hover:bg-error/20 text-on-error-container flex items-center justify-center gap-1.5 font-label-lg text-label-lg transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">delete_outline</span>
              <span>Hapus Data</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
