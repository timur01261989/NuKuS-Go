import { useQuery } from "@tanstack/react-query";
import { getCarList } from "../../api/cars.service";

export function useCarsList(params = {}) {
  return useQuery({
    queryKey: ["cars", "list", params],
    queryFn: () => getCarList(params),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}
