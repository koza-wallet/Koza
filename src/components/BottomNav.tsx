"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { path: "/", icon: "account_balance_wallet", label: "Beranda" },
  { path: "/transaksi", icon: "receipt_long", label: "Transaksi" },
] as const;

const SECONDARY_NAV_ITEMS = [
  { path: "/laporan", icon: "bar_chart", label: "Laporan" },
  { path: "/profil", icon: "person", label: "Profil" },
] as const;

/** Bottom tab bar, ported verbatim (markup + classes) from the Stitch export shared across every screen. */
export function BottomNav() {
  const pathname = usePathname();

  const linkClasses = (active: boolean) =>
    active
      ? "flex-1 h-full flex flex-col items-center justify-center transition-colors text-primary font-bold"
      : "flex-1 h-full flex flex-col items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors";

  return (
    <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface-container-lowest/85 backdrop-blur-xl shadow-[0_-4px_24px_rgba(15,23,42,0.06)]">
      <div className="relative h-16 max-w-md mx-auto px-space-xs flex items-center justify-between">
        {NAV_ITEMS.map((item, index) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              aria-current={active ? "page" : undefined}
              className={`${linkClasses(active)}${index === 0 ? "" : " pr-space-md"}`}
            >
              <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              <span className="font-label-md text-label-md mt-1">{item.label}</span>
            </Link>
          );
        })}
        <div className="relative w-14 flex items-center justify-center">
          <Link
            aria-label="Tambah Transaksi"
            href="/transaksi/tambah"
            className="absolute -top-7 w-14 h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-[0_10px_25px_-4px_rgba(16,185,129,0.4),0_4px_10px_-2px_rgba(16,185,129,0.2)] hover:scale-105 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[30px]">add</span>
          </Link>
        </div>
        {SECONDARY_NAV_ITEMS.map((item, index) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              aria-current={active ? "page" : undefined}
              className={`${linkClasses(active)}${index === 0 ? " pl-space-md" : ""}`}
            >
              <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
              <span className="font-label-md text-label-md mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
