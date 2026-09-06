import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
        await prisma.user.create({
          data: {
            id: user.id, // Gunakan UUID yang sama dari Supabase Auth
            email: user.email!,
            name: user.user_metadata?.full_name || user.email?.split("@")[0],
            image: user.user_metadata?.avatar_url,
          }
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=InvalidToken`);
}
