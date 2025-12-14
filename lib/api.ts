// Configuración de la API
// TODO: Reemplazar con la URL real de tu API
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://llegapo-server.vercel.app";

// Tipos para la API
export interface ArrivalData {
  servicio: string;
  destino: string;
  distanciabus1: string;
  horaprediccionbus1: string;
  ppubus1: string;
  distanciabus2?: string;
  horaprediccionbus2?: string;
  ppubus2?: string;
}

export interface StopArrivalsResponse {
  success: boolean;
  data: ArrivalData[];
  timestamp: number;
}

export interface BusArrival {
  numero: number;
  distancia: string;
  tiempoLlegada: string;
  ppu: string;
}

export interface BusArrivalsResponse {
  success: boolean;
  data: {
    paradero: string;
    servicio: string;
    arrivals: ArrivalData[];
    totalBuses: number;
    buses: BusArrival[];
  };
  timestamp: number;
}

/**
 * Obtiene las llegadas de todos los servicios en un paradero
 * @param stopId - Código del paradero (ej: "PC205")
 * @returns Promise con los datos de llegadas
 */
export async function getStopArrivals(
  stopId: string,
): Promise<StopArrivalsResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/stops/${stopId}/arrivals`, {
    next: { revalidate: 30 }, // Revalidar cada 30 segundos
  });

  if (!response.ok) {
    throw new Error(`Error al obtener datos: ${response.statusText}`);
  }

  const data: StopArrivalsResponse = await response.json();

  if (!data.success) {
    throw new Error("No se pudieron obtener los datos");
  }

  return data;
}

/**
 * Obtiene los detalles de un servicio específico en un paradero
 * @param stopId - Código del paradero (ej: "PC405")
 * @param busId - Código del servicio/bus (ej: "421")
 * @returns Promise con los datos detallados del servicio
 */
export async function getBusArrivals(
  stopId: string,
  busId: string,
): Promise<BusArrivalsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/v1/stops/${stopId}/arrivals/busId?busId=${busId}`,
    {
      next: { revalidate: 30 }, // Revalidar cada 30 segundos
    },
  );

  if (!response.ok) {
    throw new Error(`Error al obtener datos: ${response.statusText}`);
  }

  const data: BusArrivalsResponse = await response.json();

  // No lanzar error cuando success es false; devolver los datos para que la UI maneje el estado vacío o el mensaje
  return data;
}

/**
 * Parsea el tiempo de llegada y extrae el número de minutos
 * @param timeStr - String con el tiempo (ej: "Entre 17 Y 21 min")
 * @returns Número de minutos (toma el primer número encontrado)
 */
export function parseTime(timeStr: string): number {
  const match = timeStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

/**
 * Obtiene el color del texto según el tiempo de llegada
 * @param minutes - Número de minutos
 * @returns Clase de color de Tailwind
 */
export function getTimeColor(minutes: number): string {
  if (minutes <= 5) return "text-green-400";
  if (minutes <= 15) return "text-yellow-400";
  return "text-white/60";
}

/**
 * Obtiene el color del punto indicador según el tiempo de llegada
 * @param minutes - Número de minutos
 * @returns Clase de color de Tailwind para el background
 */
export function getDotColor(minutes: number): string {
  if (minutes <= 5) return "bg-green-500";
  if (minutes <= 15) return "bg-yellow-500";
  return "bg-gray-500";
}
