import { useQuery } from "@tanstack/react-query";
import { getWeather, type WeatherData } from "@/lib/api/weather";

/**
 * Hook para obtener el clima actual de Santiago
 * Con caché de 6 horas (4 peticiones al día máximo)
 */
export function useWeather() {
  return useQuery<WeatherData, Error>({
    queryKey: ["weather", "santiago"],
    queryFn: getWeather,
    staleTime: 6 * 60 * 60 * 1000, // 6 horas - 4 peticiones al día máximo
    gcTime: 24 * 60 * 60 * 1000, // Mantener en caché por 24 horas
    refetchOnWindowFocus: false, // No refetch al cambiar de ventana
    refetchOnMount: false, // No refetch al montar si hay datos en caché
    retry: 2, // Reintentar 2 veces en caso de error
  });
}
