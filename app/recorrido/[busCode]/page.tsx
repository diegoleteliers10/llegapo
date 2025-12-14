"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  Bus,
  MapPin,
  Loader2,
  AlertTriangle,
  Route,
  Menu,
} from "lucide-react";
import { useRoute } from "@/lib/hooks/useRoute";
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  GeolocateControl,
  Source,
  Layer,
} from "react-map-gl/maplibre";
import type { FeatureCollection, LineString } from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import type { RouteData } from "@/lib/hooks/useRoute";

function RouteMapAndStops({ routeData }: { routeData: RouteData }) {
  const router = useRouter();

  // Calcular bounds iniciales para mostrar todo el recorrido
  const initialViewState = useMemo(() => {
    const paraderos = routeData.route.paraderos;
    if (paraderos.length === 0) {
      return {
        longitude: -70.6483,
        latitude: -33.4489,
        zoom: 12,
      };
    }

    // Calcular bounds desde todos los paraderos
    const lngs = paraderos.map((p) => p.ubicacion.longitud);
    const lats = paraderos.map((p) => p.ubicacion.latitud);

    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    // Calcular centro y zoom aproximado
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;

    // Calcular zoom basado en el área cubierta
    const lngDiff = maxLng - minLng;
    const latDiff = maxLat - minLat;
    const maxDiff = Math.max(lngDiff, latDiff);

    let zoom = 12;
    if (maxDiff > 0.1) zoom = 10;
    else if (maxDiff > 0.05) zoom = 11;
    else if (maxDiff > 0.02) zoom = 12;
    else if (maxDiff > 0.01) zoom = 13;
    else zoom = 14;

    return {
      longitude: centerLng,
      latitude: centerLat,
      zoom: zoom,
    };
  }, [routeData.route.paraderos]);

  const mapStyle = useMemo(() => {
    return "https://tiles.openfreemap.org/styles/positron";
  }, []);

  // Crear GeoJSON LineString para conectar los paraderos
  const routeLineGeoJSON = useMemo((): FeatureCollection<LineString> => {
    const coordinates = routeData.route.paraderos.map((paradero) => [
      paradero.ubicacion.longitud,
      paradero.ubicacion.latitud,
    ]);

    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: coordinates,
          },
          properties: {},
        },
      ],
    };
  }, [routeData.route.paraderos]);

  // Estilo de la línea
  const routeLineLayer = {
    id: "route-line",
    type: "line" as const,
    paint: {
      "line-color": "#3b82f6", // Azul
      "line-width": 4,
      "line-opacity": 0.8,
    },
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Mapa - En mobile arriba, en desktop a la izquierda */}
      <div className="w-full lg:w-1/2 h-[400px] lg:h-[600px] rounded-2xl overflow-hidden glass-panel border border-white/10">
        <MapLibreMap
          initialViewState={initialViewState}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapStyle}
        >
          {/* Línea que conecta los paraderos */}
          {routeData.route.paraderos.length > 1 && (
            <Source id="route-line" type="geojson" data={routeLineGeoJSON}>
              <Layer {...routeLineLayer} />
            </Source>
          )}

          {/* Markers para cada paradero */}
          {routeData.route.paraderos.map((paradero, index) => (
            <Marker
              key={paradero.codigo}
              longitude={paradero.ubicacion.longitud}
              latitude={paradero.ubicacion.latitud}
              anchor="bottom"
              onClick={(e: unknown) => {
                const oe = (
                  e as { originalEvent?: { stopPropagation?: () => void } }
                ).originalEvent;

                oe?.stopPropagation?.();
                router.push(`/busqueda?stop=${paradero.codigo}`);
              }}
            >
              <div className="relative cursor-pointer hover:scale-110 transition-transform">
                <MapPin
                  className="w-8 h-8 text-primary drop-shadow-lg"
                  fill="currentColor"
                />
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-full flex items-center justify-center pointer-events-none">
                  <span className="text-white font-bold text-xs">
                    {index + 1}
                  </span>
                </div>
              </div>
            </Marker>
          ))}

          {/* Controles */}
          <NavigationControl position="top-right" />
          <GeolocateControl position="top-right" />
        </MapLibreMap>
      </div>

      {/* Lista de Paraderos - En mobile abajo, en desktop a la derecha */}
      <div className="w-full lg:w-1/2 glass-panel rounded-2xl p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">Paraderos</h2>
        </div>

        <div className="relative">
          <div className="space-y-4">
            {routeData.route.paraderos.map((paradero, index) => {
              const isFirst = index === 0;
              const isLast = index === routeData.route.paraderos.length - 1;

              return (
                <div
                  key={paradero.codigo}
                  className="relative flex items-center"
                >
                  {/* Círculo numerado y línea */}
                  <div className="shrink-0 mr-4 relative self-stretch flex flex-col items-center">
                    {/* Círculo numerado */}
                    <div className="relative z-10 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30">
                      <span className="text-primary font-bold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    {/* Línea vertical que va desde el borde inferior del círculo hasta el borde superior del siguiente */}
                    {!isLast && (
                      <div className="w-0.5 bg-white/20 flex-1 mt-2"></div>
                    )}
                  </div>

                  {/* Card clickeable */}
                  <Link
                    href={`/busqueda?stop=${paradero.codigo}`}
                    className={`grow glass-panel p-4 rounded-xl border transition-all hover:border-primary/30 cursor-pointer group ${
                      isFirst
                        ? "border-primary/50 bg-primary/5"
                        : "border-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Contenido */}
                      <div className="grow min-w-0">
                        <div className="mb-1">
                          <h3 className="text-white font-bold text-base">
                            {paradero.codigo} - {paradero.nombre}
                          </h3>
                        </div>
                        {isFirst && (
                          <p className="text-primary text-xs font-medium mb-1">
                            Inicio de recorrido
                          </p>
                        )}
                        {isLast && (
                          <p className="text-primary text-xs font-medium mb-1">
                            Fin de recorrido
                          </p>
                        )}
                        <p className="text-white/50 text-xs">
                          {paradero.comuna}
                        </p>
                      </div>

                      {/* Chevron */}
                      <div className="shrink-0 flex items-center">
                        <ChevronRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecorridoPage() {
  const params = useParams();
  const busCode = params?.busCode as string;
  const routeQuery = useRoute(busCode);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col map-bg">
      {/* Header */}
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
          <nav className="hidden md:flex items-center gap-8 ml-auto">
            <Link
              href="/"
              className="text-white/60 hover:text-white font-medium transition-colors text-sm"
            >
              Inicio
            </Link>
            <Link
              href="/desvios"
              className="text-white/60 hover:text-white font-medium transition-colors text-sm"
            >
              Desvíos
            </Link>
            <Link
              href="/estado-metro"
              className="text-white/60 hover:text-white font-medium transition-colors text-sm"
            >
              Estado Metro
            </Link>
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
                href="/"
                className="text-white/80 hover:text-white font-medium transition-colors text-sm py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Inicio
              </Link>
              <Link
                href="/desvios"
                className="text-white/60 hover:text-white font-medium transition-colors text-sm py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Desvíos
              </Link>
              <Link
                href="/estado-metro"
                className="text-white/60 hover:text-white font-medium transition-colors text-sm py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Estado Metro
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
      <main className="grow flex flex-col px-4 py-12 pb-32 sm:pb-40 relative overflow-hidden">
        <div className="w-full max-w-6xl mx-auto relative z-10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-white/40 text-xs font-mono uppercase tracking-widest mb-8">
            <Link href="/" className="hover:text-white transition-colors">
              Inicio
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary">Recorrido {busCode}</span>
          </div>

          {/* Loading State */}
          {routeQuery.isLoading && (
            <div className="glass-panel rounded-2xl p-8 md:p-12 text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-white/60">
                Cargando información del recorrido...
              </p>
            </div>
          )}

          {/* Error State */}
          {routeQuery.error && (
            <div className="glass-panel rounded-2xl p-8 md:p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-white font-bold mb-2">
                Error al cargar el recorrido
              </p>
              <p className="text-white/60">{routeQuery.error.message}</p>
            </div>
          )}

          {/* Route Information */}
          {routeQuery.data?.data && (
            <div className="space-y-6">
              {/* Route Header */}
              <div className="glass-panel rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Bus className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                      Recorrido {routeQuery.data.data.servicio}
                    </h1>
                    <p className="text-white/60 text-lg">
                      Destino: {routeQuery.data.data.route.destino}
                    </p>
                  </div>
                </div>

                {/* Route Stats */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="glass-panel p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Route className="w-5 h-5 text-primary" />
                      <span className="text-white/60 text-xs font-medium uppercase">
                        Distancia
                      </span>
                    </div>
                    <p className="text-white font-bold text-lg">
                      {routeQuery.data.data.metadata.totalKilometros.toFixed(1)}{" "}
                      km
                    </p>
                  </div>
                  <div className="glass-panel p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span className="text-white/60 text-xs font-medium uppercase">
                        Paraderos
                      </span>
                    </div>
                    <p className="text-white font-bold text-lg">
                      {routeQuery.data.data.route.totalParaderos}
                    </p>
                  </div>
                </div>
              </div>

              {/* Map and Stops List */}
              <RouteMapAndStops routeData={routeQuery.data.data} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
