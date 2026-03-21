import { useMemo } from "react";
import * as dispatchRealtime from "@/services/dispatch/dispatchRealtime";

export default function useRealtime() {
  return useMemo(() => dispatchRealtime, []);
}
