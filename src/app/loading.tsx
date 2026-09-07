export default function Loading() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p className="font-label-md text-on-surface-variant animate-pulse">
          Memuat Koza...
        </p>
      </div>
    </div>
  );
}
