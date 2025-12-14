// API de clima usando Open-Meteo (gratuita, sin API key)
// Coordenadas de Santiago, Chile
const SANTIAGO_LAT = -33.4489;
const SANTIAGO_LON = -70.6693;

export type WeatherIconType =
  | "sun"
  | "cloud"
  | "cloud-rain"
  | "snowflake"
  | "wind";

export interface WeatherData {
  temperature: number;
  description: string;
  message: string;
  icon: WeatherIconType;
}

/**
 * Obtiene el clima actual de Santiago
 */
export async function getWeather(): Promise<WeatherData> {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${SANTIAGO_LAT}&longitude=${SANTIAGO_LON}&current=temperature_2m,weather_code&timezone=America/Santiago`,
    );

    if (!response.ok) {
      throw new Error("Error al obtener datos del clima");
    }

    const data = await response.json();
    const temperature = Math.round(data.current.temperature_2m);
    const weatherCode = data.current.weather_code;

    // Generar mensaje según la temperatura
    const { message } = getWeatherMessage(temperature);

    // Determinar icono según el código del clima
    const weatherIcon = getWeatherIcon(weatherCode);

    return {
      temperature,
      description: getWeatherDescription(weatherCode),
      message,
      icon: weatherIcon,
    };
  } catch (error) {
    // En caso de error, retornar datos por defecto
    return {
      temperature: 20,
      description: "Despejado",
      message: "Perfecto para caminar al paradero.",
      icon: "sun",
    };
  }
}

/**
 * Obtiene el mensaje según la temperatura
 */
function getWeatherMessage(temperature: number): { message: string } {
  if (temperature < 10) {
    return {
      message: "Hace mucho frío. Abrígate bien antes de salir.",
    };
  } else if (temperature < 18) {
    return {
      message: "Hace un poco de frío. Lleva una chaqueta por si acaso.",
    };
  } else if (temperature <= 27) {
    return {
      message: "Perfecto para caminar al paradero.",
    };
  } else {
    return {
      message: "Hace mucho calor. Usa bloqueador solar y mantente hidratado.",
    };
  }
}

/**
 * Obtiene el icono según el código del clima
 */
function getWeatherIcon(weatherCode: number): WeatherIconType {
  // Códigos de lluvia (51-67, 80-82, 95-99)
  if (
    (weatherCode >= 51 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82) ||
    (weatherCode >= 95 && weatherCode <= 99)
  ) {
    return "cloud-rain";
  }

  // Códigos de nieve (71-77, 85-86)
  if (
    (weatherCode >= 71 && weatherCode <= 77) ||
    (weatherCode >= 85 && weatherCode <= 86)
  ) {
    return "snowflake";
  }

  // Códigos nublados (2-3, 45-48)
  if (
    (weatherCode >= 2 && weatherCode <= 3) ||
    (weatherCode >= 45 && weatherCode <= 48)
  ) {
    return "cloud";
  }

  // Despejado o mayormente despejado (0-1)
  return "sun";
}

/**
 * Obtiene la descripción del clima según el código del clima
 */
function getWeatherDescription(weatherCode: number): string {
  // Códigos de clima de WMO (World Meteorological Organization)
  const weatherCodes: Record<number, string> = {
    0: "Despejado",
    1: "Mayormente despejado",
    2: "Parcialmente nublado",
    3: "Nublado",
    45: "Niebla",
    48: "Niebla con escarcha",
    51: "Llovizna ligera",
    53: "Llovizna moderada",
    55: "Llovizna densa",
    56: "Llovizna helada ligera",
    57: "Llovizna helada densa",
    61: "Lluvia ligera",
    63: "Lluvia moderada",
    65: "Lluvia intensa",
    66: "Lluvia helada ligera",
    67: "Lluvia helada intensa",
    71: "Nieve ligera",
    73: "Nieve moderada",
    75: "Nieve intensa",
    77: "Granizo",
    80: "Chubascos ligeros",
    81: "Chubascos moderados",
    82: "Chubascos intensos",
    85: "Nevadas ligeras",
    86: "Nevadas intensas",
    95: "Tormenta",
    96: "Tormenta con granizo",
    99: "Tormenta intensa con granizo",
  };

  return weatherCodes[weatherCode] || "Despejado";
}
