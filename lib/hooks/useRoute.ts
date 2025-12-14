import { useQuery } from "@tanstack/react-query";

export interface Paradero {
  codigo: string;
  nombre: string;
  comuna: string;
  ubicacion: {
    latitud: number;
    longitud: number;
  };
}

export interface RouteData {
  servicio: string;
  route: {
    destino: string;
    totalParaderos: number;
    paraderos: Paradero[];
    recorrido: {
      puntos: number;
      coordenadas: Array<{
        longitud: number;
        latitud: number;
      }>;
    };
    horarios: Array<{
      tipo: string;
      inicio: string;
      fin: string;
    }>;
    tieneItinerario: boolean;
  };
  metadata: {
    tieneIda: boolean;
    tieneRegreso: boolean;
    totalKilometros: number;
    comunasRecorridas: string[];
  };
}

interface RouteResponse {
  success: boolean;
  data: RouteData;
  timestamp: number;
}

export function useRoute(busCode: string | null) {
  return useQuery<RouteResponse, Error>({
    queryKey: ["route", busCode],
    queryFn: async () => {
      if (!busCode) {
        throw new Error("Código de recorrido requerido");
      }
      const response = await fetch(
        `https://llegapo-server.vercel.app/v1/routes/${busCode}/formatted`
      );
      if (!response.ok) {
        throw new Error("Error al obtener información del recorrido");
      }
      return response.json();
    },
    enabled: !!busCode,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
