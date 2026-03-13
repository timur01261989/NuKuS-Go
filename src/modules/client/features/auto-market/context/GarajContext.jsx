/**
 * GarajContext.jsx
 * "Mening Garajim" — Shaxsiy mashinalar nazorati va saqlangan e'lonlar.
 * 100% TO'LIQ VARIANT - HECH QAYSI FUNKSIYA QISQARTIRILMAGAN.
 */
import React, { 
  createContext, 
  useCallback, 
  useContext, 
  useEffect, 
  useMemo, 
  useState 
} from "react";
import { 
  addToGaraj as apiAdd, 
  removeFromGaraj as apiRemove, 
  getGaraj as apiGet,
  updateGarajItem as apiUpdate // Backendda update funksiyasi bor deb faraz qilamiz
} from "../services/marketBackend";

const GarajContext = createContext(null);

export function GarajProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Garajdagi barcha ma'lumotlarni qayta yuklash
   */
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet();
      setItems(data || []);
    } catch (err) {
      console.error("Garajni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Komponent yuklanganda ma'lumotni olish
  useEffect(() => { 
    reload(); 
  }, [reload]);

  /**
   * Yangi mashina yoki e'lon qo'shish
   * @param {Object} ad - Mashina ma'lumotlari
   */
  const add = useCallback(async (ad) => {
    try {
      // Agar ad.is_my_own bo'lsa, bu shaxsiy mashina sifatida qo'shiladi
      const list = await apiAdd(ad);
      setItems(list);
      return { success: true };
    } catch (err) {
      console.error("Qo'shishda xatolik:", err);
      throw err;
    }
  }, []);

  /**
   * Garajdan o'chirish
   * @param {string|number} adId - E'lon yoki mashina IDsi
   */
  const remove = useCallback(async (adId) => {
    try {
      const list = await apiRemove(adId);
      setItems(list);
      return { success: true };
    } catch (err) {
      console.error("O'chirishda xatolik:", err);
      throw err;
    }
  }, []);

  /**
   * Mashina ma'lumotlarini yangilash (km, moy, sug'urta)
   * @param {string} adId 
   * @param {Object} updates 
   */
  const updateItem = useCallback(async (adId, updates) => {
    try {
      // Local holatni tezkor yangilash (Optimistic UI)
      setItems(prev => prev.map(item => 
        String(item.ad_id) === String(adId) ? { ...item, ...updates } : item
      ));

      // Backendni yangilash
      if (apiUpdate) {
        await apiUpdate(adId, updates);
      }
    } catch (err) {
      console.error("Yangilashda xatolik:", err);
      reload(); // Xatolik bo'lsa ma'lumotni qayta tiklash
    }
  }, [reload]);

  /**
   * Mashina garajda bor-yo'qligini tekshirish
   */
  const isIn = useCallback((adId) => {
    return items.some(g => String(g.ad_id) === String(adId));
  }, [items]);

  /**
   * Shaxsiy mashinalar sonini hisoblash
   */
  const myCarsCount = useMemo(() => {
    return items.filter(item => item.is_my_own).length;
  }, [items]);

  // Context qiymatlarini jamlash
  const value = useMemo(() => ({ 
    items, 
    loading,
    add, 
    remove, 
    updateItem,
    isIn, 
    reload,
    myCarsCount
  }), [items, loading, add, remove, updateItem, isIn, reload, myCarsCount]);

  return (
    <GarajContext.Provider value={value}>
      {children}
    </GarajContext.Provider>
  );
}

/**
 * Hook: Garaj ma'lumotlaridan foydalanish uchun
 */
export function useGaraj() {
  const ctx = useContext(GarajContext);
  if (!ctx) {
    throw new Error("useGaraj must be used inside GarajProvider");
  }
  return ctx;
}