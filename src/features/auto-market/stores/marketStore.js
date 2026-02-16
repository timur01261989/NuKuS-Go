import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Zustand store:
 * - Til, filterlar, favorites, compare list, recently viewed, draft ad
 * - persist middleware: localStorage'da saqlanadi
 *
 * Eslatma: Bu "Universal Market" emas, faqat AUTO MARKET uchun.
 */
export const useMarketStore = create(
  persist(
    (set, get) => ({
      _hydrated: false,
      hydrateOnce: () => {
        if (!get()._hydrated) set({ _hydrated: true });
      },

      // Tillar
      lang: "uz", // uz / qq / ru / en
      setLang: (lang) => set({ lang }),

      // Filterlar
      filters: {
        q: "",
        brandId: null,
        modelId: null,
        city: null,
        priceMin: null,
        priceMax: null,
        yearMin: null,
        yearMax: null,
        fuel: null,
        transmission: null,
        radiusKm: null,
        nearMe: false,
        center: null, // {lat,lng}
        sort: "new", // new | cheap | expensive | year_desc
      },
      setFilters: (patch) => set({ filters: { ...get().filters, ...patch } }),
      resetFilters: () =>
        set({
          filters: {
            q: "",
            brandId: null,
            modelId: null,
            city: null,
            priceMin: null,
            priceMax: null,
            yearMin: null,
            yearMax: null,
            fuel: null,
            transmission: null,
            radiusKm: null,
            nearMe: false,
            center: null,
            sort: "new",
          },
        }),

      // Favorites
      favorites: {}, // { [adId]: true }
      toggleFavorite: (adId) =>
        set((s) => ({ favorites: { ...s.favorites, [adId]: !s.favorites[adId] } })),

      // Compare
      compare: [],
      addToCompare: (car) => {
        const list = get().compare;
        if (list.find((x) => x.id === car.id)) return;
        if (list.length >= 3) return; // 3 ta limit
        set({ compare: [...list, car] });
      },
      removeFromCompare: (id) => set({ compare: get().compare.filter((x) => x.id !== id) }),
      clearCompare: () => set({ compare: [] }),

      // Recently viewed
      recently: [],
      pushRecent: (car) => {
        const list = get().recently.filter((x) => x.id !== car.id);
        list.unshift({
          id: car.id,
          title: car.title,
          price: car.price,
          images: car.images || [],
        });
        set({ recently: list.slice(0, 20) });
      },

      // Create Ad Draft (Wizard)
      draft: {
        brandId: null,
        modelId: null,
        year: null,
        mileage: null,
        color: null,
        fuel: null,
        transmission: null,
        price: null,
        currency: "UZS",
        desc: "",
        phone: "",
        location: null, // {lat,lng,city}
        photos: [], // local files or urls
        options: {},
        vin: "",
      },
      setDraft: (patch) => set({ draft: { ...get().draft, ...patch } }),
      resetDraft: () =>
        set({
          draft: {
            brandId: null,
            modelId: null,
            year: null,
            mileage: null,
            color: null,
            fuel: null,
            transmission: null,
            price: null,
            currency: "UZS",
            desc: "",
            phone: "",
            location: null,
            photos: [],
            options: {},
            vin: "",
          },
        }),
    }),
    {
      name: "auto-market-store-v1",
      version: 1,
      partialize: (s) => ({
        lang: s.lang,
        filters: s.filters,
        favorites: s.favorites,
        compare: s.compare,
        recently: s.recently,
        draft: s.draft,
      }),
    }
  )
);
