import { NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import puppeteerDev from "puppeteer";
import chromium from "@sparticuz/chromium";

export interface MetroLineStatus {
  line: string;
  status: string;
  details: string;
}

/**
 * Scraping del estado del servicio del Metro desde Red Movilidad usando Puppeteer
 */
export async function GET() {
  let browser;
  try {
    // Inicializar Puppeteer con configuración optimizada para Vercel
    const viewport = {
      deviceScaleFactor: 1,
      hasTouch: false,
      height: 1080,
      isLandscape: true,
      isMobile: false,
      width: 1920,
    };

    // Use different puppeteer configurations for development vs production
    if (process.env.NODE_ENV === "production") {
      // Production: Use puppeteer-core with @sparticuz/chromium for serverless
      browser = await puppeteer.launch({
        args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
        defaultViewport: viewport,
        executablePath: await chromium.executablePath(),
        headless: "shell",
      });
    } else {
      // Development: Use regular puppeteer with local Chrome
      browser = await puppeteerDev.launch({
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
        ],
        defaultViewport: viewport,
        headless: true,
      });
    }

    const page = await browser.newPage();

    // Configurar User-Agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    );

    // Navegar a la página con timeout reducido para Vercel
    await page.goto("https://www.red.cl/estado-del-servicio/", {
      waitUntil: "domcontentloaded",
      timeout: 25000, // Reducido para evitar timeout de Vercel (30s max)
    });

    // Esperar a que la tabla se cargue - intentar varios selectores
    await page
      .waitForSelector("table.table, table, tbody tr", { timeout: 10000 })
      .catch(() => {
        // Silenciar logs de error
      });

    // Reducir tiempo de espera para Vercel
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Extraer el estado de las líneas de metro usando selectores CSS
    const metroStatus = await page.evaluate(() => {
      const results: MetroLineStatus[] = [];

      // Buscar todas las tablas con clase "table"
      const tables = document.querySelectorAll("table.table");

      tables.forEach((table, _tableIndex) => {
        const tbody = table.querySelector("tbody");
        if (!tbody) {
          return;
        }

        const rows = tbody.querySelectorAll("tr");

        rows.forEach((row, _rowIndex) => {
          const tds = row.querySelectorAll("td");

          if (tds.length >= 2) {
            // Primer td con clase "recorrido" - contiene el nombre de la línea
            const recorridoTd = tds[0];
            let lineName = "";

            // Buscar el div con clase "linea-metro" que tiene el atributo title
            const lineDiv = recorridoTd?.querySelector(
              "div.linea-metro[title]",
            );
            if (lineDiv) {
              lineName = lineDiv.getAttribute("title") || "";
              // Limpiar el texto (remover "Línea " si está presente)
              lineName = lineName.replace(/^Línea\s*/i, "").trim();
            } else {
              // Si no hay div, buscar cualquier div con clase que contenga "linea"
              const anyLineDiv = recorridoTd?.querySelector(
                'div[class*="linea"]',
              );
              if (anyLineDiv) {
                lineName =
                  anyLineDiv.getAttribute("title") ||
                  anyLineDiv.textContent?.trim() ||
                  "";
                lineName = lineName.replace(/^Línea\s*/i, "").trim();
              } else {
                // Usar el texto del td directamente
                lineName = recorridoTd?.textContent?.trim() || "";
              }
            }

            // Segundo td - estado (alteraciones o sin alteraciones)
            const statusTd = tds[1];
            const status = statusTd?.textContent?.trim() || "";

            // Tercer td - observaciones o detalles (puede estar vacío)
            const detailsTd = tds[2];
            const details = detailsTd?.textContent?.trim() || "";

            // Solo agregar si tenemos al menos el nombre de la línea y el estado
            if (lineName && status) {
              // Verificar si es una línea de metro (puede ser "1", "2", "3", "4", "4a", "5", "6", "L1", "L2", etc.)
              // También aceptar "Línea 1", "Línea 2", etc.
              const normalizedLineName = lineName.trim();
              const isMetroLine =
                /^(L?\d+[a-z]?|Línea\s*\d+[a-z]?|\d+[a-z]?)$/i.test(
                  normalizedLineName,
                );

              if (isMetroLine) {
                // Normalizar el nombre de la línea (remover "L" o "Línea " si está presente, mantener números y letras)
                let normalizedLine = normalizedLineName
                  .replace(/^(L|Línea\s*)/i, "")
                  .trim();

                // Si después de normalizar está vacío, usar el original
                if (!normalizedLine) {
                  normalizedLine = normalizedLineName;
                }

                results.push({
                  line: normalizedLine,
                  status: status,
                  details: details,
                });
              }
            }
          }
        });
      });

      return results;
    });

    await browser.close();

    return NextResponse.json({
      success: true,
      data: metroStatus,
      timestamp: Date.now(),
      debug: {
        found: metroStatus.length,
      },
    });
  } catch (error) {
    console.error("Error al obtener estado del metro:", error);

    if (browser) {
      await browser.close().catch(() => {});
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        data: [],
      },
      { status: 500 },
    );
  }
}
