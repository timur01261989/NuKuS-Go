import { useMemo } from "react";
import { useTaxiOrder } from "./useTaxiOrder";

export function useTaxiPageController() {
  const order = useTaxiOrder();
  return useMemo(() => ({ order }), [order]);
}
