import { BottomNav } from "@/components/BottomNav";

interface ComingSoonScreenProps {
  title: string;
}

/**
 * Placeholder for screens not yet built from the Stitch export. Kept minimal
 * on purpose (no invented layout) so bottom-nav links resolve to a real route
 * instead of a 404 while each screen is implemented one at a time.
 */
export function ComingSoonScreen({ title }: ComingSoonScreenProps) {
  return (
    <>
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-margin-screen flex items-center">
          <h1 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">{title}</h1>
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center gap-space-sm pt-16 pb-28 bg-surface px-margin-screen text-center">
        <span className="material-symbols-outlined text-[40px] text-on-surface-variant">construction</span>
        <p className="font-body-md text-body-md text-on-surface-variant">
          Halaman {title} sedang disiapkan.
        </p>
      </main>
      <BottomNav />
    </>
  );
}
