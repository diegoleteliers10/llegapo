import { useQuery } from "@tanstack/react-query";
import type { Deviation } from "@/app/api/deviations/route";

interface DeviationsResponse {
  success: boolean;
  data: Deviation[];
  timestamp: number;
  error?: string;
}

/**
 * Hook para obtener los desvíos de Red Movilidad
 * Con caché de 1 hora
 */
export function useDeviations() {
  return useQuery<DeviationsResponse, Error>({
    queryKey: ["deviations"],
    queryFn: async () => {
      const response = await fetch("/api/deviations");
      if (!response.ok) {
        throw new Error("Error al obtener desvíos");
      }
      return response.json();
    },
    staleTime: 60 * 60 * 1000, // 1 hora
    gcTime: 24 * 60 * 60 * 1000, // Mantener en caché por 24 horas
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Cambiado a true para mostrar estado de carga al montar
    retry: 2,
  });
}
