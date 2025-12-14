import { useQuery } from "@tanstack/react-query";
import type { Tarifa } from "@/app/api/tarifas/route";

export interface InformacionGeneral {
  sistemaIntegrado: boolean;
  periodoIntegracion: number;
  maxTransbordos: number;
  formasPago: string[];
}

interface TarifasResponse {
  success: boolean;
  data: {
    tarifas: Tarifa[];
    informacionGeneral: InformacionGeneral;
  };
  timestamp: number;
  error?: string;
}

/**
 * Hook para obtener las tarifas de Red Movilidad
 * Con caché de 24 horas (las tarifas no cambian frecuentemente)
 */
export function useTarifas() {
  return useQuery<TarifasResponse, Error>({
    queryKey: ["tarifas"],
    queryFn: async () => {
      const response = await fetch("/api/tarifas");
      if (!response.ok) {
        throw new Error("Error al obtener tarifas");
      }
      return response.json();
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 horas
    gcTime: 7 * 24 * 60 * 60 * 1000, // Mantener en caché por 7 días
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
  });
}
