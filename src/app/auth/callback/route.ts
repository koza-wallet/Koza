import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // Sinkronisasi data ke Prisma
      const user = data.user;
      
      const existingUser = await prisma.user.findUnique({
        where: { id: user.id }
      });
      
      if (!existingUser) {
        const newUser = await prisma.user.create({
          data: {
            id: user.id, // Gunakan UUID yang sama dari Supabase Auth
            email: user.email!,
            name: user.user_metadata?.full_name || user.email?.split("@")[0],
            image: user.user_metadata?.avatar_url,
          }
        });

        // Dompet default dibuat sekali di sini, saat akun benar-benar baru —
        // bukan dicek ulang tiap getFinanceData() dipanggil, supaya tidak
        // berisiko membuat "Dompet Utama" duplikat kalau beberapa halaman
        // dimuat hampir bersamaan sebelum dompet pertama tersimpan.
        await prisma.wallet.create({
          data: {
            name: "Dompet Utama",
            icon: "account_balance_wallet",
            type: "cash",
            ownerId: newUser.id
          }
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=InvalidToken`);
}
