import { useQuery } from "@tanstack/react-query";
import { getProperties } from "@/services/property.service";

export function useProperties() {
  return useQuery({
    queryKey: ["properties"],
    queryFn: getProperties,
  });
}
