import { chromium, Browser, BrowserContext, Page } from "playwright-core";
import chromiumPath from "@sparticuz/chromium-min";

// Remote Chromium executable for Vercel production
const CHROMIUM_REMOTE_EXEC_PATH =
  "https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.x64.tar";

// Environment-aware configuration
const getConfig = () => ({
  isProduction: process.env.NODE_ENV === "production",
  headless: process.env.PLAYWRIGHT_HEADLESS !== "false",
  timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || "30000"),
  userAgent:
    process.env.PLAYWRIGHT_USER_AGENT ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  remotePath:
    process.env.CHROMIUM_REMOTE_EXEC_PATH || CHROMIUM_REMOTE_EXEC_PATH,
});

export interface PlaywrightSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  cleanup: () => Promise<void>;
}

export interface PlaywrightOptions {
  userAgent?: string;
  timeout?: number;
  viewport?: {
    width: number;
    height: number;
  };
}

/**
 * Creates a Playwright browser session optimized for Vercel serverless environments
 */
export async function createPlaywrightSession(
  options: PlaywrightOptions = {},
): Promise<PlaywrightSession> {
  const config = getConfig();
  const {
    userAgent = config.userAgent,
    timeout = config.timeout,
    viewport = { width: 1280, height: 720 },
  } = options;

  try {
    console.log(
      `🚀 Creating Playwright session - Production: ${config.isProduction}, Headless: ${config.headless}`,
    );
    console.log(`🔧 Remote Path: ${config.remotePath}`);

    // Configure launch options for serverless environment
    const launchOptions: any = {
      headless: config.headless,
    };

    if (config.isProduction) {
      // Production: Use remote Chromium executable for Vercel
      console.log(`📥 Downloading remote Chromium from: ${config.remotePath}`);
      const execPath = await chromiumPath.executablePath(config.remotePath);
      console.log(`✅ Chromium executable path: ${execPath}`);
      launchOptions.executablePath = execPath;
      launchOptions.args = [
        ...chromiumPath.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
        "--single-process",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-features=TranslateUI",
        "--disable-ipc-flooding-protection",
        "--disable-web-security",
        "--disable-extensions",
      ];
    } else {
      // Development: Use system Chromium
      console.log(`💻 Development mode - using system Chromium`);
      launchOptions.args = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ];
    }

    console.log(`🎛️ Launch options:`, JSON.stringify(launchOptions, null, 2));

    console.log(`🌐 Launching browser...`);
    const browser = await chromium.launch(launchOptions);
    console.log(`✅ Browser launched successfully`);

    // Create context with user agent and viewport
    console.log(`🎭 Creating browser context with User-Agent: ${userAgent}`);
    const context = await browser.newContext({
      userAgent,
      viewport,
      ignoreHTTPSErrors: true,
    });
    console.log(`✅ Browser context created`);

    console.log(`📄 Creating new page...`);
    const page = await context.newPage();
    console.log(`✅ Page created successfully`);

    // Set default timeout
    page.setDefaultTimeout(timeout);
    console.log(`⏱️ Default timeout set to: ${timeout}ms`);

    // Cleanup function
    const cleanup = async () => {
      try {
        console.log("🧹 Starting browser cleanup...");
        await context?.close();
        await browser?.close();
        console.log("✅ Browser session cleaned up successfully");
      } catch (error) {
        console.error("❌ Error during cleanup:", error);
      }
    };

    return {
      browser,
      context,
      page,
      cleanup,
    };
  } catch (error) {
    console.error("❌ Failed to create Playwright session:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`🔍 Error details: ${errorMessage}`);

    if (errorMessage.includes("Executable doesn't exist")) {
      console.error(
        "🚫 Browser not found. Using remote Chromium executable:",
        config.remotePath,
      );
      console.error(
        "💡 For Vercel: Remote executable should resolve binary path issues.",
      );
    }

    if (errorMessage.includes("Could not find browser")) {
      console.error("🔍 Browser search paths issue detected");
    }

    if (errorMessage.includes("ENOENT")) {
      console.error("📁 File/directory not found error");
    }

    throw error;
  }
}

/**
 * Navigate to a URL with retry logic and network idle wait
 */
export async function navigateToPage(
  page: Page,
  url: string,
  options?: {
    timeout?: number;
    retries?: number;
  },
): Promise<void> {
  const config = getConfig();
  const { timeout = config.timeout, retries = 2 } = options || {};

  let lastError: Error | null = null;

  console.log(`🌐 Navigating to: ${url}`);
  for (let i = 0; i <= retries; i++) {
    try {
      console.log(`📡 Navigation attempt ${i + 1}/${retries + 1} to ${url}`);
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout,
      });
      console.log(`✅ Successfully navigated to ${url}`);
      return; // Success!
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Navigation attempt ${i + 1} failed:`, error);
      console.warn(`🔍 Error details: ${(error as Error).message}`);

      if (i < retries) {
        console.log(`⏳ Waiting 1s before retry...`);
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError || new Error("Navigation failed after all retries");
}

/**
 * Wait for selector with retry logic
 */
export async function waitForSelector(
  page: Page,
  selector: string,
  options?: {
    timeout?: number;
    retries?: number;
  },
): Promise<void> {
  const { timeout = 5000, retries = 2 } = options || {};

  let lastError: Error | null = null;

  for (let i = 0; i <= retries; i++) {
    try {
      await page.waitForSelector(selector, { timeout });
      return; // Success!
    } catch (error) {
      lastError = error as Error;
      console.warn(`Selector wait attempt ${i + 1} failed:`, error);

      if (i < retries) {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  throw (
    lastError || new Error(`Selector ${selector} not found after all retries`)
  );
}

/**
 * Utility to handle common scraping patterns with error handling
 */
export async function safeScrape<T>(
  session: PlaywrightSession,
  url: string,
  scrapeFunction: (page: Page) => Promise<T>,
): Promise<T> {
  try {
    console.log(`🕸️ Starting scraping for: ${url}`);
    await navigateToPage(session.page, url);

    console.log(`📊 Running scrape function...`);
    const result = await scrapeFunction(session.page);
    console.log(`✅ Scraping completed successfully for ${url}`);

    return result;
  } catch (error) {
    console.error(`❌ Scraping failed for ${url}:`, error);
    console.error(
      `🔍 Error details: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  } finally {
    // Cleanup is handled by the caller
    console.log(`🧹 Scraping cleanup for ${url}`);
  }
}
