"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  ChevronRight,
  Bell,
  MapPin,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import {
  parseTime,
  getTimeColor,
  getDotColor,
} from "@/lib/api";
import { useStopArrivals, useBusArrivals } from "@/lib/hooks/useArrivals";

export default function BusquedaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const stopId = searchParams.get("stop") || "";
  const busId = searchParams.get("busId") || "";
  const [searchInput, setSearchInput] = useState("");

  // Usar hooks de TanStack Query
  const stopArrivalsQuery = useStopArrivals(
    stopId || null,
    !busId && !!stopId // Solo habilitar si no hay busId y hay stopId
  );

  const busArrivalsQuery = useBusArrivals(
    stopId || null,
    busId || null,
    !!busId && !!stopId // Solo habilitar si hay ambos
  );

  // Extraer datos y estados de las queries
  const arrivals = stopArrivalsQuery.data?.data || [];
  const busDetails = busArrivalsQuery.data?.data || null;
  const loading = stopArrivalsQuery.isLoading || busArrivalsQuery.isLoading;
  const error = stopArrivalsQuery.error || busArrivalsQuery.error;

  // Guardar búsqueda en localStorage
  const saveRecentSearch = (stop: string, busId?: string) => {
    if (typeof window === "undefined") return;

    const STORAGE_KEY = "llegapo_recent_searches";
    const MAX_RECENT_SEARCHES = 10;

    const newSearch = {
      stop: stop.trim().toUpperCase(),
      busId: busId?.trim(),
      timestamp: Date.now(),
    };

    const stored = localStorage.getItem(STORAGE_KEY);
    let searches = stored ? JSON.parse(stored) : [];

    // Eliminar duplicados (mismo stop y busId)
    searches = searches.filter(
      (s: { stop: string; busId?: string }) => !(s.stop === newSearch.stop && s.busId === newSearch.busId)
    );

    // Agregar la nueva búsqueda al inicio
    searches.unshift(newSearch);

    // Limitar a MAX_RECENT_SEARCHES
    searches = searches.slice(0, MAX_RECENT_SEARCHES);

    // Guardar en localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  };

  useEffect(() => {
    if (stopId) {
      // Guardar búsqueda cuando se carga la página con parámetros
      saveRecentSearch(stopId, busId || undefined);
    }
  }, [stopId, busId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/busqueda?stop=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleViewDetails = (servicio: string) => {
    if (stopId) {
      router.push(`/busqueda?stop=${encodeURIComponent(stopId)}&busId=${encodeURIComponent(servicio)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col map-bg">
      {/* Navbar */}
      <header className="w-full glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Llega Po&apos;
              </h1>
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a
              className="text-white font-medium transition-colors text-sm border-b-2 border-primary pb-0.5"
              href="#"
            >
              Resultados
            </a>
            <a
              className="text-white/60 hover:text-white font-medium transition-colors text-sm"
              href="#"
            >
              Tarifas
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <button className="p-2 text-white/70 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 border border-white/20"></div>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center px-4 py-8 relative overflow-hidden">
        {/* Ambient Background Glows */}
        <div className="absolute top-20 right-10 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[128px] pointer-events-none"></div>
        <div className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-5xl z-10">
          {/* Breadcrumbs and Title Section */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-white/40 text-xs font-mono uppercase tracking-widest mb-2">
                <Link href="/" className="hover:text-white transition-colors">
                  Inicio
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span>Búsqueda</span>
                {stopId && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-primary">{stopId}</span>
                  </>
                )}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {busId ? `Servicio ${busId}` : "Resultados de Paradero"}
              </h2>
              <p className="text-white/60 text-lg font-light">
                {loading ? (
                  "Cargando..."
                ) : error ? (
                  <span className="text-red-400">{error.message || "Error desconocido"}</span>
                ) : busId && busDetails ? (
                  <>
                    Encontramos <span className="text-white font-medium">{busDetails.totalBuses} {busDetails.totalBuses === 1 ? "bus" : "buses"}</span> en camino.
                  </>
                ) : arrivals.length > 0 ? (
                  <>
                    Encontramos <span className="text-white font-medium">{arrivals.length} {arrivals.length === 1 ? "servicio" : "servicios"}</span>{" "}
                    coincidentes para tu búsqueda.
                  </>
                ) : stopId ? (
                  "No se encontraron servicios para este paradero."
                ) : (
                  "Ingresa un código de paradero para buscar."
                )}
              </p>
            </div>
            <div className="w-full md:w-auto min-w-[300px]">
              <form onSubmit={handleSearch} className="relative group">
                <input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="glass-input w-full h-12 pl-10 pr-4 rounded-lg text-sm placeholder:text-white/30 focus:ring-0"
                  placeholder="Nueva búsqueda..."
                  type="text"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
              </form>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="glass-card p-6 rounded-2xl text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-white/80">{error.message || "Error desconocido"}</p>
            </div>
          )}

          {/* Bus Details View - Dos tarjetas separadas (when busId is provided) */}
          {busDetails && !loading && !error && (
            <div className="grid gap-4 mb-6">
              {busDetails.buses.map((bus) => {
                const minutes = parseTime(bus.tiempoLlegada);
                return (
                  <div
                    key={bus.numero}
                    className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-6 group cursor-pointer relative overflow-hidden hover:border-primary/30 transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                    <div className="flex-shrink-0 relative">
                      <div className="w-20 h-20 rounded-xl bg-primary flex flex-col items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                        <span className="text-3xl font-bold text-white">{busDetails.servicio}</span>
                        <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider mt-1">
                          Servicio
                        </span>
                      </div>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold flex items-center gap-1 ${getTimeColor(minutes)}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${getDotColor(minutes)} ${
                              minutes <= 5 ? "animate-pulse" : ""
                            }`}
                          ></span>
                          {bus.tiempoLlegada}
                        </span>
                      </div>
                    </div>

                    <div className="flex-grow z-10">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                        <MapPin className="w-4 h-4 text-primary" />
                        <h3 className="text-xl font-bold text-white">Paradero {busDetails.paradero}</h3>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-white/60">Bus #{bus.numero}:</span>
                          <span className="text-white/80 font-mono text-xs">{bus.ppu}</span>
                          <span className="text-white/50">•</span>
                          <span className="text-white/60">
                            Distancia: {parseInt(bus.distancia).toLocaleString()} m
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 w-full md:w-auto flex md:flex-col justify-between md:justify-center gap-3 md:pl-6 md:border-l md:border-white/5 z-10">
                      <div className="text-right hidden md:block">
                        <span className="block text-xs text-white/40">Tiempo estimado</span>
                        <span className={`block text-sm font-bold ${getTimeColor(minutes)}`}>
                          {bus.tiempoLlegada}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Arrivals Cards Grid - Solo mostrar cuando NO hay busId */}
          {!loading && !error && arrivals.length > 0 && !busId && (
            <div className="grid gap-4">
              {arrivals.map((arrival, index) => {
                const minutes1 = parseTime(arrival.horaprediccionbus1);
                const minutes2 = arrival.horaprediccionbus2
                  ? parseTime(arrival.horaprediccionbus2)
                  : null;

                return (
                  <div
                    key={index}
                    className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-6 group cursor-pointer relative overflow-hidden hover:border-primary/30 transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                    <div className="flex-shrink-0 relative">
                      <div className="w-20 h-20 rounded-xl bg-primary flex flex-col items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
                        <span className="text-3xl font-bold text-white">{arrival.servicio}</span>
                        <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider mt-1">
                          Servicio
                        </span>
                      </div>
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold flex items-center gap-1 ${getTimeColor(minutes1)}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${getDotColor(minutes1)} ${
                              minutes1 <= 5 ? "animate-pulse" : ""
                            }`}
                          ></span>
                          {arrival.horaprediccionbus1}
                        </span>
                      </div>
                    </div>

                    <div className="flex-grow z-10">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                        <MapPin className="w-4 h-4 text-primary" />
                        <h3 className="text-xl font-bold text-white">{arrival.destino}</h3>
                      </div>
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-white/60">Bus 1:</span>
                          <span className="text-white/80 font-mono text-xs">{arrival.ppubus1}</span>
                          <span className="text-white/50">•</span>
                          <span className="text-white/60">
                            {parseInt(arrival.distanciabus1).toLocaleString()} m
                          </span>
                        </div>
                        {arrival.distanciabus2 && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-white/60">Bus 2:</span>
                            <span className="text-white/80 font-mono text-xs">
                              {arrival.ppubus2}
                            </span>
                            <span className="text-white/50">•</span>
                            <span className="text-white/60">
                              {parseInt(arrival.distanciabus2).toLocaleString()} m
                            </span>
                            {minutes2 && (
                              <>
                                <span className="text-white/50">•</span>
                                <span className={`font-medium ${getTimeColor(minutes2)}`}>
                                  {arrival.horaprediccionbus2}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 w-full md:w-auto flex md:flex-col justify-between md:justify-center gap-3 md:pl-6 md:border-l md:border-white/5 z-10">
                      <button
                        onClick={() => handleViewDetails(arrival.servicio)}
                        className="glass-button w-full md:w-auto h-10 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-bold text-white shadow-lg group/btn"
                      >
                        Ver detalles
                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && arrivals.length === 0 && stopId && !busId && (
            <div className="glass-card p-12 rounded-2xl text-center">
              <MapPin className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No se encontraron servicios</h3>
              <p className="text-white/60">
                No hay buses disponibles para el paradero {stopId} en este momento.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
