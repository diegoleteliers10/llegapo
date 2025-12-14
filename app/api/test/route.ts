import { NextResponse } from "next/server";
import {
  createPlaywrightSession,
  navigateToPage,
  safeScrape,
} from "@/lib/playwright-utils";

export async function GET() {
  let session;
  try {
    // Test basic browser creation
    session = await createPlaywrightSession({
      timeout: 10000,
    });

    // Test simple navigation
    const result = await safeScrape(
      session,
      "https://httpbin.org/user-agent",
      async (page) => {
        const content = await page.textContent('body');
        return { content };
      },
    );

    return NextResponse.json({
      success: true,
      data: {
        message: "Browser session created successfully",
        userAgentTest: result,
        environment: {
          isProduction: process.env.NODE_ENV === "production",
          hasChromium: !!process.env.VERCEL,
        },
      },
    });
  } catch (error) {
    console.error("Test API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        environment: {
          isProduction: process.env.NODE_ENV === "production",
          hasChromium: !!process.env.VERCEL,
        },
      },
      { status: 500 },
    );
  } finally {
    if (session) {
      await session.cleanup();
    }
  }
}
