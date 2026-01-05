/**
 * Enhanced ChatGPT Scraper with robust error handling and recovery
 *
 * Features:
 * - Multiple DOM selector fallbacks
 * - Retry logic with exponential backoff
 * - Progress persistence in localStorage
 * - Smart rate limiting
 * - Detailed error tracking
 * - Resume capability
 */

import type { Page } from 'playwright';
import type { ScrapedConversation, ScrapedMessage } from '@/types/scraper';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ScrapeProgress {
  sessionId: string;
  totalConversations: number;
  scrapedConversations: ScrapedConversation[];
  scrapedIds: string[];
  failedConversations: FailedConversation[];
  currentIndex: number;
  timestamp: number;
  isComplete: boolean;
}

export interface FailedConversation {
  id: string;
  title: string;
  url: string;
  error: string;
  retryCount: number;
  lastAttempt: number;
}

export interface ConversationLink {
  id: string;
  title: string;
  url: string;
}

export interface ScraperConfig {
  maxRetries: number;
  minDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterRange: number;
  timeout: number;
  saveProgressInterval: number; // Save progress every N conversations
}

export interface SelectorConfig {
  conversationLinks: string[];
  sidebar: string[];
  messageContainer: string[];
  messageContent: string[];
  codeBlock: string[];
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const DEFAULT_SCRAPER_CONFIG: ScraperConfig = {
  maxRetries: 3,
  minDelay: 1500,      // 1.5 seconds
  maxDelay: 4000,      // 4 seconds
  backoffMultiplier: 1.5,
  jitterRange: 500,    // Random 0-500ms
  timeout: 30000,      // 30 seconds
  saveProgressInterval: 5, // Save every 5 conversations
};

export const SELECTORS: SelectorConfig = {
  conversationLinks: [
    'nav a[href^="/c/"]',
    'aside a[href^="/c/"]',
    '[data-testid*="conversation-link"]',
    'a[href*="/c/"]',
    '.conversation-item a',
    '[class*="conversation"] a',
  ],
  sidebar: [
    'nav',
    'aside',
    '[role="navigation"]',
    '[class*="sidebar"]',
    '[class*="Sidebar"]',
    '[data-testid="sidebar"]',
  ],
  messageContainer: [
    '[data-message-author-role]',
    '[data-testid="conversation-turn"]',
    '[data-testid="message"]',
    '.message',
    '[class*="Message"]',
    '[class*="ConversationTurn"]',
  ],
  messageContent: [
    '[class*="markdown"]',
    '.prose',
    '[class*="text-base"]',
    '[class*="message-content"]',
    '[data-testid="message-content"]',
  ],
  codeBlock: [
    'pre code',
    'code[class*="language-"]',
    '[class*="code-block"] code',
    'pre',
  ],
};

const PROGRESS_STORAGE_KEY = 'chatgpt-scrape-progress';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  config: ScraperConfig
): number {
  const baseDelay = config.minDelay * Math.pow(config.backoffMultiplier, attempt);
  const delay = Math.min(baseDelay, config.maxDelay);
  const jitter = Math.random() * config.jitterRange;
  return delay + jitter;
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `scrape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Try multiple selectors until one works
 */
async function queryWithFallback(
  page: Page,
  selectors: string[],
  options?: { timeout?: number; visible?: boolean }
): Promise<string | null> {
  for (const selector of selectors) {
    try {
      const element = await page.waitForSelector(selector, {
        timeout: options?.timeout || 5000,
        state: options?.visible ? 'visible' : 'attached',
      });
      if (element) {
        return selector;
      }
    } catch (error) {
      // Try next selector
      continue;
    }
  }
  return null;
}

// ============================================================================
// PROGRESS PERSISTENCE
// ============================================================================

/**
 * Save scrape progress to localStorage
 */
export function saveProgress(progress: ScrapeProgress): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
      console.log(`[Progress] Saved: ${progress.scrapedIds.length}/${progress.totalConversations} conversations`);
    }
  } catch (error) {
    console.error('[Progress] Failed to save:', error);
  }
}

/**
 * Load scrape progress from localStorage
 */
export function loadProgress(): ScrapeProgress | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (stored) {
        const progress = JSON.parse(stored);
        console.log(`[Progress] Loaded: ${progress.scrapedIds.length}/${progress.totalConversations} conversations`);
        return progress;
      }
    }
  } catch (error) {
    console.error('[Progress] Failed to load:', error);
  }
  return null;
}

/**
 * Clear scrape progress from localStorage
 */
export function clearProgress(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(PROGRESS_STORAGE_KEY);
      console.log('[Progress] Cleared');
    }
  } catch (error) {
    console.error('[Progress] Failed to clear:', error);
  }
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

/**
 * Retry an async operation with exponential backoff
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  config: ScraperConfig
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      console.log(`[Retry] ${operationName} - Attempt ${attempt + 1}/${config.maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Retry] ${operationName} failed (attempt ${attempt + 1}):`, lastError.message);

      // Don't wait after the last attempt
      if (attempt < config.maxRetries - 1) {
        const delay = calculateDelay(attempt, config);
        console.log(`[Retry] Waiting ${Math.round(delay)}ms before retry...`);
        await sleep(delay);
      }
    }
  }

  throw new Error(`${operationName} failed after ${config.maxRetries} attempts: ${lastError?.message}`);
}

// ============================================================================
// SELECTOR ENGINE
// ============================================================================

/**
 * Find conversation links with robust selectors
 */
export async function findConversationLinks(
  page: Page,
  config: ScraperConfig
): Promise<ConversationLink[]> {
  return await retryOperation(
    async () => {
      // First, find the working selector for conversation links
      const workingSelector = await queryWithFallback(
        page,
        SELECTORS.conversationLinks,
        { timeout: config.timeout }
      );

      if (!workingSelector) {
        throw new Error('Could not find conversation links with any known selector');
      }

      console.log(`[Selectors] Using conversation link selector: ${workingSelector}`);

      // Extract conversation data
      const links = await page.evaluate((selector) => {
        const convos: ConversationLink[] = [];
        const elements = document.querySelectorAll(selector);

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

        // Remove duplicates by ID
        return [...new Map(convos.map(c => [c.id, c])).values()];
      }, workingSelector);

      return links;
    },
    'Find conversation links',
    config
  );
}

/**
 * Scrape a single conversation with robust selectors
 */
export async function scrapeConversation(
  page: Page,
  link: ConversationLink,
  config: ScraperConfig
): Promise<ScrapedConversation> {
  return await retryOperation(
    async () => {
      // Navigate to conversation
      await page.goto(link.url, {
        waitUntil: 'networkidle',
        timeout: config.timeout,
      });

      // Wait for messages to load
      await sleep(1500);

      // Find working selector for message containers
      const messageSelector = await queryWithFallback(
        page,
        SELECTORS.messageContainer,
        { timeout: 5000, visible: true }
      );

      if (!messageSelector) {
        throw new Error(`No messages found for conversation: ${link.title}`);
      }

      console.log(`[Selectors] Using message selector: ${messageSelector}`);

      // Extract conversation data
      const conversation = await page.evaluate(
        ({ url, id, title, messageSelector, contentSelectors, codeSelectors }) => {
          const messages: ScrapedMessage[] = [];
          const messageElements = document.querySelectorAll(messageSelector);

          messageElements.forEach(element => {
            const role = element.getAttribute('data-message-author-role');

            // Try to find content element with fallbacks
            let contentEl: Element | null = null;
            for (const selector of contentSelectors) {
              contentEl = element.querySelector(selector);
              if (contentEl) break;
            }
            if (!contentEl) contentEl = element;

            // Extract code blocks
            const codeBlocks: any[] = [];
            for (const codeSelector of codeSelectors) {
              const codeElements = contentEl.querySelectorAll(codeSelector);
              codeElements.forEach((codeEl) => {
                const code = codeEl.textContent || '';
                const languageMatch = codeEl.className.match(/language-(\w+)/);
                const language = languageMatch ? languageMatch[1] : 'plaintext';

                if (code.trim()) {
                  codeBlocks.push({ language, code: code.trim() });
                }
              });
              if (codeBlocks.length > 0) break; // Found code blocks, stop trying
            }

            // Get text content
            const content = contentEl.textContent?.trim() || '';

            if (content && (role === 'user' || role === 'assistant')) {
              messages.push({
                role: role as 'user' | 'assistant',
                content,
                timestamp: new Date(),
                codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
              });
            }
          });

          return {
            id,
            title,
            url,
            messages,
            updatedAt: new Date()
          };
        },
        {
          url: link.url,
          id: link.id,
          title: link.title,
          messageSelector,
          contentSelectors: SELECTORS.messageContent,
          codeSelectors: SELECTORS.codeBlock,
        }
      );

      if (conversation.messages.length === 0) {
        throw new Error(`No messages extracted from conversation: ${link.title}`);
      }

      return conversation;
    },
    `Scrape conversation: ${link.title}`,
    config
  );
}

/**
 * Scroll sidebar to load all conversations
 */
export async function scrollSidebarToLoadAll(
  page: Page,
  config: ScraperConfig
): Promise<void> {
  return await retryOperation(
    async () => {
      // Find the sidebar
      const sidebarSelector = await queryWithFallback(
        page,
        SELECTORS.sidebar,
        { timeout: config.timeout }
      );

      if (!sidebarSelector) {
        throw new Error('Could not find sidebar with any known selector');
      }

      console.log(`[Selectors] Using sidebar selector: ${sidebarSelector}`);

      // Scroll the sidebar
      await page.evaluate(async (selector) => {
        const sidebar = document.querySelector(selector);
        if (!sidebar) return;

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

        console.log(`[Scroll] Completed after ${attempts} attempts`);
      }, sidebarSelector);
    },
    'Scroll sidebar',
    config
  );
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Wait with smart rate limiting
 */
export async function smartDelay(
  conversationIndex: number,
  config: ScraperConfig
): Promise<void> {
  // Base delay with jitter
  const baseDelay = config.minDelay + Math.random() * config.jitterRange;

  // Increase delay slightly as we scrape more (avoid rate limits)
  const progressMultiplier = 1 + (conversationIndex / 100) * 0.5; // +50% after 100 conversations

  const totalDelay = Math.min(baseDelay * progressMultiplier, config.maxDelay);

  console.log(`[Rate Limit] Waiting ${Math.round(totalDelay)}ms...`);
  await sleep(totalDelay);
}

// ============================================================================
// MAIN SCRAPER
// ============================================================================

/**
 * Enhanced scraper with all improvements
 */
export async function enhancedScrape(
  page: Page,
  onProgress?: (progress: ScrapeProgress) => void,
  config: ScraperConfig = DEFAULT_SCRAPER_CONFIG
): Promise<ScrapeProgress> {
  const sessionId = generateSessionId();

  // Try to load existing progress
  let progress: ScrapeProgress | null = loadProgress();

  if (progress && !progress.isComplete) {
    console.log('[Resume] Found existing progress, resuming...');
  } else {
    // Start new session
    console.log('[Start] Starting new scrape session');
    progress = {
      sessionId,
      totalConversations: 0,
      scrapedConversations: [],
      scrapedIds: [],
      failedConversations: [],
      currentIndex: 0,
      timestamp: Date.now(),
      isComplete: false,
    };
  }

  try {
    // 1. Scroll sidebar to load all conversations
    console.log('[Step 1/4] Scrolling sidebar...');
    await scrollSidebarToLoadAll(page, config);

    // 2. Find all conversation links
    console.log('[Step 2/4] Finding conversations...');
    const allLinks = await findConversationLinks(page, config);
    console.log(`[Found] ${allLinks.length} conversations`);

    progress.totalConversations = allLinks.length;

    // 3. Filter out already scraped conversations
    const linksToScrape = allLinks.filter(link => !progress!.scrapedIds.includes(link.id));
    console.log(`[Resume] ${linksToScrape.length} conversations left to scrape`);

    // 4. Scrape each conversation
    console.log('[Step 3/4] Scraping conversations...');
    for (let i = 0; i < linksToScrape.length; i++) {
      const link = linksToScrape[i];
      const globalIndex = progress.currentIndex + i;

      console.log(`\n[Scraping] ${globalIndex + 1}/${allLinks.length}: ${link.title}`);

      try {
        // Scrape conversation
        const conversation = await scrapeConversation(page, link, config);

        // Add to results
        progress.scrapedConversations.push(conversation);
        progress.scrapedIds.push(link.id);

        console.log(`[Success] ✓ Scraped ${conversation.messages.length} messages`);

        // Save progress periodically
        if ((i + 1) % config.saveProgressInterval === 0) {
          progress.currentIndex = globalIndex + 1;
          saveProgress(progress);
        }

        // Report progress
        if (onProgress) {
          onProgress(progress);
        }

        // Rate limiting (except for last conversation)
        if (i < linksToScrape.length - 1) {
          await smartDelay(globalIndex, config);
        }

      } catch (error) {
        console.error(`[Failed] ✗ Error:`, error);

        // Track failed conversation
        const failedConvo: FailedConversation = {
          id: link.id,
          title: link.title,
          url: link.url,
          error: error instanceof Error ? error.message : String(error),
          retryCount: 0,
          lastAttempt: Date.now(),
        };
        progress.failedConversations.push(failedConvo);

        // Continue with next conversation
      }
    }

    // Mark as complete
    progress.isComplete = true;
    progress.currentIndex = allLinks.length;
    saveProgress(progress);

    console.log('\n[Complete] ✓ Scraping finished!');
    console.log(`[Stats] Successfully scraped: ${progress.scrapedConversations.length}/${allLinks.length}`);
    console.log(`[Stats] Failed: ${progress.failedConversations.length}`);

    return progress;

  } catch (error) {
    console.error('[Error] Scraping failed:', error);
    saveProgress(progress);
    throw error;
  }
}
