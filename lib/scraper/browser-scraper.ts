/**
 * Browser-based scraper using Playwright MCP Tools
 * This is a client-side implementation that can be called from the UI
 */

import type { ScrapedConversation, ScraperProgress } from '@/types/scraper';
import { convertScrapedToProcessed } from './chatgpt-scraper';

export type ProgressCallback = (progress: ScraperProgress) => void;

/**
 * Scrape ChatGPT conversations using the API route
 */
export async function scrapeWithAPI(
  onProgress?: ProgressCallback
): Promise<any[]> {
  try {
    onProgress?.({
      phase: 'initializing',
      conversationsFound: 0,
      conversationsScraped: 0,
    });

    const response = await fetch('/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maxConversations: 0, // 0 = unlimited
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Scraping failed');
    }

    onProgress?.({
      phase: 'processing',
      conversationsFound: data.conversations.length,
      conversationsScraped: data.conversations.length,
    });

    // Convert scraped data to ProcessedConversation format
    const processed = convertScrapedToProcessed(data.conversations);

    onProgress?.({
      phase: 'completed',
      conversationsFound: processed.length,
      conversationsScraped: processed.length,
    });

    return processed;

  } catch (error) {
    onProgress?.({
      phase: 'error',
      conversationsFound: 0,
      conversationsScraped: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Alternative: Direct browser automation using Playwright
 * This would require Playwright to be installed and accessible from the client
 *
 * For security and architecture reasons, it's better to use the API route approach
 */
