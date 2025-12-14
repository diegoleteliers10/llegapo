import { NextResponse } from "next/server";
import {
  createPlaywrightSession,
  navigateToPage,
  safeScrape,
  waitForSelector,
} from "@/lib/playwright-utils";

export interface MetroLineStatus {
  line: string;
  status: string;
  details: string;
}

export async function GET() {
  let session;
  try {
    // Create Playwright session optimized for serverless
    session = await createPlaywrightSession({
      timeout: 30000,
    });

    const metroStatus = await safeScrape(
      session,
      "https://www.red.cl/estado-del-servicio/",
      async (page) => {
        // Wait for specific table
        await waitForSelector(page, "table.table tbody tr", { timeout: 10000 });

        const results = await page.evaluate(() => {
          const metroResults: MetroLineStatus[] = [];
          const rows = document.querySelectorAll("table.table tbody tr");

          rows.forEach((row) => {
            const tds = row.querySelectorAll("td");
            if (tds.length >= 3) {
              const lineDiv = tds[0].querySelector("div.linea-metro[title]");
              const line =
                (lineDiv?.getAttribute("title") || "")
                  .replace(/^Línea\s*/i, "")
                  .trim() ||
                tds[0].textContent?.trim() ||
                "";

              const status = tds[1].textContent?.trim() || "";
              const details = tds[2].textContent?.trim() || "";

              // Only metro lines (1-6, 4A, L1, L2)
              if (/^(L?\d+[a-z]?)$/i.test(line) && status) {
                metroResults.push({ line, status, details });
              }
            }
          });

          return metroResults.slice(0, 10); // Limit for Vercel
        });

        return results;
      },
    );

    return NextResponse.json({
      success: true,
      data: metroStatus,
    });
  } catch (error) {
    console.error("Metro status API error:", error);
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
