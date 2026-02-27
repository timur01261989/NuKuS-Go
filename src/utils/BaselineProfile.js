// Yandex Go Baseline Profile mantiqi simulyatsiyasi
export const prioritizeAssets = () => {
  const essentialAssets = [
  '/assets/fonts/yango-headline-multi.woff',
];


  essentialAssets.forEach(asset => {
    const link = document.createElement('link');
    link.rel = 'prefetch'; // Kelajakdagi sahifalar uchun oldindan tayyorlash
    link.href = asset;
    document.head.appendChild(link);
  });

  console.log("Baseline Profile: Muhim resurslar ustuvorligi belgilandi.");
};