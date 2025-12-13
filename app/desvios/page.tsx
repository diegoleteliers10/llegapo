"use client";

import Link from "next/link";
import { ChevronRight, AlertTriangle, Calendar, ExternalLink } from "lucide-react";
import { useDeviations } from "@/lib/hooks/useDeviations";
import { Loader2 } from "lucide-react";

export default function DesviosPage() {
  const deviationsQuery = useDeviations();

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
              className="text-white/60 hover:text-white font-medium transition-colors text-sm"
              href="#"
            >
              Inicio
            </a>
            <a
              className="text-white font-medium transition-colors text-sm border-b-2 border-primary pb-0.5"
              href="#"
            >
              Desvíos
            </a>
            <a
              className="text-white/60 hover:text-white font-medium transition-colors text-sm"
              href="#"
            >
              Tarifas
            </a>
          </nav>
          <div className="flex items-center gap-4">
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
          <div className="mb-8">
            <div className="flex items-center gap-2 text-white/40 text-xs font-mono uppercase tracking-widest mb-2">
              <Link href="/" className="hover:text-white transition-colors">
                Inicio
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span>Desvíos</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Desvíos en Progreso
            </h2>
            <p className="text-white/60 text-lg font-light">
              {deviationsQuery.isLoading
                ? "Cargando desvíos..."
                : deviationsQuery.data?.data && deviationsQuery.data.data.length > 0
                ? `Se encontraron ${deviationsQuery.data.data.length} desvío${deviationsQuery.data.data.length > 1 ? "s" : ""} activo${deviationsQuery.data.data.length > 1 ? "s" : ""}`
                : "No hay desvíos activos en este momento."}
            </p>
          </div>

          {/* Loading State */}
          {deviationsQuery.isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          )}

          {/* Error State */}
          {deviationsQuery.isError && (
            <div className="glass-card p-6 rounded-2xl text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-white/80">
                {deviationsQuery.error?.message || "Error al cargar los desvíos"}
              </p>
            </div>
          )}

          {/* Deviations List */}
          {deviationsQuery.data?.data && deviationsQuery.data.data.length > 0 && (
            <div className="grid gap-4">
              {deviationsQuery.data.data.map((deviation, index) => (
                <div
                  key={`${deviation.date}-${index}`}
                  className="glass-card p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-6 group relative overflow-hidden hover:border-primary/30 transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                  {/* Date Badge */}
                  <div className="flex-shrink-0 flex items-center gap-2 text-white/60 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span className="font-mono">{deviation.date}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-grow z-10">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {deviation.title}
                    </h3>
                    <p className="text-white/60 text-sm">{deviation.excerpt}</p>
                  </div>

                  {/* Link */}
                  {deviation.link && (
                    <div className="flex-shrink-0 z-10">
                      <a
                        href={deviation.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="glass-button h-10 px-4 rounded-lg flex items-center justify-center gap-2 text-sm font-bold text-white shadow-lg group/btn hover:bg-primary transition-colors"
                      >
                        Leer más
                        <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {deviationsQuery.data?.data && deviationsQuery.data.data.length === 0 && (
            <div className="glass-card p-12 rounded-2xl text-center">
              <AlertTriangle className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">
                No hay desvíos activos
              </h3>
              <p className="text-white/60">
                Todos los servicios están funcionando con normalidad.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
