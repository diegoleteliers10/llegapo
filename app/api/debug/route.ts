import { NextResponse } from "next/server";
import {
  createPlaywrightSession,
  navigateToPage,
  safeScrape,
} from "@/lib/playwright-utils";

export async function GET() {
  let session;
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: {
      isProduction: process.env.NODE_ENV === "production",
      isVercel: !!process.env.VERCEL,
      nodeEnv: process.env.NODE_ENV,
      chromiumRemotePath: process.env.CHROMIUM_REMOTE_EXEC_PATH,
      playwrightHeadless: process.env.PLAYWRIGHT_HEADLESS,
      playwrightTimeout: process.env.PLAYWRIGHT_TIMEOUT,
    },
    tests: {},
    errors: [],
  };

  try {
    console.log("🐛 Starting debug API call");

    // Test 1: Browser creation
    try {
      console.log("🔧 Test 1: Creating browser session...");
      session = await createPlaywrightSession({
        timeout: 15000,
      });
      debugInfo.tests.browserCreation = "✅ SUCCESS";
      console.log("✅ Browser session created successfully");
    } catch (error) {
      debugInfo.tests.browserCreation = "❌ FAILED";
      debugInfo.errors.push({
        test: "browserCreation",
        error: error instanceof Error ? error.message : String(error),
      });
      console.error("❌ Browser creation failed:", error);
    }

    if (session) {
      // Test 2: Simple navigation
      try {
        console.log("🌐 Test 2: Testing simple navigation...");
        await navigateToPage(session.page, "https://httpbin.org/status/200", {
          timeout: 10000,
        });
        debugInfo.tests.simpleNavigation = "✅ SUCCESS";
        console.log("✅ Simple navigation successful");
      } catch (error) {
        debugInfo.tests.simpleNavigation = "❌ FAILED";
        debugInfo.errors.push({
          test: "simpleNavigation",
          error: error instanceof Error ? error.message : String(error),
        });
        console.error("❌ Simple navigation failed:", error);
      }

      // Test 3: RED.cl main page
      try {
        console.log("🌐 Test 3: Testing RED.cl main page...");
        await navigateToPage(session.page, "https://www.red.cl", {
          timeout: 15000,
        });

        const title = await session.page.title();
        const url = session.page.url();

        debugInfo.tests.redClMainPage = {
          status: "✅ SUCCESS",
          title,
          finalUrl: url,
        };
        console.log(`✅ RED.cl main page loaded. Title: ${title}`);
      } catch (error) {
        debugInfo.tests.redClMainPage = "❌ FAILED";
        debugInfo.errors.push({
          test: "redClMainPage",
          error: error instanceof Error ? error.message : String(error),
        });
        console.error("❌ RED.cl main page failed:", error);
      }

      // Test 4: RED.cl deviations page (the problematic one)
      try {
        console.log("🌐 Test 4: Testing RED.cl deviations page...");
        await navigateToPage(
          session.page,
          "https://www.red.cl/estado-del-servicio/desvios/",
          {
            timeout: 15000,
          }
        );

        const title = await session.page.title();
        const url = session.page.url();
        const statusCode = session.page.url().includes("404") ||
                          (await session.page.textContent("body"))?.includes("404");

        // Check for specific content
        const hasContainer = await session.page.$("div.row.noticias");
        const hasLinks = await session.page.$$eval("a.noticia", (els) => els.length);

        debugInfo.tests.redClDeviationsPage = {
          status: statusCode ? "❌ 404 DETECTED" : "✅ SUCCESS",
          title,
          finalUrl: url,
          hasContainer: !!hasContainer,
          linksFound: hasLinks,
        };

        console.log(`📊 Deviations page results:`, debugInfo.tests.redClDeviationsPage);
      } catch (error) {
        debugInfo.tests.redClDeviationsPage = "❌ FAILED";
        debugInfo.errors.push({
          test: "redClDeviationsPage",
          error: error instanceof Error ? error.message : String(error),
        });
        console.error("❌ RED.cl deviations page failed:", error);
      }

      // Test 5: User Agent and Headers
      try {
        console.log("🔍 Test 5: Checking User Agent...");
        await navigateToPage(session.page, "https://httpbin.org/user-agent", {
          timeout: 10000,
        });

        const userAgentResponse = await session.page.textContent("body");
        debugInfo.tests.userAgent = {
          status: "✅ SUCCESS",
          response: userAgentResponse,
        };
        console.log("✅ User Agent test successful");
      } catch (error) {
        debugInfo.tests.userAgent = "❌ FAILED";
        debugInfo.errors.push({
          test: "userAgent",
          error: error instanceof Error ? error.message : String(error),
        });
        console.error("❌ User Agent test failed:", error);
      }

      // Test 6: Check if it's a blocking/anti-bot issue
      try {
        console.log("🤖 Test 6: Testing for bot detection...");
        await navigateToPage(
          session.page,
          "https://www.red.cl/estado-del-servicio/desvios/",
          {
            timeout: 15000,
          }
        );

        // Check for common bot blocking indicators
        const pageText = await session.page.textContent("body");
        const indicators = [
          "Access Denied",
          "Forbidden",
          "Bot",
          "Cloudflare",
          "Security",
          "Blocked",
          "Rate Limit",
        ];

        const detectedIndicators = indicators.filter((indicator) =>
          pageText?.toLowerCase().includes(indicator.toLowerCase())
        );

        debugInfo.tests.botDetection = {
          status: detectedIndicators.length > 0 ? "⚠️ POTENTIAL BLOCKING" : "✅ NO BLOCKING",
          indicators: detectedIndicators,
          pagePreview: pageText?.substring(0, 300),
        };

        console.log(`🤖 Bot detection results:`, debugInfo.tests.botDetection);
      } catch (error) {
        debugInfo.tests.botDetection = "❌ FAILED";
        debugInfo.errors.push({
          test: "botDetection",
          error: error instanceof Error ? error.message : String(error),
        });
        console.error("❌ Bot detection test failed:", error);
      }
    }

    return NextResponse.json({
      success: true,
      data: debugInfo,
    });
  } catch (error) {
    console.error("❌ Debug API error:", error);
    debugInfo.errors.push({
      test: "general",
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        debugInfo,
      },
      { status: 500 }
    );
  } finally {
    if (session) {
      console.log("🧹 Cleaning up debug session...");
      await session.cleanup();
    }
  }
}
