"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Bus,
  ArrowRight,
  History,
  CheckCircle,
  AlertTriangle,
  Cloud,
  Sun,
  CloudRain,
  Snowflake,
  Wind,
  Plus,
  Minus,
  X,
  Menu,
} from "lucide-react";
import { useWeather } from "@/lib/hooks/useWeather";
import { useDeviations } from "@/lib/hooks/useDeviations";
import { useMetroStatus } from "@/lib/hooks/useMetroStatus";
import type { WeatherIconType } from "@/lib/api/weather";
import Link from "next/link";
import Image from "next/image";

interface RecentSearch {
  stop: string;
  busId?: string;
  timestamp: number;
}

const STORAGE_KEY = "llegapo_recent_searches";
const MAX_RECENT_SEARCHES = 10;

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("paradero");
  const [stopCode, setStopCode] = useState("");
  const [busCode, setBusCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showAllRecentSearches, setShowAllRecentSearches] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Obtener datos del clima
  const weatherQuery = useWeather();

  // Obtener desvíos
  const deviationsQuery = useDeviations();
  const firstDeviation = deviationsQuery.data?.data?.[0];

  // Obtener estado del metro
  const metroStatusQuery = useMetroStatus();
  const metroLines = metroStatusQuery.data?.data || [];

  // Inicializar búsquedas recientes con lazy initializer para evitar setState en efecto
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored) as RecentSearch[];
    } catch (err) {
      console.error("Error al cargar búsquedas recientes:", err);
      return [];
    }
  });

  // Búsquedas recientes se inicializan con useState lazy; no es necesario usar useEffect aquí

  // Guardar búsqueda en localStorage
  const saveRecentSearch = (stop: string, busId?: string) => {
    if (typeof window === "undefined") return;

    const newSearch: RecentSearch = {
      stop: stop.trim().toUpperCase(),
      busId: busId?.trim(),
      timestamp: Date.now(),
    };

    const stored = localStorage.getItem(STORAGE_KEY);
    let searches: RecentSearch[] = stored ? JSON.parse(stored) : [];

    // Eliminar duplicados (mismo stop y busId)
    searches = searches.filter(
      (s) => !(s.stop === newSearch.stop && s.busId === newSearch.busId),
    );

    // Agregar la nueva búsqueda al inicio
    searches.unshift(newSearch);

    // Limitar a MAX_RECENT_SEARCHES
    searches = searches.slice(0, MAX_RECENT_SEARCHES);

    // Guardar en localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    setRecentSearches(searches);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === "recorrido") {
      // Validación para búsqueda por recorrido
      if (!busCode.trim()) {
        setError("Falta el código del recorrido");
        return;
      }
      setError(null);

      // Guardar búsqueda reciente (solo bus, sin paradero)
      saveRecentSearch("", busCode.trim());

      // Navegar a la página de recorrido
      router.push(`/recorrido/${busCode.trim()}`);
    } else {
      // Validación para búsqueda por paradero
      if (!stopCode.trim()) {
        setError("Falta el código del paradero");
        return;
      }
      setError(null);

      // Guardar búsqueda reciente
      saveRecentSearch(stopCode.trim(), busCode.trim() || undefined);

      const params = new URLSearchParams({ stop: stopCode.trim() });
      if (busCode.trim()) {
        params.append("busId", busCode.trim());
      }
      router.push(`/busqueda?${params.toString()}`);
    }
  };

  const handleRecentSearchClick = (search: RecentSearch) => {
    setStopCode(search.stop);
    if (search.busId) {
      setBusCode(search.busId);
    } else {
      setBusCode("");
    }

    // Si solo hay busId sin stop, ir a la página de recorrido
    if (search.busId && !search.stop) {
      router.push(`/recorrido/${search.busId}`);
    } else {
      // Ejecutar búsqueda automáticamente
      const params = new URLSearchParams({ stop: search.stop });
      if (search.busId) {
        params.append("busId", search.busId);
      }
      router.push(`/busqueda?${params.toString()}`);
    }
  };

  const removeRecentSearch = (
    searchToRemove: RecentSearch,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation(); // Prevenir que se active el click del botón principal

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    let searches: RecentSearch[] = JSON.parse(stored);

    // Eliminar la búsqueda específica (comparar por stop, busId y timestamp)
    searches = searches.filter(
      (s) =>
        !(
          s.stop === searchToRemove.stop &&
          s.busId === searchToRemove.busId &&
          s.timestamp === searchToRemove.timestamp
        ),
    );

    // Guardar en localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    setRecentSearches(searches);
  };

  // Función para obtener el componente de icono según el tipo
  const getWeatherIconComponent = (iconType: WeatherIconType) => {
    const iconProps = {
      className:
        "w-8 h-8 sm:w-8 sm:h-8 shrink-0 transition-all group-hover:drop-shadow-[0_0_12px_currentColor]",
    };

    switch (iconType) {
      case "sun":
        return (
          <Sun
            {...iconProps}
            className={`${iconProps.className} text-yellow-400 group-hover:text-yellow-300`}
          />
        );
      case "cloud":
        return (
          <Cloud
            {...iconProps}
            className={`${iconProps.className} text-gray-400 group-hover:text-gray-300`}
          />
        );
      case "cloud-rain":
        return (
          <CloudRain
            {...iconProps}
            className={`${iconProps.className} text-blue-400 group-hover:text-blue-300`}
          />
        );
      case "snowflake":
        return (
          <Snowflake
            {...iconProps}
            className={`${iconProps.className} text-cyan-400 group-hover:text-cyan-300`}
          />
        );
      case "wind":
        return (
          <Wind
            {...iconProps}
            className={`${iconProps.className} text-gray-300 group-hover:text-gray-200`}
          />
        );
      default:
        return (
          <Sun
            {...iconProps}
            className={`${iconProps.className} text-yellow-400 group-hover:text-yellow-300`}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col map-bg">
      {/* Navbar */}
      <header className="w-full glass-header sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Image
                src="/iconLlega.png"
                alt="Llega Po'"
                width={240}
                height={80}
                className="h-16 w-auto"
                priority
              />
            </Link>
          </div>
          <nav className="hidden md:flex items-center gap-8 ml-auto mr-10">
            <Link
              className="text-white hover:text-white font-medium transition-colors text-sm"
              href="/"
            >
              Inicio
            </Link>
            {/* <a
              className="text-white/60 hover:text-white font-medium transition-colors text-sm"
              href="#"
            >
              Favoritos
            </a> */}
            <Link
              href="/tarifas"
              className="text-white/60 hover:text-white font-medium transition-colors text-sm"
            >
              Tarifas
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {/* Menú hamburguesa para mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Menú móvil desplegable */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-black/80 backdrop-blur-lg">
            <nav className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-4">
              <Link
                className="text-white/80 hover:text-white font-medium transition-colors text-sm py-2"
                href="/"
                onClick={() => setMobileMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link
                href="/tarifas"
                className="text-white/60 hover:text-white font-medium transition-colors text-sm py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tarifas
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12 pb-32 sm:pb-40 relative overflow-hidden">
        {/* Ambient Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-purple-600/10 rounded-full blur-[128px] pointer-events-none"></div>

        {/* Glass Container */}
        <div className="w-full max-w-4xl glass-panel rounded-2xl p-8 md:p-12 relative z-10 mb-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              ¿A dónde vas hoy?
            </h2>
            <p className="text-white/60 text-lg font-light">
              Llega rápido po&apos;, sin esperar de más.
            </p>
          </div>

          {/* Tabs Navigation */}
          <div className="mb-8">
            <div className="flex justify-center gap-1 sm:gap-2 p-0.5 sm:p-1 bg-black/20 backdrop-blur-md rounded-xl w-full sm:w-fit mx-auto border border-white/5">
              <button
                type="button"
                onClick={() => setActiveTab("paradero")}
                className={`px-3 py-2 sm:px-6 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex-1 sm:flex-none ${
                  activeTab === "paradero"
                    ? "bg-white/10 text-white shadow-sm border border-white/10"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                Por Paradero
              </button>
              <button
                onClick={() => setActiveTab("recorrido")}
                type="button"
                className={`px-3 py-2 sm:px-6 sm:py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex-1 sm:flex-none ${
                  activeTab === "recorrido"
                    ? "bg-white/10 text-white shadow-sm border border-white/10"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                Por Recorrido
              </button>
            </div>
          </div>

          {/* Search Form Area */}
          <form
            onSubmit={handleSearch}
            className="grid md:grid-cols-12 gap-6 items-end"
          >
            {activeTab === "paradero" ? (
              <>
                {/* Input: Paradero Code */}
                <div className="md:col-span-5 flex flex-col gap-2 group">
                  <label
                    htmlFor="stopCode"
                    className="text-blue-400 text-sm font-medium ml-1 flex items-center gap-2"
                  >
                    <MapPin className="w-[18px] h-[18px] text-blue-400" />
                    Código de Paradero
                  </label>
                  <div className="relative">
                    <input
                      id="stopCode"
                      value={stopCode}
                      onChange={(e) => {
                        setStopCode(e.target.value.toUpperCase());
                        if (error) setError(null);
                      }}
                      className={`glass-input w-full h-14 pl-4 pr-12 rounded-xl text-lg placeholder:text-white/20 focus:ring-0 ${
                        error ? "border-red-400/50 border-2" : ""
                      }`}
                      placeholder="Ej: PA456"
                      type="text"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
                      <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded">
                        REQ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Input: Micro Number (Optional) */}
                <div className="md:col-span-4 flex flex-col gap-2">
                  <label
                    htmlFor="busCode"
                    className="text-blue-400 text-sm font-medium ml-1 flex items-center gap-2"
                  >
                    <Bus className="w-[18px] h-[18px] text-blue-400" />
                    Recorrido (Opcional)
                  </label>
                  <div className="relative">
                    <input
                      id="busCode"
                      value={busCode}
                      onChange={(e) => setBusCode(e.target.value)}
                      className="glass-input w-full h-14 pl-4 pr-12 rounded-xl text-lg placeholder:text-white/20 focus:ring-0"
                      placeholder="Ej: 406c"
                      type="text"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Input: Solo Recorrido */}
                <div className="md:col-span-9 flex flex-col gap-2">
                  <label
                    htmlFor="busCode"
                    className="text-blue-400 text-sm font-medium ml-1 flex items-center gap-2"
                  >
                    <Bus className="w-[18px] h-[18px] text-blue-400" />
                    Recorrido
                  </label>
                  <div className="relative">
                    <input
                      value={busCode}
                      onChange={(e) => {
                        setBusCode(e.target.value);
                        if (error) setError(null);
                      }}
                      className={`glass-input w-full h-14 pl-4 pr-12 rounded-xl text-lg placeholder:text-white/20 focus:ring-0 ${
                        error ? "border-red-400/50 border-2" : ""
                      }`}
                      placeholder="Ej: 406c"
                      type="text"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
                      <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded">
                        REQ
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Action Button */}
            <div className="md:col-span-3">
              <button
                onClick={handleSearch}
                type="submit"
                className="glass-button w-full h-14 rounded-xl flex items-center justify-center gap-2 text-white font-bold text-lg group"
              >
                <span>Consultar</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-400 text-sm transition-all duration-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Recent/Quick Links */}
          {recentSearches.length > 0 && (
            <div className="mt-10 pt-8 border-t border-white/10">
              <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-4">
                Búsquedas Recientes
              </p>
              <div className="flex flex-wrap gap-3">
                {/* Mostrar búsquedas según el estado */}
                {(showAllRecentSearches
                  ? recentSearches
                  : recentSearches.slice(0, 4)
                ).map((search, index) => {
                  // En mobile, ocultar el 4to elemento si no está expandido
                  const shouldHideOnMobile =
                    !showAllRecentSearches && index === 3;

                  return (
                    <div
                      key={`${search.stop}-${search.busId || ""}-${search.timestamp}`}
                      onClick={() => handleRecentSearchClick(search)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleRecentSearchClick(search);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      className={`relative flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group cursor-pointer ${
                        shouldHideOnMobile ? "hidden sm:flex" : ""
                      }`}
                    >
                      {/* Botón de eliminar - solo visible en hover */}
                      <button
                        onClick={(e) => removeRecentSearch(search, e)}
                        type="button"
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center transition-all z-10 opacity-0 group-hover:opacity-100"
                        aria-label="Eliminar búsqueda reciente"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>

                      <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-blue-500/20 border border-blue-400/30">
                        <History className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-bold text-white">
                          {search.stop || search.busId}
                          {search.stop && search.busId && (
                            <span className="text-primary ml-1">
                              • {search.busId}
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-white/50">
                          {search.stop && search.busId
                            ? "Paradero + Bus"
                            : search.busId && !search.stop
                              ? "Bus Recorrido"
                              : "Solo Paradero"}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Botón "Ver más" cuando hay más búsquedas de las mostradas */}
                {!showAllRecentSearches && recentSearches.length > 3 && (
                  <button
                    onClick={() => setShowAllRecentSearches(true)}
                    type="button"
                    className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group cursor-pointer sm:hidden"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-white">
                      Ver más
                    </span>
                  </button>
                )}

                {!showAllRecentSearches && recentSearches.length > 4 && (
                  <button
                    onClick={() => setShowAllRecentSearches(true)}
                    type="button"
                    className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-white">
                      Ver más
                    </span>
                  </button>
                )}

                {/* Botón "Ver menos" cuando están todas expandidas */}
                {showAllRecentSearches && recentSearches.length > 3 && (
                  <button
                    onClick={() => setShowAllRecentSearches(false)}
                    type="button"
                    className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white">
                      <Minus className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-bold text-white">
                      Ver menos
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Info Cards Grid (Bottom) */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 opacity-60 relative z-10 mt-5 mb-5">
          {metroStatusQuery.isLoading ? (
            <div className="glass-panel p-5 sm:p-4 rounded-xl flex items-center gap-4 sm:gap-4 border-none bg-black/40 group transition-all hover:opacity-100">
              <CheckCircle className="w-8 h-8 sm:w-8 sm:h-8 text-green-400 animate-pulse shrink-0" />
              <div className="min-w-0">
                <h4 className="text-white font-bold text-sm sm:text-sm">
                  Cargando estado...
                </h4>
                <p className="text-white/50 text-xs sm:text-xs">
                  Obteniendo información del metro
                </p>
              </div>
            </div>
          ) : metroStatusQuery.error ? (
            <div className="glass-panel p-5 sm:p-4 rounded-xl flex items-center gap-4 sm:gap-4 border-none bg-black/40 group transition-all hover:opacity-100">
              <CheckCircle className="w-8 h-8 sm:w-8 sm:h-8 text-green-400 shrink-0" />
              <div className="min-w-0">
                <h4 className="text-white font-bold text-sm sm:text-sm">
                  Metro Operativo
                </h4>
                <p className="text-white/50 text-xs sm:text-xs">
                  Todas las líneas funcionando con normalidad.
                </p>
              </div>
            </div>
          ) : metroLines.length > 0 ? (
            (() => {
              const hasAlterations = metroLines.some(
                (line) =>
                  !line.status.toLowerCase().includes("sin alteraciones") &&
                  line.status.toLowerCase() !== "sin alteraciones",
              );
              const linesWithAlterations = metroLines.filter(
                (line) =>
                  !line.status.toLowerCase().includes("sin alteraciones") &&
                  line.status.toLowerCase() !== "sin alteraciones",
              );

              return (
                <Link
                  href="/estado-metro"
                  className="glass-panel p-5 sm:p-4 rounded-xl flex items-center gap-4 sm:gap-4 border-none bg-black/40 group cursor-pointer transition-all hover:opacity-100"
                >
                  {hasAlterations ? (
                    <AlertTriangle className="w-8 h-8 sm:w-8 sm:h-8 text-yellow-400 transition-all group-hover:text-yellow-300 group-hover:drop-shadow-[0_0_12px_rgba(250,204,21,0.8)] shrink-0" />
                  ) : (
                    <CheckCircle className="w-8 h-8 sm:w-8 sm:h-8 text-green-400 transition-all group-hover:text-green-300 group-hover:drop-shadow-[0_0_12px_rgba(74,222,128,0.8)] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <h4 className="text-white font-bold text-sm sm:text-sm">
                      Metro Operativo
                    </h4>
                    <p className="text-white/50 text-xs sm:text-xs">
                      {hasAlterations
                        ? linesWithAlterations.length === 1
                          ? `Línea ${linesWithAlterations[0].line}: ${linesWithAlterations[0].status}`
                          : `${linesWithAlterations.length} líneas con alteraciones`
                        : "Todas las líneas funcionando con normalidad."}
                    </p>
                  </div>
                </Link>
              );
            })()
          ) : (
            <div className="glass-panel p-5 sm:p-4 rounded-xl flex items-center gap-4 sm:gap-4 border-none bg-black/40 group transition-all hover:opacity-100">
              <CheckCircle className="w-8 h-8 sm:w-8 sm:h-8 text-green-400 shrink-0" />
              <div className="min-w-0">
                <h4 className="text-white font-bold text-sm sm:text-sm">
                  Metro Operativo
                </h4>
                <p className="text-white/50 text-xs sm:text-xs">
                  Todas las líneas funcionando con normalidad.
                </p>
              </div>
            </div>
          )}
          {deviationsQuery.isLoading ? (
            <div className="glass-panel p-5 sm:p-4 rounded-xl flex items-center gap-4 sm:gap-4 border-none bg-black/40 group transition-all hover:opacity-100">
              <CheckCircle className="w-8 h-8 sm:w-8 sm:h-8 text-green-400 animate-pulse shrink-0" />
              <div className="min-w-0">
                <h4 className="text-white font-bold text-sm sm:text-sm">
                  Cargando estado...
                </h4>
                <p className="text-white/50 text-xs sm:text-xs">
                  Obteniendo información de desvíos
                </p>
              </div>
            </div>
          ) : deviationsQuery.error ? (
            <div className="glass-panel p-5 sm:p-4 rounded-xl flex items-center gap-4 sm:gap-4 border-none bg-black/40 group transition-all hover:opacity-100">
              <CheckCircle className="w-8 h-8 sm:w-8 sm:h-8 text-green-400 shrink-0" />
              <div className="min-w-0">
                <h4 className="text-white font-bold text-sm sm:text-sm">
                  Sin desvíos
                </h4>
                <p className="text-white/50 text-xs sm:text-xs">
                  Todos los servicios funcionando con normalidad.
                </p>
              </div>
            </div>
          ) : firstDeviation ? (
            <Link
              href="/desvios"
              className="glass-panel p-5 sm:p-4 rounded-xl flex items-center gap-4 sm:gap-4 border-none bg-black/40 group cursor-pointer transition-all hover:opacity-100"
            >
              <AlertTriangle className="w-8 h-8 sm:w-8 sm:h-8 text-yellow-400 transition-all group-hover:text-yellow-300 group-hover:drop-shadow-[0_0_12px_rgba(250,204,21,0.8)] shrink-0" />
              <div className="min-w-0">
                <h4 className="text-white font-bold text-sm sm:text-sm">
                  Desvío en progreso
                </h4>
                <p className="text-white/50 text-xs sm:text-xs line-clamp-2">
                  {firstDeviation.title}
                </p>
              </div>
            </Link>
          ) : (
            <div className="glass-panel p-5 sm:p-4 rounded-xl flex items-center gap-4 sm:gap-4 border-none bg-black/40 group transition-all hover:opacity-100">
              <CheckCircle className="w-8 h-8 sm:w-8 sm:h-8 text-green-400 transition-all group-hover:text-green-300 group-hover:drop-shadow-[0_0_12px_rgba(74,222,128,0.8)] shrink-0" />
              <div className="min-w-0">
                <h4 className="text-white font-bold text-sm sm:text-sm">
                  Sin desvíos
                </h4>
                <p className="text-white/50 text-xs sm:text-xs">
                  Todos los servicios funcionando con normalidad.
                </p>
              </div>
            </div>
          )}
          <div className="glass-panel p-5 sm:p-4 rounded-xl flex items-center gap-4 sm:gap-4 border-none bg-black/40 group transition-all hover:opacity-100">
            {weatherQuery.isLoading ? (
              <>
                <Cloud className="w-8 h-8 sm:w-8 sm:h-8 text-primary animate-pulse shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-white font-bold text-sm sm:text-sm">
                    Cargando clima...
                  </h4>
                  <p className="text-white/50 text-xs sm:text-xs">
                    Obteniendo información del clima
                  </p>
                </div>
              </>
            ) : weatherQuery.data ? (
              <>
                {getWeatherIconComponent(weatherQuery.data.icon)}
                <div className="min-w-0">
                  <h4 className="text-white font-bold text-sm sm:text-sm">
                    {weatherQuery.data.temperature}°C{" "}
                    {weatherQuery.data.description}
                  </h4>
                  <p className="text-white/50 text-xs sm:text-xs">
                    {weatherQuery.data.message}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Cloud className="w-8 h-8 sm:w-8 sm:h-8 text-primary shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-white font-bold text-sm sm:text-sm">
                    Clima no disponible
                  </h4>
                  <p className="text-white/50 text-xs sm:text-xs">
                    No se pudo obtener la información del clima
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
