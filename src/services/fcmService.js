// src/services/fcmService.js

export async function setupNotifications() {
  try {
    // Build/server paytida window bo'lmaydi
    if (typeof window === "undefined") return;

    // Brauzer notification qo‘llamasligi mumkin
    if (!("Notification" in window)) {
      console.log("Notifications not supported in this browser");
      return;
    }

    // Agar oldin ruxsat berilgan bo‘lsa, qayta so'ramaymiz
    if (Notification.permission === "granted") {
      console.log("Notification permission already granted");
      return;
    }

    // Agar bloklangan bo‘lsa, hech narsa qilmaymiz
    if (Notification.permission === "denied") {
      console.log("Notification permission denied");
      return;
    }

    // Ruxsat so‘raymiz
    const permission = await Notification.requestPermission();
    console.log("Notification permission:", permission);
  } catch (e) {
    console.error("setupNotifications error:", e);
  }
}