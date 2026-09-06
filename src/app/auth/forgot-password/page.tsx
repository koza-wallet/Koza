"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/actions/auth";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await forgotPasswordAction(formData);
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md px-margin-screen">
          <div className="bg-surface-container-lowest py-8 px-6 shadow-lg rounded-3xl sm:px-10 border border-outline-variant/30 text-center">
            <div className="w-16 h-16 bg-primary-container text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">outgoing_mail</span>
            </div>
            <h2 className="font-headline-sm text-on-surface mb-2">Tautan Dikirim!</h2>
            <p className="font-body-md text-on-surface-variant mb-6">
              Jika email tersebut terdaftar, kami telah mengirimkan tautan untuk mengatur ulang password Anda. Silakan periksa kotak masuk Anda.
            </p>
            <Link 
              href="/auth/login"
              className="inline-flex justify-center py-3.5 px-6 border border-transparent rounded-xl shadow-sm font-label-lg text-on-primary bg-primary hover:opacity-90 transition-all"
            >
              Kembali ke Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-margin-screen">
        <h2 className="mt-6 text-center font-display text-[32px] font-extrabold tracking-tight text-on-surface">
          Lupa Password?
        </h2>
        <p className="mt-2 text-center font-body-md text-on-surface-variant">
          Masukkan email Anda untuk mengatur ulang password
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-margin-screen">
        <div className="bg-surface-container-lowest py-8 px-6 shadow-lg rounded-3xl sm:px-10 border border-outline-variant/30">
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block font-label-md text-on-surface mb-1">
                Alamat Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="anda@email.com"
                />
              </div>
            </div>

            {error && (
              <div className="text-error font-body-sm text-center">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md font-label-lg text-on-primary bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70 transition-all active:scale-[0.99]"
              >
                {loading ? "Mengirim..." : "Kirim Tautan"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center font-body-md text-on-surface-variant">
            <Link href="/auth/login" className="font-label-md text-primary hover:text-primary/80">
              Kembali ke Halaman Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
