"use server";

import { getSessionUser } from "./finance";
import { prisma } from "@/lib/prisma";

export async function savePushSubscriptionAction(subscription: any | null, isReminderOn: boolean) {
  try {
    const user = await getSessionUser();
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        pushSubscription: subscription ? JSON.stringify(subscription) : null,
        isReminderOn
      }
    });
    
    return { success: true };
  } catch (error: any) {
    console.error("Error saving subscription:", error);
    return { error: error.message };
  }
}
