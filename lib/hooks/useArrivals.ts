import { useQuery } from "@tanstack/react-query";
import {
  getStopArrivals,
  getBusArrivals,
  type StopArrivalsResponse,
  type BusArrivalsResponse,
} from "@/lib/api";

/**
 * Hook para obtener las llegadas de un paradero
 */
export function useStopArrivals(stopId: string | null, enabled: boolean = true) {
  return useQuery<StopArrivalsResponse, Error>({
    queryKey: ["stopArrivals", stopId],
    queryFn: () => getStopArrivals(stopId!),
    enabled: enabled && !!stopId && stopId.trim() !== "",
    staleTime: 30 * 1000, // 30 segundos
  });
}

/**
 * Hook para obtener los detalles de un bus específico en un paradero
 */
export function useBusArrivals(
  stopId: string | null,
  busId: string | null,
  enabled: boolean = true
) {
  return useQuery<BusArrivalsResponse, Error>({
    queryKey: ["busArrivals", stopId, busId],
    queryFn: () => getBusArrivals(stopId!, busId!),
    enabled: enabled && !!stopId && !!busId && stopId.trim() !== "" && busId.trim() !== "",
    staleTime: 30 * 1000, // 30 segundos
  });
}
