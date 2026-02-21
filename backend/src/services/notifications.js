import { setupNotifications as setup } from "./fcmService"; 
// ⚠️ agar fcmService.js boshqa pathda bo‘lsa, yo‘lini moslang

export function setupNotifications() {
  try {
    setup();
  } catch (e) {
    // notification bo‘lmasa ham app ishlayversin
    console.log("Notifications setup error");
  }
}
