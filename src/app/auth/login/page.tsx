"use client";

import { loginAction } from "@/actions/auth";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    
    const res = await loginAction(formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh(); // Penting untuk me-refresh state server
    }
  };

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    // Gunakan origin URL saat ini agar cocok di semua environment (localhost & Vercel)
    const redirectTo = `${window.location.origin}/auth/callback`;
    
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });
  };

  return (
    <main className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-margin-screen">
        <h2 className="mt-6 text-center font-display text-[32px] font-extrabold tracking-tight text-on-surface">
          Masuk ke Koza
        </h2>
        <p className="mt-2 text-center font-body-md text-on-surface-variant">
          Pilih metode masuk yang Anda inginkan
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-margin-screen">
        <div className="bg-surface-container-lowest py-8 px-6 shadow-lg rounded-3xl sm:px-10 border border-outline-variant/30">
          
          {verified && (
            <div className="mb-4 bg-primary-container text-on-primary-container p-3 rounded-xl font-label-md text-center">
              Email berhasil diverifikasi! Silakan masuk.
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            className="w-full flex justify-center items-center gap-3 py-3.5 px-4 border border-outline-variant/50 rounded-xl shadow-sm bg-surface-container-low font-label-lg text-on-surface hover:bg-surface-container transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Lanjutkan dengan Google
          </button>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/40" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface-container-lowest text-outline font-label-md">
                  Atau masuk dengan email
                </span>
              </div>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="anda@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block font-label-md text-on-surface mb-1">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl font-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-end">
              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-label-md text-primary hover:text-primary/80">
                  Lupa password?
                </Link>
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
                {loading ? "Memeriksa..." : "Masuk"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center font-body-md text-on-surface-variant">
            Belum punya akun?{" "}
            <Link href="/auth/register" className="font-label-md text-primary hover:text-primary/80">
              Daftar sekarang
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface" />}>
      <LoginForm />
    </Suspense>
  );
}
