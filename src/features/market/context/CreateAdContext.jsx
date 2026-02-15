
import React, { createContext, useContext, useMemo, useState } from "react";

const CreateAdContext = createContext(null);

const defaultAd = {
  title: "",
  brand: "",
  model: "",
  year: "",
  city: "",
  mileage: "",
  price: "",
  currency: "$",
  fuel: "",
  transmission: "",
  color: "",
  exchange: false,
  kredit: false,
  description: "",
  sellerName: "",
  sellerPhone: "",
  photos: [],
};

export function CreateAdProvider({ children }) {
  const [ad, setAd] = useState(defaultAd);
  const [step, setStep] = useState(0);

  const value = useMemo(
    () => ({
      ad,
      setAd,
      step,
      setStep,
      reset: () => {
        setAd(defaultAd);
        setStep(0);
      },
      patch: (patch) => setAd((p) => ({ ...p, ...patch })),
    }),
    [ad, step]
  );

  return <CreateAdContext.Provider value={value}>{children}</CreateAdContext.Provider>;
}

export function useCreateAd() {
  const ctx = useContext(CreateAdContext);
  if (!ctx) throw new Error("useCreateAd must be used inside CreateAdProvider");
  return ctx;
}
