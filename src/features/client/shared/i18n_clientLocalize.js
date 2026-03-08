import { useMemo } from "react";
import { useLanguage } from "@/shared/i18n/useLanguage";

const GEO = {
  "Qoraqalpog‘iston": { ru: "Каракалпакстан", uz_kirill: "Қорақалпоғистон", qq_kirill: "Қарақалпақстан" },
  "Andijon": { ru: "Андижан", uz_kirill: "Андижон", qq_kirill: "Әндижан" },
  "Buxoro": { ru: "Бухара", uz_kirill: "Бухоро", qq_kirill: "Бухара" },
  "Farg'ona": { ru: "Фергана", uz_kirill: "Фарғона", qq_kirill: "Ферғана" },
  "Farg‘ona": { ru: "Фергана", uz_kirill: "Фарғона", qq_kirill: "Ферғана" },
  "Jizzax": { ru: "Джизак", uz_kirill: "Жиззах", qq_kirill: "Жыззах" },
  "Namangan": { ru: "Наманган", uz_kirill: "Наманган", qq_kirill: "Наманган" },
  "Navoiy": { ru: "Навои", uz_kirill: "Навоий", qq_kirill: "Науаий" },
  "Qashqadaryo": { ru: "Кашкадарья", uz_kirill: "Қашқадарё", qq_kirill: "Қашқадарья" },
  "Samarqand": { ru: "Самарканд", uz_kirill: "Самарқанд", qq_kirill: "Самарқанд" },
  "Sirdaryo": { ru: "Сырдарья", uz_kirill: "Сирдарё", qq_kirill: "Сырдарья" },
  "Surxondaryo": { ru: "Сурхандарья", uz_kirill: "Сурхондарё", qq_kirill: "Сурхандарья" },
  "Toshkent": { ru: "Ташкент", uz_kirill: "Тошкент", qq_kirill: "Ташкент" },
  "Xorazm": { ru: "Хорезм", uz_kirill: "Хоразм", qq_kirill: "Хорезм" },
  "Tumansiz": { ru: "Без района", uz_kirill: "Тумансиз", qq_kirill: "Аўдансыз" },
};

const phraseMap = {
  ru: {
    "so'm": "сум", "so‘m": "сум", "Hamyon": "Кошелек", "Joriy balans": "Текущий баланс", "Yangilash": "Обновить", "Xatolik": "Ошибка",
    "Payme / Click": "Payme / Click", "Qayerga boramiz?": "Куда поедем?", "Haydovchi qidirilmoqda...": "Ищем водителя...", "To'lov tekshirilmoqda...": "Проверяем оплату...",
    "Muvaffaqiyatli yakunlandi!": "Успешно завершено!", "Eng yaqin mashinani aniqlayapmiz": "Определяем ближайшую машину", "Iltimos, kutib turing": "Пожалуйста, подождите",
    "Yuk tashish": "Грузоперевозка", "Eltish xizmati": "Доставка", "Viloyatlar aro": "Межобластные поездки", "Tumanlar aro": "Межрайонные поездки", "Avto Bozor": "Авторынок",
    "Eltib berish": "Доставка", "Yuk joylanmoqda...": "Размещается груз...", "Yuk e’loni yaratildi. Endi haydovchilar taklif yuboradi.": "Объявление о грузе создано. Теперь водители будут отправлять предложения.",
    "Haydovchi tanlandi ✅": "Водитель выбран ✅", "Mos mashina topilmadi (yoki hali online yo‘q)": "Подходящая машина не найдена (или пока не онлайн)",
    "Xaritadan belgilang": "Отметьте на карте", "Yuborish manzili": "Адрес отправки", "Tushirish manzili": "Адрес доставки", "Yuk detali": "Детали груза",
    "Yukni e’lon qilish": "Опубликовать груз", "Yuk nima?": "Что за груз?", "Yuk turi (ixtiyoriy)": "Тип груза (необязательно)", "Izoh (ixtiyoriy)": "Комментарий (необязательно)",
    "Yukni rasmga oling": "Сфотографируйте груз", "Yuklovchi kerakmi?": "Нужен грузчик?", "Xaritadan aniq olish manzili": "Точный адрес забора с карты", "Xaritadan aniq topshirish manzili": "Точный адрес доставки с карты",
    "Buyurtma yangilandi": "Заказ обновлен", "Buyurtma saqlanmadi": "Заказ не сохранен", "Buyurtmani o‘chirasizmi?": "Удалить заказ?", "Bu amalni bekor qilib bo‘lmaydi.": "Это действие нельзя отменить.",
    "Bekor qilish": "Отмена", "Buyurtma o‘chirildi": "Заказ удален", "Buyurtmani tahrirlash": "Редактирование заказа", "Xaritadan aniq manzil": "Точный адрес с карты", "Manzilni o‘zgartirish": "Изменить адрес", "Xaritadan tanlash": "Выбрать на карте", "Qaerga topshirish": "Куда доставить", "Aniq manzil": "Точный адрес", "Izoh": "Комментарий",
    "Mos viloyatlar aro reys": "Подходящий межобластной рейс", "Olish manzilini tanlang": "Выберите адрес забора", "Topshirish manzilini tanlang": "Выберите адрес доставки", "Izoh kuryerga yo‘l topishda yordam beradi.": "Комментарий поможет курьеру найти дорогу.",
    "Kichik quti": "Маленькая коробка", "Katta quti": "Большая коробка", "Yuk turi": "Тип груза", "Yuk rasmi (ixtiyoriy)": "Фото груза (необязательно)", "Kontaktlardan tanlash ishlashi mumkin.": "Выбор из контактов может работать.", "Kontaktlar API yo‘q — demo ro‘yxat chiqadi.": "API контактов недоступен — будет показан демо-список.", "Telefon raqam": "Номер телефона",
    "Juda og‘ir": "Очень тяжелый", "Noma'lum manzil": "Неизвестный адрес", "Manzilni aniqlab bo'lmadi": "Не удалось определить адрес", "Mos reys topilmadi": "Подходящий рейс не найден", "Qidirishda xatolik": "Ошибка при поиске", "Kamida bitta o'rindiq tanlang!": "Выберите хотя бы одно место!", "Avval viloyatni tanlang": "Сначала выберите область", "Ketish sanasi": "Дата выезда",
    "Safarni bekor qilasizmi?": "Отменить поездку?", "Ha, bekor qilish": "Да, отменить", "Yo'q": "Нет", "Nukusdan qayerga?": "Куда из Нукуса?", "Manzildan manzilgacha": "От адреса до адреса", "So‘rov yuborish": "Отправить запрос", "Buyirtma jonatish": "Отправить заказ", "Manzil topilmadi": "Адрес не найден", "Buyurtma yuborildi": "Заказ отправлен", "Safar yakunlandi. Rahmat!": "Поездка завершена. Спасибо!",
    "Foydalanuvchi": "Пользователь", "Yo‘lovchi": "Пассажир", "Profil": "Профиль", "Sozlamalar": "Настройки", "Yordam": "Помощь", "Chiqish": "Выйти", "Mening manzillarim": "Мои адреса", "Sayohatlar tarixi": "История поездок", "To‘lov usullari": "Способы оплаты", "Promokodlar": "Промокоды",
    "Haydovchi": "Водитель", "Avtomobil": "Автомобиль", "Narx": "Цена", "Tanlandi": "Выбрано", "Tanlash": "Выбрать", "joy bor": "мест доступно", "Intercity (viloyatlararo) reyslar": "Межобластные рейсы", "Shahar": "Город", "Bo'sh": "Свободно", "Band": "Занято", "Sizniki": "Ваше", "O'rindiq tanlash": "Выбор места", "Tanlangan": "Выбрано", "ta": "шт", "Maksimal": "Максимум", "Qo‘shimcha qulayliklar": "Дополнительные удобства", "Konditsioner": "Кондиционер", "Katta yukxona (Bagaj)": "Большой багажник", "Faqat ayollar uchun (Xavfsiz reys)": "Только для женщин", "Pochta olib ketishga rozi": "Готов взять посылку", "Pochta": "Посылка", "Ayollar": "Женщины",
    "Ketish vaqti": "Время выезда", "Hamyo'l rejimi": "Режим попутчика", "Tezkor qidiruv": "Быстрый поиск", "Hozir / Bugun": "Сейчас / Сегодня", "Ertaga (Rejali)": "Завтра (Планово)", "Sana": "Дата", "Soat": "Время", "Hududni tanlang": "Выберите регион", "Qaerdan": "Откуда", "Qaerga": "Куда", "Tanlang": "Выберите", "Yoqilsa: siz turgan joy avtomatik aniqlanadi, xohlasangiz xaritadan o‘zgartirasiz.": "Если включить, ваше местоположение определится автоматически, при желании можно изменить на карте.", "Qaerga (manzil)": "Куда (адрес)", "Ixtiyoriy (majburiy emas)": "Необязательно", "Aniqlanmagan": "Не определен", "Xaritadan": "С карты",
    "Qabul qiluvchi": "Получатель", "Kontaktlar": "Контакты", "Ism": "Имя", "Telefon": "Телефон", "Masalan: Aziz": "Например: Азиз", "Yuboruvchi": "Отправитель", "Podyezd": "Подъезд", "Qavat": "Этаж", "Kvartira": "Квартира", "Podyezd/qavat/kvartira — kuryer adashmasligi uchun.": "Подъезд/этаж/квартира — чтобы курьер не заблудился.",
    "Rasm qo‘shish": "Добавить фото", "Xavfsizlik uchun: “mana shuni yuboryapman” deb rasm qo‘shsangiz, kuryer adashmaydi.": "Для безопасности добавьте фото — курьеру будет проще.", "Og‘irlik": "Вес", "Yengil": "Легкий", "O‘rta": "Средний", "Og‘ir": "Тяжелый", "Holat": "Статус", "Qidirilmoqda": "Поиск", "Oldi": "Забрал", "Yo‘lda": "В пути", "Topshirdi": "Доставил", "Kim to‘laydi?": "Кто платит?", "Oluvchi": "Получатель", "Agar “Oluvchi to‘laydi” bo‘lsa, kuryer topshirishda pulni oladi (yoki Click).": "Если платит получатель, курьер получит оплату при вручении.", "Eshikkacha (Door to Door)": "До двери", "+5,000 so‘m — kuryer kvartira eshigigacha chiqadi": "+5 000 сум — курьер поднимется до двери квартиры",
    "Hujjat": "Документ", "Kalit": "Ключ", "Gul": "Цветы", "Kuryerga izoh": "Комментарий для курьера", "Masalan: 'Dom orqasidan kiring', 'qo‘ng‘iroq qiling'...": "Например: 'Зайдите со двора', 'позвоните'...", "Yakuniy nuqta": "Конечная точка", "Qayerdan ketasiz?": "Откуда выезжаете?", "Haydovchi kelmoqda...": "Водитель едет...", "E’lonlar": "Объявления", "E’lon": "Объявление", "E’lonlarni yuklab bo‘lmadi": "Не удалось загрузить объявления", "Narx: —": "Цена: —", "reklama e’lonlar": "рекламные объявления", "sxemasi": "схема", "o'rin": "мест", "Rul": "Руль", "Reyslar ro'yxatini olishda xatolik": "Ошибка загрузки рейсов", "Haydovchilar reyslari": "Рейсы водителей", "Haydovchi / mashina bo'yicha qidirish...": "Поиск по водителю / машине...", "Haydovchi tanlandi": "Водитель выбран", "Sana tanlash": "Выбор даты", "Yo'lovchini olish nuqtasi": "Точка посадки пассажира", "Yo'lovchini olish nuqtasi aniqlanmadi": "Точка посадки пассажира не определена", "Buyurtma yuborilmoqda...": "Заказ отправляется...", "Bekor qilinmoqda...": "Отменяется...", "Haydovchi topildi": "Водитель найден", "Haydovchi yetib keldi": "Водитель прибыл", "Xaritani siljitib yo'lovchini olish nuqtasini o'zgartiring": "Сдвиньте карту, чтобы изменить точку посадки", "Oraliq bekat": "Промежуточная остановка", "Oraliq bekat qo'shildi": "Промежуточная остановка добавлена", "Qaerga borasiz?": "Куда поедете?", "O'zgartirish": "Изменить", "Qidirish": "Поиск", "Qayerdan": "Откуда", "Manzilingiz aniqlanmoqda...": "Определяем ваш адрес...", "Buyurtma berish": "Оформить заказ", "Masofa": "Расстояние", "Saqlash": "Сохранить", "Yuk mashina": "Грузовик", "Haydovchi takliflari": "Предложения водителей", "Hozircha taklif yo‘q. Haydovchilar onlayn bo‘lsa taklif yuboradi.": "Пока предложений нет. Водители отправят их, когда будут онлайн.", "Izoh yo‘q": "Комментария нет", "Nuqtalarni belgilang, yuk detallarini to‘ldiring va e’lon qiling — haydovchilar taklif yuboradi.": "Отметьте точки, заполните детали груза и опубликуйте — водители отправят предложения.", "Manzillar": "Адреса", "Tugmani bossangiz xarita kattalashadi — pinni joylab Manzilni saqlash ni bosing.": "Нажмите кнопку, карта увеличится — установите пин и нажмите 'Сохранить адрес'.", "Taxminiy narx": "Ориентировочная цена", "Narx yo‘l sharoiti va yukga qarab o‘zgarishi mumkin.": "Цена может измениться в зависимости от дороги и груза.", "Sig‘im:": "Вместимость:", "Tanlangan:": "Выбрано:",
  },
  en: {
    "Hamyon": "Wallet", "Joriy balans": "Current balance", "Yangilash": "Refresh", "Xatolik": "Error", "Sozlamalar": "Settings", "Yordam": "Help", "Chiqish": "Log out", "Foydalanuvchi": "User", "Yo‘lovchi": "Passenger", "Mening manzillarim": "My addresses", "Sayohatlar tarixi": "Trip history", "To‘lov usullari": "Payment methods", "Promokodlar": "Promo codes", "Yuk tashish": "Freight", "Eltish xizmati": "Delivery", "Viloyatlar aro": "Intercity", "Tumanlar aro": "Inter-district", "Qayerdan": "From", "Qaerga": "To", "Tanlang": "Select", "Buyurtma berish": "Place order", "Xaritadan tanlash": "Pick on map", "Yuborish manzili": "Pickup address", "Tushirish manzili": "Dropoff address", "Izoh": "Comment", "Holat": "Status"
  },
  uz_kirill: {}, qq_kirill: {}, qq_lotin: {}
};

function normalizeText(text) {
  return String(text || "")
    .replace(/[ʻ’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

const latinMap = [["O‘","Ў"],["G‘","Ғ"],["Sh","Ш"],["Ch","Ч"],["Ya","Я"],["Yo","Ё"],["Yu","Ю"],["A","А"],["B","Б"],["D","Д"],["E","Е"],["F","Ф"],["G","Г"],["H","Ҳ"],["I","И"],["J","Ж"],["K","К"],["L","Л"],["M","М"],["N","Н"],["O","О"],["P","П"],["Q","Қ"],["R","Р"],["S","С"],["T","Т"],["U","У"],["V","В"],["X","Х"],["Y","Й"],["Z","З"],["o‘","ў"],["g‘","ғ"],["sh","ш"],["ch","ч"],["ya","я"],["yo","ё"],["yu","ю"],["a","а"],["b","б"],["d","д"],["e","е"],["f","ф"],["g","г"],["h","ҳ"],["i","и"],["j","ж"],["k","к"],["l","л"],["m","м"],["n","н"],["o","о"],["p","п"],["q","қ"],["r","р"],["s","с"],["t","т"],["u","у"],["v","в"],["x","х"],["y","й"],["z","з"]];
function latinToUzKirill(s){ let out=s; for (const [a,b] of latinMap) out=out.split(a).join(b); return out; }
function latinToQqKirill(s){ return latinToUzKirill(s).replaceAll('қ','қ').replaceAll('ў','ў'); }

export function translateClientGeo(language, text) {
  const norm = normalizeText(text);
  const hit = GEO[norm];
  if (!hit) return null;
  return hit[language] || hit.ru || text;
}

export function translateClientPhrase(language, text) {
  if (!text) return text;
  const lang = language || 'uz_lotin';
  const norm = normalizeText(text);
  if (lang === 'uz_lotin') return norm;
  const geo = translateClientGeo(lang, norm);
  if (geo) return geo;
  const direct = phraseMap[lang]?.[norm];
  if (direct) return direct;
  if (lang === 'uz_kirill') return latinToUzKirill(norm);
  if (lang === 'qq_kirill') return phraseMap.qq_kirill?.[norm] || latinToQqKirill(norm);
  return norm;
}

export function formatClientMoney(language, value) {
  if (typeof value !== 'number') return '—';
  const locale = language === 'ru' ? 'ru-RU' : 'uz-UZ';
  const unit = translateClientPhrase(language, "so'm");
  return `${new Intl.NumberFormat(locale).format(value)} ${unit}`;
}

export function useClientText() {
  const langCtx = useLanguage() || {};
  const language = langCtx.language || langCtx.langKey || 'uz_lotin';
  const tr = langCtx.tr;
  const t = langCtx.t || {};
  const cp = useMemo(() => (fallback, key) => {
    const translatedFallback = translateClientPhrase(language, fallback);
    if (key && typeof tr === 'function') return tr(key, translatedFallback);
    return translatedFallback;
  }, [language, tr]);
  return { ...langCtx, language, t, cp };
}
