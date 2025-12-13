import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export interface Deviation {
  date: string;
  title: string;
  excerpt: string;
  link: string;
}

/**
 * Crea un excerpt del texto (máximo 100 caracteres)
 */
function createExcerpt(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

/**
 * Scraping de desvíos desde Red Movilidad usando Puppeteer
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
    await page.goto("https://www.red.cl/estado-del-servicio/desvios/", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Esperar a que el contenedor con los desvíos se cargue
    await page.waitForSelector('div.row.noticias, a.noticia', { timeout: 10000 }).catch(() => {
      // Si no encuentra el selector, continuar de todas formas
    });

    // Extraer los desvíos usando selectores CSS
    const deviations = await page.evaluate(() => {
      const results: Array<{
        date: string;
        title: string;
        link: string;
      }> = [];

      // Buscar el contenedor div.row.noticias
      const container = document.querySelector('div.row.noticias');
      if (!container) {
        // Si no encontramos el contenedor, buscar directamente los <a class="noticia">
        const allLinks = document.querySelectorAll('a.noticia');
        allLinks.forEach((linkElement) => {
          const a = linkElement as HTMLAnchorElement;
          const title = a.getAttribute("title") || "";
          const href = a.getAttribute("href") || "";
          
          // Buscar la fecha en el span dentro del <a>
          const span = a.querySelector("span");
          const date = span ? span.textContent?.trim() || "" : "";

          if (title && href && date) {
            results.push({
              date,
              title: title.replace(/^Leer artículo:\s*/i, "").trim(),
              link: href.startsWith("http") ? href : `https://www.red.cl${href.startsWith("/") ? href : `/${href}`}`,
            });
          }
        });
      } else {
        // Buscar todos los <a class="noticia"> dentro del contenedor
        const links = container.querySelectorAll("a.noticia");

        links.forEach((linkElement) => {
          const a = linkElement as HTMLAnchorElement;
          const title = a.getAttribute("title") || "";
          const href = a.getAttribute("href") || "";
          
          // Buscar la fecha en el span dentro del <a>
          const span = a.querySelector("span");
          const date = span ? span.textContent?.trim() || "" : "";

          if (title && href && date) {
            results.push({
              date,
              title: title.replace(/^Leer artículo:\s*/i, "").trim(),
              link: href.startsWith("http") ? href : `https://www.red.cl${href.startsWith("/") ? href : `/${href}`}`,
            });
          }
        });
      }

      return results;
    });

    await browser.close();

    return NextResponse.json({
      success: true,
      data: deviations,
      timestamp: Date.now(),
      debug: {
        found: deviations.length,
        processed: deviations.length,
      },
    });
  } catch (error) {
    console.error("Error al obtener desvíos:", error);
    
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
