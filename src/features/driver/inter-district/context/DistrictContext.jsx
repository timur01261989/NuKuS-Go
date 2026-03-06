import React, { createContext, useContext, useEffect, useMemo, useReducer, useCallback } from 'react';
import { message } from 'antd';

import { MODES, initialState, pricingReducer } from './pricingReducer';
import { districtData } from '../services/districtData';
import { osrmRoute } from '../services/osrm';

const Ctx = createContext(null);

export function DistrictProvider({ children }) {
  const [state, dispatch] = useReducer(pricingReducer, initialState);

  // Keep mode in localStorage (so driver doesn't forget on restart)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('inter_district_mode');
      if (saved && (saved === MODES.STANDARD || saved === MODES.PREMIUM)) {
        dispatch({ type: 'SET_MODE', mode: saved });
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try { localStorage.setItem('inter_district_mode', state.mode); } catch {}
  }, [state.mode]);

  const setMode = useCallback((mode) => dispatch({ type: 'SET_MODE', mode }), []);
  const resetTrip = useCallback(() => dispatch({ type: 'RESET' }), []);
  const setDriverLoc = useCallback((loc) => dispatch({ type: 'SET_DRIVER_LOC', loc }), []);

  const toggleSeat = useCallback((key) => dispatch({ type: 'TOGGLE_SEAT', key }), []);
  const setSeatPrice = useCallback((key, price) => dispatch({ type: 'SET_SEAT_PRICE', key, price }), []);

  const addPassenger = useCallback((passenger) => dispatch({ type: 'ADD_PASSENGER', passenger }), []);
  const removePassenger = useCallback((id) => dispatch({ type: 'REMOVE_PASSENGER', id }), []);

  const setPremiumClients = useCallback((clients) => dispatch({ type: 'SET_PREMIUM_CLIENTS', clients }), []);
  const upsertPremiumClient = useCallback((client) => dispatch({ type: 'UPSERT_PREMIUM_CLIENT', client }), []);

  const setPartialDeparture = useCallback((payload) => dispatch({ type: 'SET_PARTIAL_DEPARTURE', payload }), []);

  // Pricing: STANDARD uses fixed price per seat from districtData, PREMIUM adds pickup fee based on OSRM distance
  useEffect(() => {
    let cancelled = false;

    async function recompute() {
      try {
        const takenSeats = Object.values(state.seats).filter(s => s.taken).length;

        // Base price (STANDARD: fixed; PREMIUM: base per seat)
        const baseSeatPrice = districtData.baseSeatPrice;

        // If driver set per-seat custom prices, use them, otherwise baseSeatPrice
        const seatPrices = Object.entries(state.seats)
          .filter(([, s]) => s.taken)
          .map(([, s]) => (s.price && s.price > 0 ? s.price : baseSeatPrice));
        const seatsSum = seatPrices.reduce((a, b) => a + b, 0);

        let pickupFee = 0;
        let distanceKm = null;
        let etaMin = null;

        if (state.mode === MODES.PREMIUM) {
          // If we have selected premium client (first one in list for now)
          const client = state.premiumClients?.[0];
          if (client?.lat && client?.lng && state.driverLoc) {
            const route = await osrmRoute(state.driverLoc, [client.lat, client.lng]);
            if (!cancelled) {
              distanceKm = route?.distanceKm ?? null;
              etaMin = route?.durationMin ?? null;
              pickupFee = districtData.pickupFee;
              // If client is far, you can scale pickupFee by distance if you want (kept simple)
            }
          } else {
            pickupFee = districtData.pickupFee;
          }
        }

        // Partial departure: if enabled and strategy split_to_clients, spread empty-seat cost among taken seats
        let total = seatsSum + pickupFee;
        if (state.mode === MODES.PREMIUM && state.partialDeparture?.enabled && state.partialDeparture?.strategy === 'split_to_clients') {
          const maxSeats = 4;
          const empty = Math.max(0, maxSeats - takenSeats);
          if (takenSeats > 0 && empty > 0) {
            const emptyCost = empty * baseSeatPrice;
            total = total + emptyCost; /// total increases; UI can display per-client share
          }
        }

        if (!cancelled) {
          dispatch({
            type: 'SET_PRICING',
            pricing: {
              baseSeatPrice,
              pickupFee,
              total,
              distanceKm,
              etaMin,
            },
          });
        }
      } catch (e) {
        if (!cancelled) dispatch({ type: 'SET_ERROR', error: e?.message || String(e) });
      }
    }

    recompute();
    return () => {
      cancelled = true;
    };
  }, [state.mode, state.seats, state.driverLoc, state.premiumClients, state.partialDeparture]);

  // Helper: locate once
  const locateOnce = useCallback(() => {
    if (!navigator.geolocation) {
      message.error('Geolocation yo‘q');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const loc = [p.coords.latitude, p.coords.longitude];
        setDriverLoc(loc);
        message.success("Joylashuv yangilandi");
      },
      () => message.error('Joylashuvni olishda xatolik'),
      { enableHighAccuracy: true, timeout: 9000 }
    );
  }, [setDriverLoc]);

  const value = useMemo(
    () => ({
      state,
      MODES,
      mode: state.mode,
      driverLoc: state.driverLoc,
      seats: state.seats,
      passengers: state.passengers,
      route: state.route,
      pricing: state.pricing,
      premiumClients: state.premiumClients,
      partialDeparture: state.partialDeparture,
      lastError: state.lastError,

      // actions
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
    }),
    [state, MODES, setMode, resetTrip, setDriverLoc, locateOnce, toggleSeat, setSeatPrice, addPassenger, removePassenger, setPremiumClients, upsertPremiumClient, setPartialDeparture]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDistrict() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDistrict must be used inside DistrictProvider');
  return v;
}