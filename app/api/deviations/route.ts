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
    console.log("🚌 Starting deviations API call");

    // Create Playwright session optimized for serverless
    console.log("🔧 Creating browser session...");
    session = await createPlaywrightSession({
      timeout: 30000,
    });
    console.log("✅ Browser session created successfully");

    console.log("🕸️ Starting scraping for deviations...");
    const deviations = await safeScrape(
      session,
      "https://www.red.cl/estado-del-servicio/desvios/",
      async (page) => {
        console.log("📄 Page loaded, checking page content...");

        // Check if page loaded correctly
        const pageTitle = await page.title();
        const pageUrl = page.url();
        console.log(`📖 Page title: ${pageTitle}`);
        console.log(`🔗 Page URL: ${pageUrl}`);

        // Check for common error indicators
        const pageText = await page.textContent("body");
        if (pageText?.includes("404") || pageText?.includes("Not Found")) {
          console.log("❌ 404 error detected in page content");
          throw new Error(
            `404 Not Found - Page content indicates error. URL: ${pageUrl}`,
          );
        }

        if (pageText?.includes("Error") || pageText?.includes("error")) {
          console.log(
            "⚠️ Error text detected in page:",
            pageText.substring(0, 200),
          );
        }

        console.log("🔍 Looking for deviation containers...");

        const results = await page.evaluate(() => {
          console.log("📊 Running page evaluation...");

          const deviationResults: Array<{
            date: string;
            title: string;
            link: string;
          }> = [];

          // Debug: Check what's available on the page
          const allDivs = document.querySelectorAll("div");
          console.log(`📦 Total divs found: ${allDivs.length}`);

          const allLinks = document.querySelectorAll("a");
          console.log(`🔗 Total links found: ${allLinks.length}`);

          // Buscar el contenedor div.row.noticias
          const container = document.querySelector("div.row.noticias");
          console.log(`📰 Container div.row.noticias found: ${!!container}`);

          if (!container) {
            console.log(
              "🔍 Container not found, searching for direct links...",
            );
            // Si no encontramos el contenedor, buscar directamente los <a class="noticia">
            const directLinks = document.querySelectorAll("a.noticia");
            console.log(
              `📰 Direct a.noticia links found: ${directLinks.length}`,
            );

            directLinks.forEach((linkElement) => {
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
            console.log(`📰 Container found, searching within it...`);
            // Buscar todos los <a class="noticia"> dentro del contenedor
            const links = container.querySelectorAll("a.noticia");
            console.log(`🔗 Links found in container: ${links.length}`);

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

          console.log(`✅ Found ${deviationResults.length} deviations`);
          return deviationResults;
        });

        console.log(
          `📊 Scraping completed. Found ${results.length} deviations`,
        );

        if (results.length === 0) {
          console.log(
            "⚠️ No deviations found. This might indicate a page structure change.",
          );

          // Additional debugging - check page structure
          const bodyContent = await page.textContent("body");
          console.log(
            "📄 Page body content preview:",
            bodyContent?.substring(0, 500),
          );

          // Check for common selectors
          const commonSelectors = [
            "div.noticias",
            "div.noticia",
            ".news",
            ".deviation",
            "article",
            ".article",
            ".post",
            ".entry",
          ];

          for (const selector of commonSelectors) {
            const found = await page.$$eval(selector, (els) => els.length);
            if (found > 0) {
              console.log(
                `🔍 Found ${found} elements with selector: ${selector}`,
              );
            }
          }
        }

        return results;
      },
    );

    console.log(
      `🎉 Deviations API completed successfully. Found ${deviations.length} items`,
    );
    return NextResponse.json({ success: true, data: deviations });
  } catch (error) {
    console.error("❌ Deviations API error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("🔍 Error details:", errorMessage);

    // Check for specific error types
    if (errorMessage.includes("404")) {
      console.error(
        "🚫 404 Error detected - The page might have moved or changed structure",
      );
    }

    if (errorMessage.includes("timeout")) {
      console.error("⏰ Timeout error - The page took too long to load");
    }

    if (errorMessage.includes("navigation")) {
      console.error(
        "🧭 Navigation error - Could not navigate to the target URL",
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        endpoint: "/api/deviations",
      },
      { status: 500 },
    );
  } finally {
    // Cleanup resources
    if (session) {
      console.log("🧹 Cleaning up browser session...");
      await session.cleanup();
    }
  }
}
