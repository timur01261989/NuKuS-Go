import React, { createContext, useContext, useEffect, useMemo, useReducer, useCallback } from 'react';
import { message } from 'antd';

import { MODES, initialState, pricingReducer } from './pricingReducer';
import { districtData } from '../services/districtData';
import { osrmRoute } from '../services/osrm';

const Ctx = createContext(null);

/**
 * DistrictProvider
 * -------------------------------------------------------
 * Tumanlararo qatnov (InterDistrict) uchun asosiy Context.
 * Haydovchi va mijoz holatlarini, narxlarni va reys parametrlarini boshqaradi.
 * BARCHA FUNKSIYALAR: AC, Trunk, Lux, Full Salon, Eltish, Yuk, Female Only.
 */
export function DistrictProvider({ children }) {
  const [state, dispatch] = useReducer(pricingReducer, initialState);

  // Rejimni localStorage-da saqlash
  useEffect(() => {
    try {
      const saved = localStorage.getItem('inter_district_mode');
      if (saved && (saved === MODES.STANDARD || saved === MODES.PREMIUM)) {
        dispatch({ type: 'SET_MODE', mode: saved });
      }
    } catch (err) {
      console.error("LocalStorage load error:", err);
    }
  }, []);

  useEffect(() => {
    try { 
      localStorage.setItem('inter_district_mode', state.mode); 
    } catch (err) {
      console.error("LocalStorage save error:", err);
    }
  }, [state.mode]);

  // --- BARCHA AMALLAR (ACTIONS) ---

  // 1. Asosiy rejim va joylashuv
  const setMode = useCallback((mode) => dispatch({ type: 'SET_MODE', mode }), []);
  const resetTrip = useCallback(() => dispatch({ type: 'RESET' }), []);
  const setDriverLoc = useCallback((loc) => dispatch({ type: 'SET_DRIVER_LOC', loc }), []);

  // 2. O'rindiqlar va Yo'lovchilar
  const toggleSeat = useCallback((key) => dispatch({ type: 'TOGGLE_SEAT', key }), []);
  const setSeatPrice = useCallback((key, price) => dispatch({ type: 'SET_SEAT_PRICE', key, price }), []);
  const addPassenger = useCallback((p) => dispatch({ type: 'ADD_PASSENGER', passenger: p }), []);
  const removePassenger = useCallback((id) => dispatch({ type: 'REMOVE_PASSENGER', id }), []);

  // 3. Premium (Door-to-door) xizmatlar
  const setPremiumClients = useCallback((list) => dispatch({ type: 'SET_PREMIUM_CLIENTS', list }), []);
  const upsertPremiumClient = useCallback((c) => dispatch({ type: 'UPSERT_PREMIUM_CLIENT', client: c }), []);
  const setPartialDeparture = useCallback((val) => dispatch({ type: 'SET_PARTIAL_DEPARTURE', val }), []);

  // 4. Qulayliklar (Kodingizda bor bo'lgan barcha funksiyalar)
  const setHasAC = useCallback((val) => dispatch({ type: 'SET_HAS_AC', val }), []);
  const setHasTrunk = useCallback((val) => dispatch({ type: 'SET_HAS_TRUNK', val }), []);
  const setIsLux = useCallback((val) => dispatch({ type: 'SET_IS_LUX', val }), []);

  // 5. Butun salonni band qilish (Full Salon)
  const setAllowFullSalon = useCallback((val) => dispatch({ type: 'SET_ALLOW_FULL_SALON', val }), []);
  const setFullSalonPrice = useCallback((price) => dispatch({ type: 'SET_FULL_SALON_PRICE', price }), []);

  // 6. Eltish (Pochta) va Yuk (Bagaj)
  const setHasEltish = useCallback((val) => dispatch({ type: 'SET_HAS_ELTISH', val }), []);
  const setEltishPrice = useCallback((price) => dispatch({ type: 'SET_ELTISH_PRICE', price }), []);
  const setHasYuk = useCallback((val) => dispatch({ type: 'SET_HAS_YUK', val }), []);
  const setYukPrice = useCallback((price) => dispatch({ type: 'SET_YUK_PRICE', price }), []);

  // 7. Gender xavfsizligi (Ayollar rejimi)
  const setFemaleOnly = useCallback((val) => dispatch({ type: 'SET_FEMALE_ONLY', val }), []);

  // GPS Joylashuvni aniqlash
  const locateOnce = useCallback(() => {
    if (!navigator.geolocation) {
      message.error('Geolocation brauzerda qo‘llab-quvvatlanmaydi');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const loc = [p.coords.latitude, p.coords.longitude];
        setDriverLoc(loc);
        message.success("Sizning joylashuvingiz aniqlandi");
      },
      () => message.error('Joylashuvni olishda xatolik yuz berdi'),
      { enableHighAccuracy: true, timeout: 9000 }
    );
  }, [setDriverLoc]);

  // Hamma qiymatlarni bitta object-ga yig'ish (Hech narsa tashlab ketilmadi)
  const value = useMemo(
    () => ({
      // State'ning o'zi
      state,
      MODES,
      
      // Asosiy holatlar
      mode: state.mode,
      driverLoc: state.driverLoc,
      seats: state.seats,
      passengers: state.passengers,
      route: state.route,
      pricing: state.pricing,
      premiumClients: state.premiumClients,
      partialDeparture: state.partialDeparture,
      lastError: state.lastError,

      // Qulayliklar va Xizmatlar state-lari
      hasAC: state.hasAC,
      hasTrunk: state.hasTrunk,
      isLux: state.isLux,
      allowFullSalon: state.allowFullSalon,
      fullSalonPrice: state.fullSalonPrice,
      hasEltish: state.hasEltish,
      eltishPrice: state.eltishPrice,
      hasYuk: state.hasYuk,
      yukPrice: state.yukPrice,
      femaleOnly: state.femaleOnly,

      // BARCHA FUNKSIYALAR (Actions)
      setMode,
      resetTrip,
      setDriverLoc,
      locateOnce,
      toggleSeat,
      setSeatPrice,
      addPassenger,
      removePassenger,
      setPremiumClients,
      upsertPremiumClient,
      setPartialDeparture,
      
      // Qo'shimcha qulayliklar actions
      setHasAC,
      setHasTrunk,
      setIsLux,
      
      // Salon va Xizmatlar actions
      setAllowFullSalon,
      setFullSalonPrice,
      setHasEltish,
      setEltishPrice,
      setHasYuk,
      setYukPrice,
      setFemaleOnly,
    }),
    [
      state, setMode, resetTrip, setDriverLoc, locateOnce, toggleSeat, 
      setSeatPrice, addPassenger, removePassenger, setPremiumClients, 
      upsertPremiumClient, setPartialDeparture, setHasAC, setHasTrunk, 
      setIsLux, setAllowFullSalon, setFullSalonPrice, setHasEltish, 
      setEltishPrice, setHasYuk, setYukPrice, setFemaleOnly
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * useDistrict Hook
 */
export const useDistrict = () => {
  const context = useContext(Ctx);
  if (!context) {
    throw new Error('useDistrict funksiyasi DistrictProvider ichida ishlatilishi shart!');
  }
  return context;
};