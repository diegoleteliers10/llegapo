import { NextResponse } from "next/server";
import {
  createPlaywrightSession,
  navigateToPage,
  safeScrape,
} from "@/lib/playwright-utils";

export interface TarifaCombinacion {
  descripcion: string;
  precio: number;
}

export interface Tarifa {
  tipo:
    | "baja"
    | "valle"
    | "punta"
    | "estudiante"
    | "adulto-mayor"
    | "adulto-mayor-metro";
  nombre: string;
  descripcion: string;
  horarios: { texto: string; rangos: Array<{ inicio: string; fin: string }> };
  precios: { metro?: number; bus?: number; metrotren?: number; total: number };
  combinaciones: TarifaCombinacion[];
  restricciones?: string;
}

export async function GET() {
  let session;
  try {
    // Create Playwright session optimized for serverless
    session = await createPlaywrightSession({
      timeout: 30000,
    });

    const tarifas = await safeScrape(
      session,
      "https://www.red.cl/tarifas-y-recargas/conoce-las-tarifas/",
      async (page) => {
        const results = await page.evaluate(() => {
          const tarifaResults: Tarifa[] = [];

          // Buscar todas las secciones con h2.titular
          const titulares = document.querySelectorAll("h2.titular");

          titulares.forEach((titular) => {
            const nombreSeccion = titular.textContent?.trim() || "";

            // Determinar el tipo de tarifa
            let tipo:
              | "baja"
              | "valle"
              | "punta"
              | "estudiante"
              | "adulto-mayor"
              | "adulto-mayor-metro"
              | null = null;
            if (nombreSeccion.includes("Baja")) tipo = "baja";
            else if (nombreSeccion.includes("Valle")) tipo = "valle";
            else if (nombreSeccion.includes("Punta")) tipo = "punta";
            else if (nombreSeccion.includes("Estudiantes")) tipo = "estudiante";
            else if (
              nombreSeccion.includes("Adulto Mayor") &&
              nombreSeccion.includes("Metro")
            )
              tipo = "adulto-mayor-metro";
            else if (nombreSeccion.includes("Adulto Mayor"))
              tipo = "adulto-mayor";

            if (!tipo) return;

            // Buscar la tabla siguiente
            let elementoActual: Element | null = titular.nextElementSibling;
            let tabla: HTMLTableElement | null = null;

            while (elementoActual) {
              if (
                elementoActual.tagName === "TABLE" ||
                elementoActual.querySelector("table.table")
              ) {
                tabla =
                  elementoActual.tagName === "TABLE"
                    ? (elementoActual as HTMLTableElement)
                    : (elementoActual.querySelector(
                        "table.table",
                      ) as HTMLTableElement);
                break;
              }
              elementoActual = elementoActual.nextElementSibling;
            }

            if (!tabla) return;

            // Extraer descripción y horarios del texto antes de la tabla
            let descripcion = "";
            let horariosTexto = "";
            let restricciones = "";
            let elementoTexto: Element | null =
              titular.nextElementSibling as Element | null;

            while (elementoTexto && elementoTexto !== tabla.parentElement) {
              if (
                elementoTexto.tagName === "P" ||
                elementoTexto.tagName === "DIV"
              ) {
                const texto = elementoTexto.textContent?.trim() || "";
                if (
                  texto &&
                  !texto.includes("Combinación") &&
                  !texto.includes("Precio")
                ) {
                  if (
                    texto.includes("Iniciando") ||
                    texto.includes("Horario")
                  ) {
                    horariosTexto = texto;
                  } else if (
                    texto.includes("restricción") ||
                    texto.includes("válido") ||
                    texto.includes("aplicable")
                  ) {
                    restricciones = texto;
                  } else if (descripcion === "") {
                    descripcion = texto;
                  }
                }
              }
              elementoTexto = elementoTexto.nextElementSibling;
            }

            // Extraer combinaciones de la tabla
            const combinaciones: TarifaCombinacion[] = [];
            const tbody = tabla.querySelector("tbody");

            if (tbody) {
              const filas = tbody.querySelectorAll("tr");

              filas.forEach((fila) => {
                const celdas = fila.querySelectorAll("td");
                if (celdas.length >= 2) {
                  const combinacionTexto = celdas[0].textContent?.trim() || "";
                  const precioTexto = celdas[1].textContent?.trim() || "";

                  // Extraer precio numérico
                  const precioMatch = precioTexto.match(/\$?(\d+)/);
                  const precio = precioMatch ? parseInt(precioMatch[1], 10) : 0;

                  if (combinacionTexto && precio > 0) {
                    combinaciones.push({
                      descripcion: combinacionTexto,
                      precio: precio,
                    });
                  }
                }
              });
            }

            // Extraer precios base del texto de descripción
            const precios: {
              metro?: number;
              bus?: number;
              metrotren?: number;
              total: number;
            } = {
              total: 0,
            };

            // Buscar precios en la descripción
            const precioMetroMatch = descripcion.match(/Metro.*?\$(\d+)/i);
            const precioBusMatch = descripcion.match(/bus.*?\$(\d+)/i);
            const precioMetrotrenMatch = descripcion.match(/Tren.*?\$(\d+)/i);

            if (precioMetroMatch)
              precios.metro = parseInt(precioMetroMatch[1], 10);
            if (precioBusMatch) precios.bus = parseInt(precioBusMatch[1], 10);
            if (precioMetrotrenMatch)
              precios.metrotren = parseInt(precioMetrotrenMatch[1], 10);

            // El precio total es el máximo de las combinaciones o el precio base
            if (combinaciones.length > 0) {
              precios.total = Math.max(...combinaciones.map((c) => c.precio));
            }

            // Extraer horarios
            const horarios = {
              texto: horariosTexto,
              rangos: [] as Array<{ inicio: string; fin: string }>,
            };

            // Parsear horarios del texto
            const horarioMatches = horariosTexto.matchAll(
              /(\d{2}):(\d{2})\s*[-–]\s*(\d{2}):(\d{2})/g,
            );
            for (const match of horarioMatches) {
              horarios.rangos.push({
                inicio: `${match[1]}:${match[2]}`,
                fin: `${match[3]}:${match[4]}`,
              });
            }

            const tarifaResult: Tarifa = {
              tipo,
              nombre: nombreSeccion,
              descripcion: descripcion || nombreSeccion,
              horarios,
              precios,
              combinaciones,
            };

            if (restricciones) {
              tarifaResult.restricciones = restricciones;
            }

            tarifaResults.push(tarifaResult);
          });

          return tarifaResults;
        });

        return results;
      },
    );

    return NextResponse.json({
      success: true,
      data: {
        tarifas,
        informacionGeneral: {
          sistemaIntegrado: true,
          periodoIntegracion: 120, // minutos
          maxTransbordos: 2,
          formasPago: ["Tarjeta bip!", "Código QR (App Red / Banco Estado)"],
        },
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("Tarifas API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  } finally {
    // Cleanup resources
    if (session) {
      await session.cleanup();
    }
  }
}
