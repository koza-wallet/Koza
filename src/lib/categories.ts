import type { TransactionDirection } from "./types";

export interface CategoryOption {
  id: string;
  /** Short label, matches the picker chip text in the Stitch "Catat Transaksi" export. */
  name: string;
  /** Longer label used as the transaction's category text on Beranda/Riwayat rows. */
  fullName: string;
  icon: string;
  bg: string;
  text: string;
  /** Only "Makan" carries this in the Stitch export's static markup; the picker script never toggles it on selection, so it's an always-on property of that one category, not a selected-state style. */
  iconShadow?: boolean;
  /** Which transaction direction(s) this category is offered for in the Catat Transaksi picker. */
  appliesTo: TransactionDirection[];
}

/**
 * The 8 expense categories, icons, and chip colors ported verbatim from the
 * Stitch "Catat Transaksi" screen's category grid, plus 3 income categories
 * added so "Duit Masuk" transactions have their own accurate categorization
 * instead of reusing expense-themed ones — styled with the same token
 * combinations Stitch already uses elsewhere in this catalog (no new colors
 * invented). Shared by the picker and by any screen that needs to resolve a
 * category id to its display data.
 */
export const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    id: "makan",
    name: "Makan",
    fullName: "Makanan & Minuman",
    icon: "restaurant",
    bg: "bg-tertiary-fixed",
    text: "text-on-tertiary-fixed",
    iconShadow: true,
    appliesTo: ["expense"],
  },
  {
    id: "belanja",
    name: "Belanja",
    fullName: "Belanja Kebutuhan",
    icon: "shopping_bag",
    bg: "bg-secondary-fixed",
    text: "text-on-secondary-fixed",
    appliesTo: ["expense"],
  },
  {
    id: "transport",
    name: "Transport",
    fullName: "Transportasi",
    icon: "directions_car",
    bg: "bg-surface-variant",
    text: "text-on-surface-variant",
    appliesTo: ["expense"],
  },
  {
    id: "tagihan",
    name: "Tagihan",
    fullName: "Tagihan & Utilitas",
    icon: "receipt_long",
    bg: "bg-error-container",
    text: "text-on-error-container",
    appliesTo: ["expense"],
  },
  {
    id: "hiburan",
    name: "Hiburan",
    fullName: "Hiburan & Rekreasi",
    icon: "sports_esports",
    bg: "bg-secondary-fixed-dim",
    text: "text-on-secondary-fixed-variant",
    appliesTo: ["expense"],
  },
  {
    id: "kesehatan",
    name: "Kesehatan",
    fullName: "Kesehatan",
    icon: "favorite",
    bg: "bg-tertiary-fixed-dim",
    text: "text-on-tertiary-fixed-variant",
    appliesTo: ["expense"],
  },
  {
    id: "gaji",
    name: "Gaji",
    fullName: "Pemasukan Pokok",
    icon: "payments",
    bg: "bg-primary-fixed",
    text: "text-on-primary-fixed",
    appliesTo: ["income"],
  },
  {
    id: "bonus",
    name: "Bonus",
    fullName: "Bonus & Hadiah",
    icon: "redeem",
    bg: "bg-secondary-fixed",
    text: "text-on-secondary-fixed",
    appliesTo: ["income"],
  },
  {
    id: "investasi",
    name: "Investasi",
    fullName: "Investasi & Dividen",
    icon: "trending_up",
    bg: "bg-tertiary-fixed-dim",
    text: "text-on-tertiary-fixed-variant",
    appliesTo: ["income"],
  },
  {
    id: "usaha",
    name: "Usaha",
    fullName: "Usaha & Bisnis",
    icon: "work",
    bg: "bg-primary-fixed",
    text: "text-on-primary-fixed",
    appliesTo: ["income", "expense"],
  },
  {
    id: "lainnya",
    name: "Lainnya",
    fullName: "Lainnya",
    icon: "more_horiz",
    bg: "bg-surface-dim",
    text: "text-on-surface-variant",
    appliesTo: ["income", "expense"],
  },
];

export const DEFAULT_EXPENSE_CATEGORY_ID = "makan";
export const DEFAULT_INCOME_CATEGORY_ID = "gaji";

export function getCategoriesForDirection(direction: TransactionDirection): CategoryOption[] {
  return CATEGORY_OPTIONS.filter((c) => c.appliesTo.includes(direction));
}

export function getCategoryById(id: string): CategoryOption {
  return CATEGORY_OPTIONS.find((c) => c.id === id) ?? CATEGORY_OPTIONS[0];
}

export function getCategoryByIcon(icon: string): CategoryOption | undefined {
  return CATEGORY_OPTIONS.find((c) => c.icon === icon);
}
