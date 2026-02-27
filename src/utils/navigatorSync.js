export const openInYandexNavigator = (lat, lon) => {
  // Deep link mantiqi: haydovchi telefonidagi navigatorni to'g'ridan-to'g'ri ochadi
  const yandexUrl = `yandexnavi://build_route_on_map?lat_to=${lat}&lon_to=${lon}`;
  const storeUrl = "https://play.google.com/store/apps/details?id=ru.yandex.yandexnavi";

  // Ilova o'rnatilganligini tekshirish va ochish
  window.location.href = yandexUrl;

  // Agar 2 soniyadan keyin ilova ochilmasa, Play Marketga yo'naltiradi
  setTimeout(() => {
    if (document.hasFocus()) {
      window.open(storeUrl, "_blank");
    }
  }, 2000);
};