"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPasswordAction } from "@/actions/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await resetPasswordAction(formData);
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
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
              <span className="material-symbols-outlined text-[32px]">lock_reset</span>
            </div>
            <h2 className="font-headline-sm text-on-surface mb-2">Password Diperbarui!</h2>
            <p className="font-body-md text-on-surface-variant mb-6">
              Password Anda telah berhasil diubah. Mengarahkan ke halaman login...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-margin-screen">
        <h2 className="mt-6 text-center font-display text-[32px] font-extrabold tracking-tight text-on-surface">
          Password Baru
        </h2>
        <p className="mt-2 text-center font-body-md text-on-surface-variant">
          Masukkan password baru untuk akun Anda
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-margin-screen">
        <div className="bg-surface-container-lowest py-8 px-6 shadow-lg rounded-3xl sm:px-10 border border-outline-variant/30">
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block font-label-md text-on-surface mb-1">
                Password Baru
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={6}
                  className="appearance-none block w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="Minimal 6 karakter"
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
                {loading ? "Menyimpan..." : "Simpan Password"}
              </button>
            </div>
          </form>

        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
