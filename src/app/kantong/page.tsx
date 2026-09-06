"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { BottomNav } from "@/components/BottomNav";
import { formatRupiahAmount } from "@/lib/format";
import { getPocketsAction, addPocketAction, addPocketBalanceAction } from "@/actions/finance";

interface Pocket {
  id: string;
  name: string;
  targetAmount: number;
  currentBalance: number;
  color: string;
  icon: string;
}

const POCKET_COLORS = ["bg-primary", "bg-secondary", "bg-tertiary", "bg-error"];
const POCKET_ICONS = ["savings", "flight_takeoff", "home", "laptop_mac", "directions_car"];

export default function KantongPage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTopUpForm, setShowTopUpForm] = useState<string | null>(null);

  // Add Form State
  const [formName, setFormName] = useState("");
  const [formTarget, setFormTarget] = useState(0);
  const [formColor, setFormColor] = useState(POCKET_COLORS[0]);
  const [formIcon, setFormIcon] = useState(POCKET_ICONS[0]);

  // TopUp Form State
  const [topUpAmount, setTopUpAmount] = useState(0);

  useEffect(() => {
    async function loadPockets() {
      try {
        const data = await getPocketsAction();
        setPockets(data as unknown as Pocket[]);
      } catch (error) {
        console.error("Gagal memuat kantong:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadPockets();
  }, []);

  async function handleAddPocket() {
    if (!formName.trim() || formTarget <= 0) return;
    try {
      const newPocket = await addPocketAction({
        name: formName,
        targetAmount: formTarget,
        color: formColor,
        icon: formIcon,
      });
      setPockets((prev) => [...prev, newPocket as unknown as Pocket]);
      setShowAddForm(false);
      setFormName("");
      setFormTarget(0);
    } catch (e) {
      console.error(e);
      alert("Gagal membuat kantong");
    }
  }

  async function handleTopUp(pocketId: string) {
    if (topUpAmount <= 0) return;
    try {
      await addPocketBalanceAction(pocketId, topUpAmount);
      setPockets((prev) => 
        prev.map(p => p.id === pocketId ? { ...p, currentBalance: p.currentBalance + topUpAmount } : p)
      );
      setShowTopUpForm(null);
      setTopUpAmount(0);
    } catch (e) {
      console.error(e);
      alert("Gagal menabung ke kantong");
    }
  }

  const activePocket = pockets.find(p => p.id === showTopUpForm);

  return (
    <>
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-margin-screen flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <button
              onClick={() => router.back()}
              className="w-11 h-11 flex items-center justify-center -ml-2 rounded-full text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">Kantong Saya</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full pt-20 pb-28 bg-surface px-margin-screen space-y-space-md">
        
        {/* Intro Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-container to-surface-container-high rounded-2xl p-space-md shadow-sm">
          <div className="flex items-start gap-space-sm">
            <div className="w-10 h-10 rounded-full bg-surface/50 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">savings</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-headline-sm text-headline-sm text-on-surface">Pisahkan Dana</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                Kantong membantu Anda mencapai target keuangan (mis. Dana Darurat, Liburan) tanpa mencampur saldo utama.
              </p>
            </div>
          </div>
        </div>

        {/* Pockets List */}
        <div className="flex flex-col space-y-space-sm">
          {isLoading ? (
            <div className="text-center py-10 font-body-sm text-on-surface-variant">Memuat Kantong...</div>
          ) : pockets.length === 0 ? (
            <div className="text-center py-10 font-body-sm text-on-surface-variant bg-surface-container-low rounded-2xl">
              Belum ada kantong yang dibuat.<br/>Yuk mulai menabung!
            </div>
          ) : (
            pockets.map((pocket) => {
              const progress = Math.min(100, Math.round((pocket.currentBalance / pocket.targetAmount) * 100));
              return (
                <div key={pocket.id} className="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm border border-outline-variant/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-sm">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-on-primary ${pocket.color}`}>
                        <span className="material-symbols-outlined text-[24px]">{pocket.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">{pocket.name}</h3>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Target: Rp {formatRupiahAmount(pocket.targetAmount)}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowTopUpForm(pocket.id)}
                      className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:opacity-80 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[20px]">add</span>
                    </button>
                  </div>
                  
                  <div className="mt-space-md">
                    <div className="flex justify-between font-label-md text-label-md mb-2">
                      <span className="text-primary font-bold">Rp {formatRupiahAmount(pocket.currentBalance)}</span>
                      <span className="text-on-surface-variant">{progress}%</span>
                    </div>
                    <div className="w-full bg-surface-container-highest rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-2.5 rounded-full ${pocket.color} transition-all duration-1000 ease-out`} 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Pocket Button */}
        <div className="pt-space-sm">
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full h-14 rounded-full bg-primary-container text-on-primary flex items-center justify-center gap-space-xs font-label-lg text-label-lg shadow-md hover:bg-primary active:scale-[0.99] transition-all"
          >
            <span className="material-symbols-outlined text-[22px]">add_task</span>
            <span>Buat Kantong Baru</span>
          </button>
        </div>

      </main>

      {/* Bottom Sheet - Add Pocket */}
      {showAddForm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <button onClick={() => setShowAddForm(false)} className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-t-[28px] p-space-lg pb-safe shadow-2xl space-y-space-md animate-in slide-in-from-bottom-full">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Buat Kantong Baru</h3>
            <div className="space-y-space-sm">
              <input 
                className="w-full p-4 rounded-xl bg-surface-container-low font-body-md focus:outline-none" 
                placeholder="Nama Kantong (mis. Liburan Bali)"
                value={formName}
                onChange={e => setFormName(e.target.value)}
              />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">Rp</span>
                <input 
                  className="w-full p-4 pl-12 rounded-xl bg-surface-container-low font-body-md focus:outline-none" 
                  placeholder="Target Saldo"
                  inputMode="numeric"
                  value={formTarget > 0 ? formatRupiahAmount(formTarget) : ""}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setFormTarget(digits ? parseInt(digits, 10) : 0);
                  }}
                />
              </div>
              <div>
                <p className="font-label-sm text-on-surface-variant mb-2">Pilih Warna</p>
                <div className="flex gap-3">
                  {POCKET_COLORS.map(color => (
                    <button 
                      key={color} 
                      onClick={() => setFormColor(color)}
                      className={`w-10 h-10 rounded-full ${color} ${formColor === color ? 'ring-4 ring-offset-2 ring-primary' : ''}`}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="font-label-sm text-on-surface-variant mb-2">Pilih Ikon</p>
                <div className="flex gap-3">
                  {POCKET_ICONS.map(icon => (
                    <button 
                      key={icon} 
                      onClick={() => setFormIcon(icon)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-[24px] ${formIcon === icon ? 'bg-primary-container text-primary' : 'bg-surface-container text-on-surface-variant'}`}
                    >
                      <span className="material-symbols-outlined">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddPocket}
                className="w-full h-[52px] bg-primary hover:opacity-90 text-on-primary rounded-xl font-label-lg transition-all"
              >
                Buat Kantong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet - Top Up Pocket */}
      {showTopUpForm && activePocket && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <button onClick={() => setShowTopUpForm(null)} className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-t-[28px] p-space-lg pb-safe shadow-2xl space-y-space-md animate-in slide-in-from-bottom-full">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Nabung ke {activePocket.name}</h3>
            <p className="font-body-sm text-on-surface-variant">Perjalanan Anda tinggal Rp {formatRupiahAmount(activePocket.targetAmount - activePocket.currentBalance)} lagi!</p>
            <div className="space-y-space-sm">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline">Rp</span>
                <input 
                  className="w-full p-4 pl-12 rounded-xl bg-surface-container-low font-body-md focus:outline-none text-xl font-bold" 
                  placeholder="0"
                  autoFocus
                  inputMode="numeric"
                  value={topUpAmount > 0 ? formatRupiahAmount(topUpAmount) : ""}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setTopUpAmount(digits ? parseInt(digits, 10) : 0);
                  }}
                />
              </div>
              
              <button
                onClick={() => handleTopUp(activePocket.id)}
                className="w-full h-[52px] bg-primary hover:opacity-90 text-on-primary rounded-xl font-label-lg transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">payments</span>
                Tabung Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </>
  );
}
