import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-32 h-32 animate-pulse">
          <Image
            src="/image2.png"
            alt="Memuat Koza"
            fill
            className="object-contain"
            priority
          />
        </div>
        <p className="font-label-md text-on-surface-variant animate-pulse tracking-wide">
          Memuat Koza...
        </p>
      </div>
    </div>
  );
}
