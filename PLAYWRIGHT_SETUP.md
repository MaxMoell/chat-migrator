# Playwright Auto-Scrape Setup Guide

This guide explains how to complete the Playwright auto-scrape feature for automatically extracting ChatGPT conversations.

## Overview

The auto-scrape feature uses Playwright to:
1. Open ChatGPT in a browser
2. Navigate through your conversations
3. Extract messages directly from the DOM
4. Convert them to the migration tool's format

## Current Status

✅ **Completed:**
- UI components (AutoScrapeButton)
- DOM parsing logic (chatgpt-dom-parser.ts)
- Data structures and types
- Integration into main page
- Workflow blueprint

🔄 **Needs Implementation:**
- Actual Playwright browser automation
- Connection to Playwright MCP tools or direct Playwright usage

## Implementation Options

### Option 1: Using Playwright MCP Tools (Recommended for Claude Code)

If you're using Claude Code with Playwright MCP plugin:

```typescript
// In lib/scraper/chatgpt-scraper.ts

import type { ScrapedConversation } from '@/types/scraper';

export async function scrapeConversations(onProgress) {
  const conversations: ScrapedConversation[] = [];

  // 1. Navigate to ChatGPT
  await mcp__plugin_playwright__browser_navigate({
    url: 'https://chat.openai.com'
  });

  onProgress({ phase: 'logging-in', conversationsFound: 0, conversationsScraped: 0 });

  // 2. Wait for login (check for New Chat button)
  let loggedIn = false;
  while (!loggedIn) {
    const snapshot = await mcp__plugin_playwright__browser_snapshot();
    if (snapshot.includes('New chat')) {
      loggedIn = true;
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  onProgress({ phase: 'loading-chats', conversationsFound: 0, conversationsScraped: 0 });

  // 3. Scroll sidebar to load all conversations
  await mcp__plugin_playwright__browser_evaluate({
    function: `async () => {
      const sidebar = document.querySelector('nav') ||
                     document.querySelector('[class*="sidebar"]') ||
                     document.querySelector('aside');
      if (sidebar) {
        let previousHeight = 0;
        let currentHeight = sidebar.scrollHeight;
        while (currentHeight > previousHeight) {
          previousHeight = currentHeight;
          sidebar.scrollTo(0, sidebar.scrollHeight);
          await new Promise(r => setTimeout(r, 500));
          currentHeight = sidebar.scrollHeight;
        }
      }
    }`
  });

  // 4. Get conversation links
  const linksJson = await mcp__plugin_playwright__browser_evaluate({
    function: `() => {
      const links = [];
      const elements = document.querySelectorAll('nav a[href^="/c/"]');
      elements.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
          const id = href.match(/\\/c\\/([a-f0-9-]+)/)?.[1];
          const title = link.textContent?.trim() || 'Untitled';
          const url = 'https://chat.openai.com' + href;
          if (id) links.push({ id, title, url });
        }
      });
      return JSON.stringify([...new Map(links.map(l => [l.id, l])).values()]);
    }`
  });

  const links = JSON.parse(linksJson);

  onProgress({
    phase: 'scraping',
    conversationsFound: links.length,
    conversationsScraped: 0
  });

  // 5. Scrape each conversation
  for (let i = 0; i < links.length; i++) {
    const link = links[i];

    await mcp__plugin_playwright__browser_navigate({ url: link.url });
    await new Promise(r => setTimeout(r, 2000)); // Wait for load

    const conversationJson = await mcp__plugin_playwright__browser_evaluate({
      function: `() => {
        // Parse conversation from DOM
        const url = window.location.href;
        const id = url.match(/\\/c\\/([a-f0-9-]+)/)?.[1];
        const title = document.querySelector('title')?.textContent?.replace(' | ChatGPT', '') || 'Untitled';

        const messages = [];
        const messageElements = document.querySelectorAll('[data-message-author-role]');

        messageElements.forEach(element => {
          const role = element.getAttribute('data-message-author-role');
          const content = element.textContent?.trim() || '';
          if (content) {
            messages.push({ role, content });
          }
        });

        return JSON.stringify({
          id,
          title,
          url,
          messages,
          updatedAt: new Date().toISOString()
        });
      }`
    });

    const conversation = JSON.parse(conversationJson);
    if (conversation && conversation.messages?.length > 0) {
      conversations.push(conversation);
    }

    onProgress({
      phase: 'scraping',
      conversationsFound: links.length,
      conversationsScraped: i + 1,
      currentConversation: link.title
    });

    // Delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }

  await mcp__plugin_playwright__browser_close();

  onProgress({
    phase: 'completed',
    conversationsFound: links.length,
    conversationsScraped: conversations.length
  });

  return conversations;
}
```

### Option 2: Using Playwright Directly (API Route)

Create an API route at `app/api/scrape/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { parseConversationFromDOM, getConversationLinks, scrollToLoadAll } from '@/lib/scraper/chatgpt-dom-parser';

export async function POST(request: Request) {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.goto('https://chat.openai.com');

    // Wait for login
    await page.waitForSelector('nav a[href^="/c/"]', { timeout: 60000 });

    // Scroll to load all
    await page.evaluate(scrollToLoadAll);

    // Get links
    const links = await page.evaluate(getConversationLinks);

    const conversations = [];

    for (const link of links) {
      await page.goto(link.url);
      await page.waitForLoadState('networkidle');

      const conversation = await page.evaluate(parseConversationFromDOM);
      if (conversation) {
        conversations.push(conversation);
      }

      await page.waitForTimeout(1000);
    }

    await browser.close();

    return NextResponse.json({ success: true, conversations });
  } catch (error) {
    await browser.close();
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
```

Then update `AutoScrapeButton.tsx` to call this API:

```typescript
const handleConfirm = async () => {
  setIsRunning(true);

  try {
    const response = await fetch('/api/scrape', {
      method: 'POST',
    });

    const data = await response.json();

    if (data.success) {
      const processed = convertScrapedToProcessed(data.conversations);
      onComplete(processed);
    } else {
      onError(data.error);
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : 'Unknown error');
  } finally {
    setIsRunning(false);
  }
};
```

### Option 3: Browser Extension

Create a browser extension that:
1. Runs in the ChatGPT tab
2. Extracts data using content scripts
3. Sends data to your app via postMessage

This is the most privacy-focused approach as everything stays client-side.

## Dependencies

For Option 2 (Playwright directly), install:

```bash
npm install playwright
npx playwright install chromium
```

## Testing

1. Start with a small test (1-2 conversations)
2. Check the extracted data format
3. Verify messages are correctly parsed
4. Test with conversations containing code blocks
5. Scale up to all conversations

## Troubleshooting

### ChatGPT DOM Changes
If ChatGPT updates their UI, you may need to update the selectors in `chatgpt-dom-parser.ts`:

```typescript
// Common selectors to try:
const messageSelectors = [
  '[data-message-author-role]',           // Primary selector
  '.group.w-full',                        // Alternative 1
  'article[class*="group"]',              // Alternative 2
  '[class*="text-base"]',                 // Fallback
];
```

### Rate Limiting
If you hit rate limits:
1. Increase delay between conversations (default: 1000ms)
2. Implement exponential backoff
3. Add randomization to delays

### Login Issues
For login:
1. Use `headless: false` to see the browser
2. Manually log in when prompted
3. Tool will continue after detecting login

## Privacy & Security

- ✅ All scraping happens locally
- ✅ No data sent to external servers
- ✅ Uses your existing ChatGPT session
- ✅ Can be run offline after initial page load
- ⚠️ ChatGPT session cookies are used (standard browser behavior)

## Next Steps

1. Choose your implementation option
2. Implement the scraping logic
3. Test with a few conversations
4. Handle edge cases (long conversations, images, etc.)
5. Add error recovery and retry logic

## Contributing

If you implement this feature, please consider contributing it back to the main project!
