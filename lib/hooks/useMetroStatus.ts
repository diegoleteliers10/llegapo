import { useQuery } from "@tanstack/react-query";
import type { MetroLineStatus } from "@/app/api/metro-status/route";

interface MetroStatusResponse {
  success: boolean;
  data: MetroLineStatus[];
  timestamp: number;
  debug?: {
    found: number;
  };
}

export function useMetroStatus() {
  return useQuery<MetroStatusResponse, Error>({
    queryKey: ["metro-status"],
    queryFn: async () => {
      const response = await fetch("/api/metro-status");
      if (!response.ok) {
        throw new Error("Error al obtener el estado del metro");
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutos - el estado del metro cambia frecuentemente
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
  });
}
