import { NextResponse } from "next/server";
import { chromium } from "playwright";

export interface MetroLineStatus {
  line: string;
  status: string;
  details: string;
}

export async function GET() {
  let browser;
  let context;
  try {
    // Launch Playwright Chromium browser
    browser = await chromium.launch({
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

    // Create browser context with userAgent
    context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const page = await context.newPage();

    await page.goto("https://www.red.cl/estado-del-servicio/", {
      waitUntil: "networkidle",
      timeout: 20000,
    });

    // Wait for specific table
    await page.waitForSelector("table.table tbody tr", { timeout: 5000 });

    const metroStatus = await page.evaluate(() => {
      const results: MetroLineStatus[] = [];
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
            results.push({ line, status, details });
          }
        }
      });

      return results.slice(0, 10); // Limit for Vercel
    });

    await context.close();
    await browser.close();
    return NextResponse.json({
      success: true,
      data: metroStatus,
    });
  } catch (error) {
    if (context) await context.close();
    if (browser) await browser.close();
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
