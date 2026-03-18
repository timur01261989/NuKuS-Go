export const openInNavigatorApp = (lat, lon) => {
  // Deep link mantiqi: haydovchi telefonidagi navigatorni to'g'ridan-to'g'ri ochadi
  const navigatorUrl = `navigatorapp://build_route_on_map?lat_to=${lat}&lon_to=${lon}`;
  const storeUrl = "https://play.google.com/store/apps/details?id=com.navigator.app";

  // Ilova o'rnatilganligini tekshirish va ochish
  window.location.href = navigatorUrl;

  // Agar 2 soniyadan keyin ilova ochilmasa, Play Marketga yo'naltiradi
  setTimeout(() => {
    if (document.hasFocus()) {
      window.open(storeUrl, "_blank");
    }
  }, 2000);
};