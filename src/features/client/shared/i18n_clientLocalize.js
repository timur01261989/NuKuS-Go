import { useMemo } from 'react';
import { useLanguage } from '@/shared/i18n/useLanguage';

const phraseMap = {
  ru: {
    "so'm": 'сум',
    "Hamyon": 'Кошелек',
    "Joriy balans": 'Текущий баланс',
    "Yangilash": 'Обновить',
    "Eslatma: demo hamyon backend yoqilgan bo‘lsa ishlaydi. Agar API yo‘q bo‘lsa, bu sahifa balansni ko‘rsata olmaydi.": 'Примечание: демо-кошелек работает, если включен backend. Если API недоступен, эта страница не сможет показать баланс.',
    "Xatolik": 'Ошибка',
    "Payme / Click": 'Payme / Click',
    "Qayerga boramiz?": 'Куда поедем?',
    "Haydovchi qidirilmoqda...": 'Ищем водителя...',
    "To'lov tekshirilmoqda...": 'Проверяем оплату...',
    "Muvaffaqiyatli yakunlandi!": 'Успешно завершено!',
    "Eng yaqin mashinani aniqlayapmiz": 'Определяем ближайшую машину',
    "Iltimos, kutib turing": 'Пожалуйста, подождите',
    "Yuk tashish": 'Грузоперевозка',
    "Eltish xizmati": 'Доставка',
    "Viloyatlar aro": 'Межобластные поездки',
    "Tumanlar aro": 'Межрайонные поездки',
    "Avto Bozor": 'Авторынок',
    "Eltib berish": 'Доставка',
    "Yuk joylanmoqda...": 'Размещается груз...',
    "Yuk e’loni yaratildi. Endi haydovchilar taklif yuboradi.": 'Объявление о грузе создано. Теперь водители будут отправлять предложения.',
    "Haydovchi tanlandi ✅": 'Водитель выбран ✅',
    "Mos mashina topilmadi (yoki hali online yo‘q)": 'Подходящая машина не найдена (или пока не онлайн)',
    "Xaritadan belgilang": 'Отметьте на карте',
    "Yuborish manzili": 'Адрес отправки',
    "Tushirish manzili": 'Адрес доставки',
    "Yuk detali": 'Детали груза',
    "Yukni e’lon qilish": 'Опубликовать груз',
    "Yuk nima?": 'Что за груз?',
    "Yuk turi (ixtiyoriy)": 'Тип груза (необязательно)',
    "Izoh (ixtiyoriy)": 'Комментарий (необязательно)',
    "Yukni rasmga oling": 'Сфотографировать груз',
    "Yuklovchi kerakmi?": 'Нужен грузчик?',
    "Xaritadan aniq olish manzili": 'Точный адрес забора с карты',
    "Xaritadan aniq topshirish manzili": 'Точный адрес доставки с карты',
    "Buyurtma yangilandi": 'Заказ обновлен',
    "Buyurtma saqlanmadi": 'Заказ не сохранен',
    "Buyurtmani o‘chirasizmi?": 'Удалить заказ?',
    "Bu amalni bekor qilib bo‘lmaydi.": 'Это действие нельзя отменить.',
    "Bekor qilish": 'Отмена',
    "Buyurtma o‘chirildi": 'Заказ удален',
    "Buyurtmani tahrirlash": 'Редактирование заказа',
    "Shahar, tumanlar aro va viloyatlar aro eltish bir joyda boshqariladi.": 'Городская, межрайонная и межобластная доставка управляются в одном месте.',
    "Xaritadan aniq manzil": 'Точный адрес с карты',
    "Manzilni o‘zgartirish": 'Изменить адрес',
    "Xaritadan tanlash": 'Выбрать на карте',
    "Qaerga topshirish": 'Куда доставить',
    "Aniq manzil": 'Точный адрес',
    "Izoh": 'Комментарий',
    "Mos viloyatlar aro reys": 'Подходящий межобластной рейс',
    "Olish manzilini tanlang": 'Выберите адрес забора',
    "Topshirish manzilini tanlang": 'Выберите адрес доставки',
    "Izoh kuryerga yo‘l topishda yordam beradi.": 'Комментарий поможет курьеру найти дорогу.',
    "Kichik quti": 'Маленькая коробка',
    "Katta quti": 'Большая коробка',
    "Yuk turi": 'Тип груза',
    "Yuk rasmi (ixtiyoriy)": 'Фото груза (необязательно)',
    "Kontaktlardan tanlash ishlashi mumkin.": 'Выбор из контактов может работать.',
    "Kontaktlar API yo‘q — demo ro‘yxat chiqadi.": 'API контактов недоступен — будет показан демо-список.',
    "Telefon raqam": 'Номер телефона',
    "Juda og‘ir": 'Очень тяжелый',
    "Noma'lum manzil": 'Неизвестный адрес',
    "Manzilni aniqlab bo'lmadi": 'Не удалось определить адрес',
    "Mos reys topilmadi": 'Подходящий рейс не найден',
    "Qidirishda xatolik": 'Ошибка при поиске',
    "Kamida bitta o'rindiq tanlang!": 'Выберите хотя бы одно место!',
    "Avval viloyatni tanlang": 'Сначала выберите область',
    "Ketish sanasi": 'Дата выезда',
    "Safar bekor qilindi. Agar firibgarlik aniqlansa reyting tushiriladi!": 'Поездка отменена. При выявлении мошенничества рейтинг будет снижен!',
    "Haydovchi ismi": 'Имя водителя',
    "Qabul qilindi": 'Принято',
    "📞 Qo'ng'iroq": '📞 Позвонить',
    "Safarni bekor qilasizmi?": 'Отменить поездку?',
    "GPS orqali haydovchi bilan birga ketayotganingiz aniqlansa jarima yoziladi!": 'Если по GPS будет определено, что вы едете вместе с водителем, будет начислен штраф!',
    "Ha, bekor qilish": 'Да, отменить',
    "Yo'q": 'Нет',
    "Hudud va tumanlarni tanlang": 'Выберите регион и район',
    "Xatolik: reyslar topilmadi": 'Ошибка: рейсы не найдены',
    "So‘rov yuborilmoqda...": 'Отправляется запрос...',
    "Nukusdan qayerga?": 'Куда из Нукуса?',
    "Manzildan manzilgacha": 'От адреса до адреса',
    "Qaerga (manzil)": 'Куда (адрес)',
    "Ixtiyoriy (majburiy emas)": 'Необязательно',
    "So‘rov yuborish": 'Отправить запрос',
    "Qabul qiluvchi raqami va buyum haqida...": 'Номер получателя и информация о товаре...',
    "Pochta xizmati:": 'Услуга посылки:',
    "Buyirtma jonatish": 'Отправить заказ',
    "Avtomobil nomi yo'q": 'Название автомобиля отсутствует',
    "Standart (Pitak)": 'Стандарт (Пятак)',
    "Manzildan manzilga": 'От адреса до адреса',
    "Tanlangan pitak": 'Выбранный пятак',
    "Yo‘l topilmadi": 'Маршрут не найден',
    "Davom eting": 'Продолжить',
    "Manzillar topilmadi. Ortga qaytib, yo‘lni tanlang.": 'Маршрут не найден. Вернитесь назад и выберите путь.',
    "Geolokatsiya mavjud emas": 'Геолокация недоступна',
    "Joylashuvni aniqlab bo'lmadi": 'Не удалось определить местоположение',
    "Xaritani siljitib yo'lovchini olish nuqtasini o'zgartiring": 'Передвиньте карту, чтобы изменить точку посадки',
    "Oraliq bekat": 'Промежуточная остановка',
    "Oraliq bekat qo'shildi": 'Промежуточная остановка добавлена',
    "Manzilingiz aniqlanmoqda...": 'Определяем ваш адрес...',
    "Qaerga borasiz?": 'Куда поедете?',
    "O'zgartirish": 'Изменить',
    "Manzil aniqlanmoqda...": 'Адрес определяется...',
    "Manzil kiriting...": 'Введите адрес...',
    "reklama e’lonlar": 'рекламные объявления',
    "E’lonlar": 'Объявления',
    "E’lonlarni yuklab bo‘lmadi": 'Не удалось загрузить объявления',
    "E’lon": 'Объявление',
    "Narx: —": 'Цена: —',
    "Mening joylashuvim": 'Мое местоположение',
    "Manzil topilmadi": 'Адрес не найден',
    "Yo'lovchini olish nuqtasi aniqlanmadi": 'Точка посадки не определена',
    "Buyurtma yuborilmoqda...": 'Заказ отправляется...',
    "Yo'lovchini olish nuqtasi": 'Точка посадки',
    "Serverdan ID kelmadi": 'Сервер не вернул ID',
    "Buyurtma yuborildi": 'Заказ отправлен',
    "Zakaz berishda xatolik: ": 'Ошибка при создании заказа: ',
    "Server bilan aloqa yo'q": 'Нет связи с сервером',
    "Bekor qilinmoqda...": 'Отменяется...',
    "Safar bekor qilindi": 'Поездка отменена',
    "Haydovchi topildi": 'Водитель найден',
    "Haydovchi yetib keldi": 'Водитель прибыл',
    "Safar yakunlandi. Rahmat!": 'Поездка завершена. Спасибо!',
  },
  en: {
    "so'm": 'UZS', "Hamyon": 'Wallet', "Joriy balans": 'Current balance', "Yangilash": 'Refresh',
    "Xatolik": 'Error', "Viloyatlar aro": 'Inter-regional', "Tumanlar aro": 'Inter-district',
    "Yuk tashish": 'Freight', "Eltish xizmati": 'Delivery', "Xaritadan tanlash": 'Pick on map',
    "Qaerga borasiz?": 'Where are you going?', "Manzil kiriting...": 'Enter address...',
    "Manzilingiz aniqlanmoqda...": 'Resolving your address...', "Mening joylashuvim": 'My location',
    "E’lonlar": 'Ads', "reklama e’lonlar": 'sponsored ads', "Narx: —": 'Price: —',
    "Xaritadan belgilang": 'Pick on map', "Yuborish manzili": 'Pickup address', "Tushirish manzili": 'Dropoff address',
    "Yukni e’lon qilish": 'Publish cargo', "Yuk nima?": 'What is the cargo?', "Izoh": 'Comment',
    "Buyurtmani tahrirlash": 'Edit order', "Buyurtma o‘chirildi": 'Order deleted',
    "Buyurtma yangilandi": 'Order updated', "Buyurtma saqlanmadi": 'Order was not saved',
    "Safarni bekor qilasizmi?": 'Cancel the trip?', "Ha, bekor qilish": 'Yes, cancel', "Yo'q": 'No',
    "Nukusdan qayerga?": 'Where to from Nukus?', "Manzildan manzilgacha": 'Door to door',
    "So‘rov yuborish": 'Send request', "Buyirtma jonatish": 'Send order', "Manzil topilmadi": 'Address not found',
    "Buyurtma yuborildi": 'Order sent', "Safar yakunlandi. Rahmat!": 'Trip completed. Thank you!',
  },
};

export function translateClientPhrase(language, text) {
  if (!text) return text;
  const lang = language || 'uz_lotin';
  if (lang === 'uz_lotin') return text;
  return phraseMap[lang]?.[text] || text;
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
