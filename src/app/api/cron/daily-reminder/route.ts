import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import webpush from "web-push";

const prisma = new PrismaClient();

// Konfigurasi Web Push dengan VAPID keys
webpush.setVapidDetails(
  "mailto:admin@koza.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
);

export async function GET(request: Request) {
  try {
    // Keamanan Cron: Pastikan ini dipanggil oleh Vercel Cron atau script internal (bisa dicek lewat Header)
    // Untuk pengembangan, kita izinkan pemanggilan langsung (atau gunakan secret token jika di produksi).
    
    // Cari semua pelanggan PRO yang mengaktifkan pengingat dan memiliki subscription
    const proUsers = await prisma.user.findMany({
      where: {
        subscriptionTier: "PRO",
        isReminderOn: true,
        pushSubscription: { not: null }
      }
    });

    let successCount = 0;
    let failCount = 0;

    const payload = JSON.stringify({
      title: "Waktunya Mencatat! 📝",
      body: "Jangan biarkan pengeluaranmu menguap tanpa jejak. Catat pengeluaran hari ini sekarang!",
      url: "/transaksi/tambah"
    });

    for (const user of proUsers) {
      if (!user.pushSubscription) continue;
      
      try {
        const sub = JSON.parse(user.pushSubscription);
        await webpush.sendNotification(sub, payload);
        successCount++;
      } catch (err: any) {
        console.error(`Failed to send push to user ${user.id}:`, err);
        // Jika subscription usang/ditolak, kita matikan flag-nya
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.user.update({
            where: { id: user.id },
            data: { pushSubscription: null, isReminderOn: false }
          });
        }
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failCount,
      message: `Sent ${successCount} reminders to PRO users.`
    });
  } catch (error: any) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
