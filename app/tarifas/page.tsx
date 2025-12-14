"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Loader2, AlertTriangle, Clock, CreditCard, Bus, Info, Menu } from "lucide-react";
import { useTarifas } from "@/lib/hooks/useTarifas";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export default function TarifasPage() {
  const tarifasQuery = useTarifas();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Función para formatear la descripción agregando espacios entre modo de transporte y precio
  const formatearDescripcion = (descripcion: string) => {
    // Agregar espacio antes de $ cuando está pegado a una palabra (ej: "metrotren$710" -> "metrotren $710")
    return descripcion.replace(/([a-zA-Z]+)\$/g, "$1 $");
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "baja":
        return "bg-blue-500/20 text-blue-400 border-blue-400/30";
      case "valle":
        return "bg-green-500/20 text-green-400 border-green-400/30";
      case "punta":
        return "bg-red-500/20 text-red-400 border-red-400/30";
      case "estudiante":
        return "bg-purple-500/20 text-purple-400 border-purple-400/30";
      case "adulto-mayor":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-400/30";
      case "adulto-mayor-metro":
        return "bg-orange-500/20 text-orange-400 border-orange-400/30";
      default:
        return "bg-primary/20 text-primary border-primary/30";
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "baja":
        return "🌙";
      case "valle":
        return "☀️";
      case "punta":
        return "🚇";
      case "estudiante":
        return "🎓";
      case "adulto-mayor":
        return "👴";
      case "adulto-mayor-metro":
        return "👵";
      default:
        return "💰";
    }
  };

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
          <nav className="hidden md:flex items-center gap-8 ml-auto mr-10">
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
              className="text-white hover:text-white font-medium transition-colors text-sm"
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
                className="text-white/80 hover:text-white font-medium transition-colors text-sm py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tarifas
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="grow flex flex-col px-4 py-12 pb-32 sm:pb-40 relative overflow-visible">
        <div className="w-full max-w-4xl mx-auto relative z-10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-white/40 text-xs font-mono uppercase tracking-widest mb-8">
            <Link href="/" className="hover:text-white transition-colors">
              Inicio
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary">Tarifas</span>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
              Tarifas de Transporte
            </h1>
            <p className="text-white/60 text-lg font-light">
              Conoce todas las tarifas de Bus, Metro y Metrotren de Red
              Metropolitana de Movilidad
            </p>
          </div>

          {/* Loading State */}
          {tarifasQuery.isLoading && (
            <div className="glass-panel rounded-2xl p-8 md:p-12 text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-white/60">
                Cargando información de tarifas...
              </p>
            </div>
          )}

          {/* Error State */}
          {tarifasQuery.error && (
            <div className="glass-panel rounded-2xl p-8 md:p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-white font-bold mb-2">
                Error al cargar las tarifas
              </p>
              <p className="text-white/60">{tarifasQuery.error.message}</p>
            </div>
          )}

          {/* Información General */}
          {tarifasQuery.data?.data && (
            <div className="mb-8">
              <div className="glass-panel rounded-2xl p-6 border border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 relative">
                    <div className="w-12 h-12 rounded-lg border flex items-center justify-center bg-blue-500/20 border-blue-400/30">
                      <Clock className="w-6 h-6 text-blue-400" />
                    </div>
                    <div className="grow">
                      <div className="flex items-center gap-2">
                        <p className="text-white/60 text-xs font-medium uppercase">
                          Período de Integración
                        </p>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="text-primary hover:text-primary/80 transition-colors"
                              aria-label="Información sobre período de integración"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-80 glass-panel border border-white/20 shadow-2xl bg-black/90 backdrop-blur-xl"
                            align="start"
                            sideOffset={8}
                          >
                            <div className="space-y-2">
                              <h3 className="text-white font-bold text-sm mb-3">
                                ¿Qué es el Período de Integración?
                              </h3>
                              <div className="space-y-2 text-white/80 text-xs">
                                <p>
                                  El período de integración es el tiempo durante
                                  el cual puedes usar diferentes modos de
                                  transporte (buses, Metro y Tren Nos) con un{" "}
                                  <strong className="text-white">
                                    solo pago
                                  </strong>
                                  .
                                </p>
                                <p>
                                  <strong className="text-white">
                                    Duración:
                                  </strong>{" "}
                                  120 minutos (2 horas) desde el primer pago.
                                </p>
                                <p>
                                  <strong className="text-white">
                                    Transbordos:
                                  </strong>{" "}
                                  Puedes realizar hasta 2 transbordos entre
                                  diferentes modos de transporte.
                                </p>
                                <p>
                                  <strong className="text-white">
                                    Condiciones:
                                  </strong>{" "}
                                  El viaje debe ser en la misma dirección y sin
                                  repetir recorridos de buses.
                                </p>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <p className="text-white font-bold text-lg">
                        {
                          tarifasQuery.data.data.informacionGeneral
                            .periodoIntegracion
                        }{" "}
                        minutos
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-12 h-12 rounded-lg border flex items-center justify-center bg-blue-500/20 border-blue-400/30">
                      <Bus className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white/60 text-xs font-medium uppercase">
                        Máximo Transbordos
                      </p>
                      <p className="text-white font-bold text-lg">
                        {
                          tarifasQuery.data.data.informacionGeneral
                            .maxTransbordos
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-12 h-12 rounded-lg border flex items-center justify-center bg-blue-500/20 border-blue-400/30">
                      <CreditCard className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white/60 text-xs font-medium uppercase">
                          Formas de Pago
                        </p>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="text-primary hover:text-primary/80 transition-colors"
                              aria-label="Información sobre código QR"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-80 glass-panel border border-white/20 shadow-2xl bg-black/90 backdrop-blur-xl"
                            align="start"
                            sideOffset={8}
                          >
                            <div className="space-y-2">
                              <h3 className="text-white font-bold text-sm mb-3">
                                Código QR
                              </h3>
                              <div className="space-y-2 text-white/80 text-xs">
                                <p>
                                  El código QR se puede utilizar tanto desde la{" "}
                                  <strong className="text-white">
                                    App Red
                                  </strong>
                                  , como desde el{" "}
                                  <strong className="text-white">
                                    Banco Estado
                                  </strong>
                                  .
                                </p>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <p className="text-white font-bold text-lg">
                        {tarifasQuery.data.data.informacionGeneral.formasPago
                          .map((forma: string) => forma.split(" (")[0])
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tarifas List */}
          {tarifasQuery.data?.data &&
            tarifasQuery.data.data.tarifas.length > 0 && (
              <div className="space-y-6">
                {tarifasQuery.data.data.tarifas.map((tarifa) => (
                  <div
                    key={tarifa.tipo}
                    className="glass-panel rounded-2xl p-6 md:p-8 border border-white/5 hover:border-white/10 transition-all"
                  >
                    {/* Header de la tarifa */}
                    <div className="flex flex-col md:flex-row items-start gap-4 mb-6">
                      <div
                        className={`shrink-0 w-16 h-16 rounded-xl ${getTipoColor(
                          tarifa.tipo
                        )} flex items-center justify-center border text-2xl`}
                      >
                        {getTipoIcon(tarifa.tipo)}
                      </div>
                      <div className="grow min-w-0 w-full md:w-auto">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                          <h2 className="text-2xl font-bold text-white">
                            {tarifa.nombre}
                          </h2>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold border ${getTipoColor(
                              tarifa.tipo
                            )} self-start sm:self-auto`}
                          >
                            ${tarifa.precios.total.toLocaleString()}
                          </span>
                        </div>
                        {tarifa.descripcion && (
                          <p className="text-white/60 text-sm mb-2">
                            {tarifa.descripcion}
                          </p>
                        )}
                        {tarifa.horarios.texto && (
                          <div className="flex items-center gap-2 text-primary text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            <span>{tarifa.horarios.texto}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tabla de Combinaciones */}
                    {tarifa.combinaciones.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="text-left py-3 px-4 text-white/60 text-xs font-medium uppercase">
                                Combinación
                              </th>
                              <th className="text-right py-3 px-4 text-white/60 text-xs font-medium uppercase">
                                Precio
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {tarifa.combinaciones.map((combinacion) => (
                              <tr
                                key={`${combinacion.descripcion}-${combinacion.precio}`}
                                className="border-b border-white/5 hover:bg-white/5 transition-colors"
                              >
                                <td className="py-3 px-4 text-white/80 text-sm">
                                  {formatearDescripcion(
                                    combinacion.descripcion
                                  )}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <span className="text-white font-bold">
                                    ${combinacion.precio.toLocaleString()}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Restricciones */}
                    {tarifa.restricciones && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-white/50 text-xs italic">
                          {tarifa.restricciones}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

          {/* Empty State */}
          {tarifasQuery.data?.data &&
            tarifasQuery.data.data.tarifas.length === 0 && (
              <div className="glass-panel rounded-2xl p-8 md:p-12 text-center">
                <AlertTriangle className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  No se encontraron tarifas
                </h3>
                <p className="text-white/60">
                  No se pudo obtener la información de tarifas en este momento.
                </p>
              </div>
            )}
        </div>
      </main>
    </div>
  );
}
