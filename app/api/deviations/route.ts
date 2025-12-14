import { NextResponse } from "next/server";
import {
  createPlaywrightSession,
  navigateToPage,
  safeScrape,
} from "@/lib/playwright-utils";

export interface Deviation {
  date: string;
  title: string;
  excerpt: string;
  link: string;
}

export async function GET() {
  let session;
  try {
    // Create Playwright session optimized for serverless
    session = await createPlaywrightSession({
      timeout: 30000,
    });

    const deviations = await safeScrape(
      session,
      "https://www.red.cl/estado-del-servicio/desvios/",
      async (page) => {
        const results = await page.evaluate(() => {
          const deviationResults: Array<{
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
                deviationResults.push({
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
                deviationResults.push({
                  date,
                  title: title.replace(/^Leer artículo:\s*/i, "").trim(),
                  link: href.startsWith("http")
                    ? href
                    : `https://www.red.cl${href.startsWith("/") ? href : `/${href}`}`,
                });
              }
            });
          }

          return deviationResults;
        });

        return results;
      },
    );

    return NextResponse.json({ success: true, data: deviations });
  } catch (error) {
    console.error("Deviations API error:", error);
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
