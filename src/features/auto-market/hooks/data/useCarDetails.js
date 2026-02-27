import { useQuery } from "@tanstack/react-query";
import { getCarDetails } from "../../api/cars.service";

export function useCarDetails(id) {
  return useQuery({
    queryKey: ["cars", "details", id],
    queryFn: () => getCarDetails(id),
    enabled: Boolean(id),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}
