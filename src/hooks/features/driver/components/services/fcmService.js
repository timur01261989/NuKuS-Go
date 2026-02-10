import { getMessaging, getToken, onMessage } from "firebase/messaging";

export const setupNotifications = async () => {
  const messaging = getMessaging();

  try {
    const token = await getToken(messaging, { vapidKey: 'SIZNING_KEY' });
    if (token) {
      // Bu tokenni Supabase-dagi 'profiles' jadvaliga saqlab qo'yish kerak
      console.log("FCM Token:", token);
    }
  } catch (err) {
    console.error("Xabarnoma ruxsati berilmadi:", err);
  }

  // Ilova ochiq turganda xabar kelsa
  onMessage(messaging, (payload) => {
    console.log("Yangi xabar kirdi:", payload);
    // Bu yerda Alisa ovozini chiqaramiz
    // playAliceVoice('NewOrder'); 
  });
};