import { useQuery } from "@tanstack/react-query";
import { listApplications } from "@/services/application.service";

export function useApplications(userId: string) {
  return useQuery({
    queryKey: ["applications", userId],
    queryFn: () => listApplications(userId),
    enabled: Boolean(userId),
  });
}
