import { NextResponse } from "next/server";
import puppeteer from "puppeteer"; // puppeteer COMPLETO (incluye Chrome)

export interface Deviation {
  date: string;
  title: string;
  excerpt: string;
  link: string;
}

export async function GET() {
  let browser;
  try {
    // puppeteer COMPLETO encuentra Chrome AUTOMÁTICAMENTE
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
    });

    // Resto del código IDENTICO...
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.goto("https://www.red.cl/estado-del-servicio/desvios/", {
      waitUntil: "networkidle0",
      timeout: 20000,
    });

    const deviations = await page.evaluate(() => {
      const results: Array<{
        date: string;
        title: string;
        link: string;
      }> = [];

      // Buscar el contenedor div.row.noticias
      const container = document.querySelector("div.row.noticias");
      if (!container) {
        // Si no encontramos el contenedor, buscar directamente los <a class="noticia">
        const allLinks = document.querySelectorAll("a.noticia");
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
              link: href.startsWith("http")
                ? href
                : `https://www.red.cl${href.startsWith("/") ? href : `/${href}`}`,
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
              link: href.startsWith("http")
                ? href
                : `https://www.red.cl${href.startsWith("/") ? href : `/${href}`}`,
            });
          }
        });
      }

      return results;
    });

    await browser.close();
    return NextResponse.json({ success: true, data: deviations });
  } catch (error) {
    if (browser) await browser.close();
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
