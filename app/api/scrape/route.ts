/**
 * API Route for ChatGPT Scraping with Playwright
 * Enhanced version with robust error handling and recovery
 */

import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import type { ScrapedConversation } from '@/types/scraper';
import {
  enhancedScrape,
  DEFAULT_SCRAPER_CONFIG,
  type ScraperConfig,
  type ScrapeProgress,
} from '@/lib/scraper/enhanced-scraper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

export async function POST(request: Request) {
  let browser;

  try {
    const {
      maxConversations = 0,
      config = {},
    } = await request.json();

    // Merge custom config with defaults
    const scraperConfig: ScraperConfig = {
      ...DEFAULT_SCRAPER_CONFIG,
      ...config,
    };

    // Launch browser (headless: false to allow user to see and login)
    console.log('[Browser] Launching Chromium...');
    browser = await chromium.launch({
      headless: false, // User needs to see to login
      slowMo: 100, // Slow down for stability
    });

    const page = await browser.newPage();

    // 1. Navigate to ChatGPT
    console.log('[Navigation] Going to ChatGPT...');
    await page.goto('https://chat.openai.com', {
      waitUntil: 'networkidle',
      timeout: scraperConfig.timeout,
    });

    // 2. Wait for user to login
    console.log('[Login] Waiting for login... Please log in to ChatGPT in the browser window');

    try {
      // Try multiple selectors for conversation links
      const loginSelectors = [
        'nav a[href^="/c/"]',
        'aside a[href^="/c/"]',
        'a[href*="/c/"]',
      ];

      let loginDetected = false;
      for (const selector of loginSelectors) {
        try {
          await page.waitForSelector(selector, {
            timeout: 120000, // 2 minutes for user to login
          });
          loginDetected = true;
          console.log(`[Login] Detected using selector: ${selector}`);
          break;
        } catch {
          continue;
        }
      }

      if (!loginDetected) {
        throw new Error('Login timeout. Please make sure you are logged in to ChatGPT.');
      }
    } catch (error) {
      throw new Error('Login timeout. Please make sure you are logged in to ChatGPT.');
    }

    console.log('[Login] ✓ Login detected! Starting enhanced scrape...');

    // 3. Use enhanced scraper
    const progress: ScrapeProgress = await enhancedScrape(
      page,
      undefined, // No progress callback in API route
      scraperConfig
    );

    // Limit conversations if requested
    let conversations = progress.scrapedConversations;
    if (maxConversations > 0) {
      conversations = conversations.slice(0, maxConversations);
    }

    await browser.close();

    console.log(`\n✓ Scraping complete!`);
    console.log(`   Successfully scraped: ${progress.scrapedConversations.length}/${progress.totalConversations}`);
    console.log(`   Failed: ${progress.failedConversations.length}`);
    console.log(`   Total messages: ${conversations.reduce((sum, c) => sum + c.messages.length, 0)}`);

    return NextResponse.json({
      success: true,
      conversations,
      statistics: {
        totalConversations: progress.totalConversations,
        successfulConversations: progress.scrapedConversations.length,
        failedConversations: progress.failedConversations.length,
        totalMessages: conversations.reduce((sum, c) => sum + c.messages.length, 0),
        duration: Date.now() - progress.timestamp,
      },
      failed: progress.failedConversations,
      progress: {
        isComplete: progress.isComplete,
        sessionId: progress.sessionId,
      }
    });

  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }

    console.error('Scraping error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      conversations: [],
    }, { status: 500 });
  }
}
