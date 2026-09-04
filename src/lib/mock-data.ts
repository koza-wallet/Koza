import type { Transaction, UserProfile, Wallet } from "./types";

/**
 * Fixed "today" for the dummy dataset, matching the date shown in the Stitch
 * design ("Senin, 20 Juli 2026"). Using a fixed reference instead of `new Date()`
 * keeps relative labels ("Hari ini", "Kemarin") stable and reproducible.
 */
export const REFERENCE_DATE = new Date("2026-07-20T15:00:00+07:00");

export const currentUser: UserProfile = {
  name: "Budi",
  fullName: "Budi Santoso",
  email: "budi.santoso@email.com",
  avatarUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuA-asVNSbFx5V-PFIazM4v0fXEB0UBdWsStJDm-nhAUGfQogUfvkBDDIX2Kwt-Z28HQeQql-rGaRzcHXGiv_VroVJEHH8W9NqlKoV6n5vCKMjNmNQCb9YjYDzHP7UYwfy0Tz6kimmkpTrZjBSlwvYrT1D9TG-87dSzFI7rLzF-O0doBM8oTOaB0kIAT4hkDA0xpmiWKUqV4eCPIBZlBhcvMEpz3X6Rxvo527SWKzlmQZTQI6_SazZgM",
  healthScore: 88,
  memberSince: "2026-01-01",
};

export const wallets: Wallet[] = [
  {
    id: "wallet-bca",
    name: "Dompet Utama",
    type: "bank",
    provider: "BCA",
    accountNumberMasked: "****8821",
    balance: 10_000_000,
  },
  {
    id: "wallet-cash",
    name: "Kas Tunai",
    type: "cash",
    balance: 3_500_000,
  },
  {
    id: "wallet-gopay",
    name: "GoPay",
    type: "ewallet",
    provider: "GoPay",
    balance: 1_450_000,
  },
  {
    id: "wallet-ovo",
    name: "OVO",
    type: "ewallet",
    provider: "OVO",
    balance: 550_000,
  },
];

/**
 * All 13 seed transactions are now linked to a `walletId` and `categoryId` so
 * the full edit/delete lifecycle (which needs to know exactly which wallet's
 * balance to reverse, and which category to preselect) works uniformly for
 * every transaction, not just ones created after this feature existed.
 * "QRIS" entries — which don't map to any single wallet's `paymentMethod`
 * label — are assigned to GoPay, the most common real-world QRIS rail in
 * Indonesia; this is a deliberate, documented interpretive choice for demo
 * data, not a claim about real transaction history. `category`/`categoryIcon`
 * were also aligned to their linked category's canonical label/icon from
 * categories.ts (a couple, e.g. "Kebutuhan Rumah" -> "Belanja Kebutuhan",
 * previously drifted from the catalog and silently hit TransactionRow's
 * icon-fallback path).
 */
export const transactions: Transaction[] = [
  {
    id: "trx-1",
    title: "Makan Siang Resto",
    categoryId: "makan",
    category: "Makanan & Minuman",
    categoryIcon: "restaurant",
    direction: "expense",
    amount: 45_000,
    paymentMethod: "Tunai",
    walletId: "wallet-cash",
    timestamp: "2026-07-20T12:30:00+07:00",
  },
  {
    id: "trx-2",
    title: "Gaji Bulanan PT Maju",
    categoryId: "gaji",
    category: "Pemasukan Pokok",
    categoryIcon: "payments",
    direction: "income",
    amount: 5_000_000,
    paymentMethod: "BCA Transfer",
    walletId: "wallet-bca",
    timestamp: "2026-07-19T09:00:00+07:00",
  },
  {
    id: "trx-3",
    title: "Belanja Bulanan Mart",
    categoryId: "belanja",
    category: "Belanja Kebutuhan",
    categoryIcon: "shopping_bag",
    direction: "expense",
    amount: 350_000,
    paymentMethod: "QRIS",
    walletId: "wallet-gopay",
    timestamp: "2026-07-18T16:20:00+07:00",
  },
  // Earlier this month — not shown in the "Transaksi Terakhir" preview (top 3
  // only) but included so monthly totals on Beranda are genuinely computed,
  // not hardcoded.
  {
    id: "trx-4",
    title: "Ojek Online",
    categoryId: "transport",
    category: "Transportasi",
    categoryIcon: "directions_car",
    direction: "expense",
    amount: 25_000,
    paymentMethod: "QRIS",
    walletId: "wallet-gopay",
    timestamp: "2026-07-17T08:10:00+07:00",
  },
  {
    id: "trx-5",
    title: "Kopi Pagi",
    categoryId: "makan",
    category: "Makanan & Minuman",
    categoryIcon: "restaurant",
    direction: "expense",
    amount: 32_000,
    paymentMethod: "QRIS",
    walletId: "wallet-gopay",
    timestamp: "2026-07-17T07:40:00+07:00",
  },
  {
    id: "trx-6",
    title: "Pulsa & Paket Data",
    categoryId: "tagihan",
    category: "Tagihan & Utilitas",
    categoryIcon: "receipt_long",
    direction: "expense",
    amount: 100_000,
    paymentMethod: "BCA Transfer",
    walletId: "wallet-bca",
    timestamp: "2026-07-16T19:00:00+07:00",
  },
  {
    id: "trx-7",
    title: "Langganan Streaming",
    categoryId: "hiburan",
    category: "Hiburan & Rekreasi",
    categoryIcon: "sports_esports",
    direction: "expense",
    amount: 54_000,
    paymentMethod: "BCA Transfer",
    walletId: "wallet-bca",
    timestamp: "2026-07-15T10:00:00+07:00",
  },
  {
    id: "trx-8",
    title: "Parkir & Tol",
    categoryId: "transport",
    category: "Transportasi",
    categoryIcon: "directions_car",
    direction: "expense",
    amount: 40_000,
    paymentMethod: "Tunai",
    walletId: "wallet-cash",
    timestamp: "2026-07-14T13:15:00+07:00",
  },
  {
    id: "trx-9",
    title: "Servis Motor",
    categoryId: "transport",
    category: "Transportasi",
    categoryIcon: "directions_car",
    direction: "expense",
    amount: 275_000,
    paymentMethod: "Tunai",
    walletId: "wallet-cash",
    timestamp: "2026-07-12T11:00:00+07:00",
  },
  {
    id: "trx-10",
    title: "Obat & Vitamin",
    categoryId: "kesehatan",
    category: "Kesehatan",
    categoryIcon: "favorite",
    direction: "expense",
    amount: 120_000,
    paymentMethod: "QRIS",
    walletId: "wallet-gopay",
    timestamp: "2026-07-10T17:30:00+07:00",
  },
  {
    id: "trx-11",
    title: "Listrik PLN",
    categoryId: "tagihan",
    category: "Tagihan & Utilitas",
    categoryIcon: "receipt_long",
    direction: "expense",
    amount: 350_000,
    paymentMethod: "BCA Transfer",
    walletId: "wallet-bca",
    timestamp: "2026-07-08T09:00:00+07:00",
  },
  {
    id: "trx-12",
    title: "Nonton Bioskop",
    categoryId: "hiburan",
    category: "Hiburan & Rekreasi",
    categoryIcon: "sports_esports",
    direction: "expense",
    amount: 150_000,
    paymentMethod: "QRIS",
    walletId: "wallet-gopay",
    timestamp: "2026-07-06T20:00:00+07:00",
  },
  {
    id: "trx-13",
    title: "Belanja Pasar",
    categoryId: "belanja",
    category: "Belanja Kebutuhan",
    categoryIcon: "shopping_bag",
    direction: "expense",
    amount: 279_000,
    paymentMethod: "Tunai",
    walletId: "wallet-cash",
    timestamp: "2026-07-03T08:00:00+07:00",
  },
];
