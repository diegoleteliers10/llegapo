"use client";

import Link from "next/link";
import { ChevronRight, CheckCircle, AlertTriangle, Loader2, Home } from "lucide-react";
import { useMetroStatus } from "@/lib/hooks/useMetroStatus";

export default function EstadoMetroPage() {
  const metroStatusQuery = useMetroStatus();

  return (
    <div className="min-h-screen flex flex-col map-bg">
      {/* Header */}
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
            <Link
              href="/"
              className="text-white/80 hover:text-white font-medium transition-colors text-sm"
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
              className="text-white/80 hover:text-white font-medium transition-colors text-sm"
            >
              Estado Metro
            </Link>
            <Link
              href="#"
              className="text-white/60 hover:text-white font-medium transition-colors text-sm"
            >
              Tarifas
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <button className="glass-button h-10 px-6 rounded-lg text-sm font-bold text-white shadow-lg">
              Acceder
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="grow flex flex-col px-4 py-12 pb-32 sm:pb-40 relative overflow-visible">
        <div className="w-full max-w-4xl mx-auto relative z-10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-white/60 text-sm mb-8">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
              <Home className="w-4 h-4" />
              Inicio
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Estado del Metro</span>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              Estado del Metro
            </h1>
            <p className="text-white/60 text-lg font-light">
              Información en tiempo real del estado de todas las líneas del metro
            </p>
          </div>

          {/* Loading State */}
          {metroStatusQuery.isLoading && (
            <div className="glass-panel rounded-2xl p-8 md:p-12 text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-white/60">Cargando estado del metro...</p>
            </div>
          )}

          {/* Error State */}
          {metroStatusQuery.error && (
            <div className="glass-panel rounded-2xl p-8 md:p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-white font-bold mb-2">Error al cargar el estado</p>
              <p className="text-white/60">{metroStatusQuery.error.message}</p>
            </div>
          )}

          {/* Metro Lines Status */}
          {metroStatusQuery.data && metroStatusQuery.data.data && (
            <div className="space-y-4">
              {metroStatusQuery.data.data.length === 0 ? (
                <div className="glass-panel rounded-2xl p-8 md:p-12 text-center">
                  <p className="text-white/60">No se encontró información del metro</p>
                </div>
              ) : (
                metroStatusQuery.data.data.map((line, index) => {
                  const hasAlterations = 
                    !line.status.toLowerCase().includes("sin alteraciones") && 
                    line.status.toLowerCase() !== "sin alteraciones";
                  
                  // Colores asociados a cada línea de metro
                  const getLineColor = (lineNumber: string) => {
                    const normalized = lineNumber.toLowerCase().trim();
                    switch (normalized) {
                      case "1":
                        return "bg-red-500"; // L1: Rojo
                      case "2":
                        return "bg-orange-500"; // L2: Naranja
                      case "3":
                        return "bg-amber-700"; // L3: Marrón (brown)
                      case "4":
                        return "bg-blue-700"; // L4: Azul oscuro
                      case "4a":
                        return "bg-cyan-500"; // L4a: Azul claro/cyan
                      case "5":
                        return "bg-green-500"; // L5: Verde
                      case "6":
                        return "bg-purple-500"; // L6: Púrpura
                      default:
                        return "bg-gray-500"; // Color por defecto
                    }
                  };
                  
                  const lineColor = getLineColor(line.line);
                  
                  return (
                    <div
                      key={`${line.line}-${index}`}
                      className="glass-panel rounded-xl p-6 border border-white/5 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon con color de línea */}
                        <div className={`shrink-0 w-12 h-12 rounded-lg ${lineColor} flex items-center justify-center`}>
                          <span className="text-white font-bold text-lg">
                            {line.line.toUpperCase()}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="grow min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-white">
                              Línea {line.line}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                hasAlterations
                                  ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30"
                                  : "bg-green-400/20 text-green-400 border border-green-400/30"
                              }`}
                            >
                              {line.status}
                            </span>
                          </div>
                          
                          {/* Detalle/Observaciones */}
                          {line.details && line.details.trim() !== "" ? (
                            <div className="mt-3 pt-3 border-t border-white/10">
                              <p className="text-white/80 text-sm font-medium mb-1">Detalle:</p>
                              <p className="text-white/60 text-sm">
                                {line.details}
                              </p>
                            </div>
                          ) : (
                            <p className="text-white/40 text-sm italic mt-2">
                              Sin observaciones adicionales
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
