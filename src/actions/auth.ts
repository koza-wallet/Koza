"use server";

import { createClient } from "@/utils/supabase/server";

export async function registerAction(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password || !name) {
    return { error: "Semua kolom wajib diisi." };
  }

  const supabase = await createClient();
  const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: `${APP_URL}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    // Jika Supabase membutuhkan konfirmasi email, user tidak akan langsung aktif
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      return { error: "Email sudah terdaftar. Silakan login." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Error saat registrasi:", err);
    return { error: `Gagal mendaftar: ${err.message || "Kesalahan internal."}` };
  }
}

export async function forgotPasswordAction(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) return { error: "Email wajib diisi." };

  const supabase = await createClient();
  const APP_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${APP_URL}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    console.error("Gagal mengirim email reset:", error.message);
  }

  return { success: true };
}

export async function resetPasswordAction(formData: FormData) {
  const password = formData.get("password") as string;

  if (!password) return { error: "Data tidak valid." };

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: password
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email dan password wajib diisi." };

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updateUserAvatarAction(avatarUrl: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Unauthorized" };

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    await prisma.user.update({
      where: { email: user.email },
      data: { image: avatarUrl }
    });
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}

