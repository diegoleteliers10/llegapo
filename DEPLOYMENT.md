# 🚀 Deployment Guide for LlegaPO with Playwright

This guide covers deployment strategies for the LlegaPO application using Playwright for web scraping in serverless environments.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Local Development](#local-development)
3. [Vercel Deployment](#vercel-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Environment Variables](#environment-variables)
6. [Troubleshooting](#troubleshooting)

## 🎯 Overview

LlegaPO uses Playwright for web scraping to fetch real-time public transport data from RED.cl. The application includes three main APIs:

- `/api/deviations` - Transport service deviations
- `/api/metro-status` - Metro line status
- `/api/tarifas` - Fare information

## 💻 Local Development

### Prerequisites

- Node.js 18+ or Bun
- Git

### Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd llegapo
```

2. Install dependencies:
```bash
bun install
# or
npm install
```

3. Install Playwright browsers:
```bash
npx playwright install chromium
```

4. Start the development server:
```bash
bun run dev
# or
npm run dev
```

5. Test the APIs:
```bash
curl http://localhost:3000/api/deviations
curl http://localhost:3000/api/metro-status
curl http://localhost:3000/api/tarifas
```

## ☁️ Vercel Deployment

### Option 1: Using playwright-chromium (Recommended)

This is the current setup and works best for Vercel's serverless environment.

1. **Dependencies**: The project uses `playwright-chromium` which includes a bundled Chromium browser.

2. **Environment Variables**: Set these in your Vercel dashboard:
```env
NODE_ENV=production
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000
```

3. **Build Configuration**: No special build configuration needed. Vercel will handle the deployment.

4. **Limitations**:
   - Cold start times may be longer due to browser initialization
   - Memory usage is higher than traditional APIs
   - Function timeout limited to 10 seconds on hobby plan

### Option 2: Using Vercel with Custom Docker (Advanced)

For better performance and reliability:

1. Create a `Dockerfile`:
```dockerfile
FROM mcr.microsoft.com/playwright:v1.57.0-noble

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

2. Configure `vercel.json`:
```json
{
  "functions": {
    "app/api/*/route.ts": {
      "runtime": "nodejs18.x",
      "maxDuration": 30
    }
  }
}
```

## 🐳 Docker Deployment

### Using Official Playwright Docker Image

1. **Dockerfile**:
```dockerfile
FROM mcr.microsoft.com/playwright:v1.57.0-noble

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY bun.lock* ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Create non-root user for security
RUN groupadd -r playwright && useradd -r -g playwright -G audio,video playwright \
    && mkdir -p /home/playwright && chown -R playwright:playwright /home/playwright

# Switch to non-root user
USER playwright

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/deviations || exit 1

# Start the application
CMD ["npm", "start"]
```

2. **docker-compose.yml**:
```yaml
version: '3.8'
services:
  llegapo:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PLAYWRIGHT_HEADLESS=true
      - PLAYWRIGHT_TIMEOUT=30000
    restart: unless-stopped
    security_opt:
      - seccomp:unconfined
    shm_size: 2gb
```

3. **Build and run**:
```bash
docker-compose up --build
```

## 🌐 Environment Variables

### Required Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NODE_ENV` | Environment mode | `development` | `production` |
| `PLAYWRIGHT_HEADLESS` | Run browser in headless mode | `true` | `true` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PLAYWRIGHT_TIMEOUT` | Default timeout in ms | `30000` | `45000` |
| `PLAYWRIGHT_USER_AGENT` | Custom user agent | Chrome UA | Custom string |
| `PLAYWRIGHT_BROWSERS_PATH` | Browser installation path | System default | `0` for hermetic |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | Custom Chromium path | Auto-detected | `/usr/bin/chromium` |

### Setting Environment Variables

#### Vercel
1. Go to your project dashboard
2. Click "Settings" → "Environment Variables"
3. Add the required variables for Production, Preview, and Development

#### Local Development
Create a `.env.local` file:
```env
NODE_ENV=development
PLAYWRIGHT_HEADLESS=false
PLAYWRIGHT_TIMEOUT=30000
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "Executable doesn't exist" Error

**Problem**: Browser executable not found in production.

**Solutions**:
```bash
# For local development
npx playwright install chromium

# For Docker
# Use official Playwright Docker image

# For Vercel
# Ensure playwright-chromium is in dependencies
```

#### 2. Memory Limit Exceeded

**Problem**: Browser usage exceeds serverless memory limits.

**Solutions**:
- Upgrade Vercel plan for more memory
- Optimize browser args in `playwright-utils.ts`
- Use single-process mode (already implemented)
- Implement response caching

#### 3. Timeout Issues

**Problem**: Functions timeout before completing scraping.

**Solutions**:
```typescript
// Increase timeout in API routes
session = await createPlaywrightSession({
  timeout: 45000, // 45 seconds
});

// Set in environment variables
PLAYWRIGHT_TIMEOUT=45000
```

#### 4. CORS Issues in Production

**Problem**: API calls blocked by CORS policy.

**Solution**: Add CORS headers in `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### Performance Optimization

#### 1. Browser Args Optimization
```typescript
// In playwright-utils.ts
const launchOptions = {
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--single-process", // Reduces memory usage
    "--no-first-run",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
  ],
};
```

#### 2. Response Caching
Implement caching to reduce scraping frequency:

```typescript
// Example cache implementation
import { NextResponse } from "next/server";

const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  const cacheKey = 'deviations';
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json(cached.data);
  }
  
  // ... scraping logic ...
  
  const result = { success: true, data: deviations };
  cache.set(cacheKey, { data: result, timestamp: Date.now() });
  
  return NextResponse.json(result);
}
```

## 📊 Monitoring and Logging

### Health Checks

Create a health check endpoint:

```typescript
// app/api/health/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Basic health check
    const checks = {
      timestamp: new Date().toISOString(),
      status: "healthy",
      version: process.env.npm_package_version || "unknown",
      environment: process.env.NODE_ENV || "unknown",
    };
    
    return NextResponse.json(checks);
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", error: error.message },
      { status: 500 }
    );
  }
}
```

### Error Monitoring

Integrate with monitoring services:

```typescript
// lib/monitoring.ts
export function logError(error: Error, context: string) {
  console.error(`[${context}] ${error.message}`, {
    stack: error.stack,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
  
  // Send to monitoring service (e.g., Sentry, LogRocket)
  if (process.env.NODE_ENV === "production") {
    // Sentry.captureException(error);
  }
}
```

## 🚀 Deployment Checklist

- [ ] Dependencies updated (`playwright-chromium` installed)
- [ ] Environment variables configured
- [ ] Browser installation working locally
- [ ] All APIs tested locally
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Health check endpoint created
- [ ] Performance optimization applied
- [ ] CORS configured if needed
- [ ] Monitoring setup (optional)

## 📝 Additional Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Vercel Functions Documentation](https://vercel.com/docs/functions)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Docker with Playwright](https://playwright.dev/docs/docker)

---

For questions or issues, please check the troubleshooting section above or create an issue in the repository.