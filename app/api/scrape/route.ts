/**
 * API Route for ChatGPT Scraping with Playwright
 * This handles the server-side browser automation
 */

import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import type { ScrapedConversation } from '@/types/scraper';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

export async function POST(request: Request) {
  let browser;

  try {
    const { maxConversations = 0 } = await request.json();

    // Launch browser (headless: false to allow user to see and login)
    browser = await chromium.launch({
      headless: false, // User needs to see to login
      slowMo: 100, // Slow down for stability
    });

    const page = await browser.newPage();
    const conversations: ScrapedConversation[] = [];

    // 1. Navigate to ChatGPT
    await page.goto('https://chat.openai.com', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // 2. Wait for user to login (wait for conversation links to appear)
    console.log('Waiting for login... Please log in to ChatGPT in the browser window');

    try {
      await page.waitForSelector('nav a[href^="/c/"]', {
        timeout: 120000, // 2 minutes for user to login
      });
    } catch (error) {
      throw new Error('Login timeout. Please make sure you are logged in to ChatGPT.');
    }

    console.log('Login detected! Starting to collect conversations...');

    // 3. Scroll sidebar to load all conversations
    await page.evaluate(async () => {
      const sidebar = document.querySelector('nav') ||
                     document.querySelector('[class*="sidebar"]') ||
                     document.querySelector('aside');

      if (sidebar) {
        let previousHeight = 0;
        let currentHeight = sidebar.scrollHeight;
        let attempts = 0;
        const maxAttempts = 50;

        while (currentHeight > previousHeight && attempts < maxAttempts) {
          previousHeight = currentHeight;
          sidebar.scrollTo(0, sidebar.scrollHeight);
          await new Promise(r => setTimeout(r, 500));
          currentHeight = sidebar.scrollHeight;
          attempts++;
        }
      }
    });

    console.log('Finished scrolling sidebar');

    // 4. Get all conversation links
    const links = await page.evaluate(() => {
      const convos: Array<{id: string; title: string; url: string}> = [];
      const elements = document.querySelectorAll('nav a[href^="/c/"]');

      elements.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
          const id = href.match(/\/c\/([a-f0-9-]+)/)?.[1];
          const title = link.textContent?.trim() || 'Untitled';
          if (id) {
            convos.push({
              id,
              title,
              url: 'https://chat.openai.com' + href
            });
          }
        }
      });

      // Remove duplicates
      return [...new Map(convos.map(c => [c.id, c])).values()];
    });

    console.log(`Found ${links.length} conversations`);

    // Limit if requested
    const linksToScrape = maxConversations > 0
      ? links.slice(0, maxConversations)
      : links;

    // 5. Scrape each conversation
    for (let i = 0; i < linksToScrape.length; i++) {
      const link = linksToScrape[i];

      console.log(`Scraping ${i + 1}/${linksToScrape.length}: ${link.title}`);

      try {
        await page.goto(link.url, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        // Wait a bit for messages to load
        await page.waitForTimeout(1000);

        const conversation = await page.evaluate(() => {
          const url = window.location.href;
          const id = url.match(/\/c\/([a-f0-9-]+)/)?.[1] || '';

          const titleEl = document.querySelector('title');
          const title = titleEl?.textContent?.replace(' | ChatGPT', '').trim() || 'Untitled';

          const messages: any[] = [];

          // Try multiple selectors for messages
          const messageElements = document.querySelectorAll('[data-message-author-role]');

          messageElements.forEach(element => {
            const role = element.getAttribute('data-message-author-role');

            // Get content element
            const contentEl = element.querySelector('[class*="markdown"]') ||
                            element.querySelector('.prose') ||
                            element.querySelector('[class*="text-base"]') ||
                            element;

            let content = '';

            // Extract code blocks
            const codeBlocks: any[] = [];
            const preElements = contentEl.querySelectorAll('pre code');

            preElements.forEach((codeEl) => {
              const code = codeEl.textContent || '';
              const languageMatch = codeEl.className.match(/language-(\w+)/);
              const language = languageMatch ? languageMatch[1] : 'plaintext';

              codeBlocks.push({ language, code });
            });

            // Get text content
            content = contentEl.textContent?.trim() || '';

            if (content && (role === 'user' || role === 'assistant')) {
              messages.push({
                role,
                content,
                timestamp: new Date().toISOString(),
                codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
              });
            }
          });

          return {
            id,
            title,
            url,
            messages,
            updatedAt: new Date().toISOString()
          };
        });

        if (conversation.messages.length > 0) {
          conversations.push({
            ...conversation,
            updatedAt: new Date(conversation.updatedAt),
          });
          console.log(`  ✓ Scraped ${conversation.messages.length} messages`);
        } else {
          console.log(`  ⚠ No messages found`);
        }

        // Delay to avoid rate limiting
        await page.waitForTimeout(1000);

      } catch (error) {
        console.error(`Error scraping conversation ${link.title}:`, error);
        // Continue with next conversation
      }
    }

    await browser.close();

    console.log(`\n✓ Scraping complete! Scraped ${conversations.length} conversations`);

    return NextResponse.json({
      success: true,
      conversations,
      statistics: {
        totalConversations: conversations.length,
        totalMessages: conversations.reduce((sum, c) => sum + c.messages.length, 0),
        duration: 0,
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
