import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

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
    // Inicializar Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    
    // Configurar User-Agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // Navegar a la página
    await page.goto("https://www.red.cl/estado-del-servicio/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Esperar a que la tabla se cargue - intentar varios selectores
    await page.waitForSelector('table.table, table, tbody tr', { timeout: 15000 }).catch(() => {
      console.log("No se encontró la tabla con el selector esperado, continuando...");
    });
    
    // Esperar un poco más para que el contenido dinámico se cargue
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extraer el estado de las líneas de metro usando selectores CSS
    const metroStatus = await page.evaluate(() => {
      const results: MetroLineStatus[] = [];

      // Buscar todas las tablas con clase "table"
      const tables = document.querySelectorAll('table.table');
      
      console.log('Tablas encontradas:', tables.length);
      
      tables.forEach((table, tableIndex) => {
        const tbody = table.querySelector('tbody');
        if (!tbody) {
          console.log(`Tabla ${tableIndex}: sin tbody`);
          return;
        }

        const rows = tbody.querySelectorAll('tr');
        console.log(`Tabla ${tableIndex}: ${rows.length} filas encontradas`);
        
        rows.forEach((row, rowIndex) => {
          const tds = row.querySelectorAll('td');
          
          if (tds.length >= 2) {
            // Primer td con clase "recorrido" - contiene el nombre de la línea
            const recorridoTd = tds[0];
            let lineName = "";
            
            // Buscar el div con clase "linea-metro" que tiene el atributo title
            const lineDiv = recorridoTd?.querySelector('div.linea-metro[title]');
            if (lineDiv) {
              lineName = lineDiv.getAttribute('title') || "";
              // Limpiar el texto (remover "Línea " si está presente)
              lineName = lineName.replace(/^Línea\s*/i, "").trim();
            } else {
              // Si no hay div, buscar cualquier div con clase que contenga "linea"
              const anyLineDiv = recorridoTd?.querySelector('div[class*="linea"]');
              if (anyLineDiv) {
                lineName = anyLineDiv.getAttribute('title') || anyLineDiv.textContent?.trim() || "";
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

            console.log(`Fila ${rowIndex}:`, { lineName, status, details });

            // Solo agregar si tenemos al menos el nombre de la línea y el estado
            if (lineName && status) {
              // Verificar si es una línea de metro (puede ser "1", "2", "3", "4", "4a", "5", "6", "L1", "L2", etc.)
              // También aceptar "Línea 1", "Línea 2", etc.
              const normalizedLineName = lineName.trim();
              const isMetroLine = /^(L?\d+[a-z]?|Línea\s*\d+[a-z]?|\d+[a-z]?)$/i.test(normalizedLineName);
              
              console.log(`Validando línea: "${normalizedLineName}" - Es línea de metro: ${isMetroLine}`);
              
              if (isMetroLine) {
                // Normalizar el nombre de la línea (remover "L" o "Línea " si está presente, mantener números y letras)
                let normalizedLine = normalizedLineName.replace(/^(L|Línea\s*)/i, "").trim();
                
                // Si después de normalizar está vacío, usar el original
                if (!normalizedLine) {
                  normalizedLine = normalizedLineName;
                }
                
                console.log(`Agregando línea: ${normalizedLine} - Estado: ${status}`);
                
                results.push({
                  line: normalizedLine,
                  status: status,
                  details: details,
                });
              } else {
                console.log(`Línea descartada: "${normalizedLineName}" no coincide con el patrón de línea de metro`);
              }
            } else {
              console.log(`Fila descartada: lineName="${lineName}", status="${status}"`);
            }
          }
        });
      });

      console.log('Resultados finales:', results);
      return results;
    });

    console.log('Metro status extraído:', metroStatus);

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
      { status: 500 }
    );
  }
}
