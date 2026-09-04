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
}

/**
 * The 8 categories, icons, and chip colors ported verbatim from the Stitch
 * "Catat Transaksi" screen's category grid. Shared by the picker and by any
 * screen that needs to resolve a category id to its display data.
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
  },
  {
    id: "belanja",
    name: "Belanja",
    fullName: "Belanja Kebutuhan",
    icon: "shopping_bag",
    bg: "bg-secondary-fixed",
    text: "text-on-secondary-fixed",
  },
  {
    id: "transport",
    name: "Transport",
    fullName: "Transportasi",
    icon: "directions_car",
    bg: "bg-surface-variant",
    text: "text-on-surface-variant",
  },
  {
    id: "tagihan",
    name: "Tagihan",
    fullName: "Tagihan & Utilitas",
    icon: "receipt_long",
    bg: "bg-error-container",
    text: "text-on-error-container",
  },
  {
    id: "hiburan",
    name: "Hiburan",
    fullName: "Hiburan & Rekreasi",
    icon: "sports_esports",
    bg: "bg-secondary-fixed-dim",
    text: "text-on-secondary-fixed-variant",
  },
  {
    id: "kesehatan",
    name: "Kesehatan",
    fullName: "Kesehatan",
    icon: "favorite",
    bg: "bg-tertiary-fixed-dim",
    text: "text-on-tertiary-fixed-variant",
  },
  {
    id: "usaha",
    name: "Usaha",
    fullName: "Usaha & Bisnis",
    icon: "work",
    bg: "bg-primary-fixed",
    text: "text-on-primary-fixed",
  },
  {
    id: "lainnya",
    name: "Lainnya",
    fullName: "Lainnya",
    icon: "more_horiz",
    bg: "bg-surface-dim",
    text: "text-on-surface-variant",
  },
];

export const DEFAULT_CATEGORY_ID = "makan";

export function getCategoryById(id: string): CategoryOption {
  return CATEGORY_OPTIONS.find((c) => c.id === id) ?? CATEGORY_OPTIONS[0];
}

export function getCategoryByIcon(icon: string): CategoryOption | undefined {
  return CATEGORY_OPTIONS.find((c) => c.icon === icon);
}
