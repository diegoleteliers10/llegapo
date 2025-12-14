import { chromium, Browser, BrowserContext, Page } from "playwright-chromium";

// Environment-aware configuration
const getConfig = () => ({
  headless: process.env.PLAYWRIGHT_HEADLESS !== "false",
  timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || "30000"),
  userAgent:
    process.env.PLAYWRIGHT_USER_AGENT ||
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  chromiumExecutablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  isProduction: process.env.NODE_ENV === "production",
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
 * Creates a Playwright browser session optimized for serverless environments
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

  // Browser launch options optimized for serverless
  const launchOptions: any = {
    headless: config.headless,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
      "--disable-features=TranslateUI",
      "--disable-ipc-flooding-protection",
      "--disable-web-security",
      "--disable-extensions",
      ...(config.isProduction ? ["--single-process"] : []), // Important for serverless
    ],
  };

  // Add executable path if specified
  if (config.chromiumExecutablePath) {
    launchOptions.executablePath = config.chromiumExecutablePath;
  }

  try {
    console.log(
      `Creating Playwright session - Production: ${config.isProduction}, Headless: ${config.headless}`,
    );
    const browser = await chromium.launch(launchOptions);

    // Create context with user agent and viewport
    const context = await browser.newContext({
      userAgent,
      viewport,
      ignoreHTTPSErrors: true,
    });

    // Create page
    const page = await context.newPage();

    // Set default timeout
    page.setDefaultTimeout(timeout);

    // Cleanup function
    const cleanup = async () => {
      try {
        await context?.close();
        await browser?.close();
        console.log("Playwright session cleaned up successfully");
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    };

    return {
      browser,
      context,
      page,
      cleanup,
    };
  } catch (error) {
    console.error("Failed to create Playwright session:", error);

    // Provide helpful error messages for common deployment issues
    if (error.message?.includes("Executable doesn't exist")) {
      console.error(
        "Browser not found. In production, ensure browsers are installed or use a container with pre-installed browsers.",
      );
      console.error(
        "For Vercel: Consider using playwright-chromium or a custom Docker container.",
      );
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

  for (let i = 0; i <= retries; i++) {
    try {
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout,
      });
      return; // Success!
    } catch (error) {
      lastError = error as Error;
      console.warn(`Navigation attempt ${i + 1} failed:`, error);

      if (i < retries) {
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
    await navigateToPage(session.page, url);
    return await scrapeFunction(session.page);
  } catch (error) {
    console.error(`Scraping failed for ${url}:`, error);
    throw error;
  } finally {
    // Cleanup is handled by the caller
  }
}
