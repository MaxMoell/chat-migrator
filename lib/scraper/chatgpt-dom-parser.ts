/**
 * ChatGPT DOM Parser
 * Extracts conversation data from ChatGPT's HTML structure
 */

import type { ScrapedMessage, ScrapedConversation } from '@/types/scraper';

/**
 * Parse a conversation from ChatGPT's DOM
 * This function runs in the browser context
 */
export function parseConversationFromDOM(): ScrapedConversation | null {
  try {
    // Extract conversation ID from URL
    const url = window.location.href;
    const idMatch = url.match(/\/c\/([a-f0-9-]+)/);
    const id = idMatch ? idMatch[1] : crypto.randomUUID();

    // Get conversation title
    const titleElement = document.querySelector('title');
    let title = titleElement?.textContent?.trim() || 'Untitled Conversation';

    // Remove " | ChatGPT" suffix if present
    if (title.endsWith(' | ChatGPT')) {
      title = title.slice(0, -10).trim();
    }

    // Find all message groups
    const messages: ScrapedMessage[] = [];

    // ChatGPT uses different selectors, we try multiple approaches
    const messageSelectors = [
      '[data-message-author-role]',
      '.group.w-full',
      'article[class*="group"]',
      '[class*="text-base"]'
    ];

    let messageElements: Element[] = [];
    for (const selector of messageSelectors) {
      const elements = Array.from(document.querySelectorAll(selector));
      if (elements.length > 0) {
        messageElements = elements;
        break;
      }
    }

    // Parse each message
    messageElements.forEach((element) => {
      try {
        // Determine role
        let role: 'user' | 'assistant' | 'system' = 'user';

        // Check data attribute
        const roleAttr = element.getAttribute('data-message-author-role');
        if (roleAttr === 'assistant') {
          role = 'assistant';
        } else if (roleAttr === 'user') {
          role = 'user';
        } else {
          // Fallback: check if element contains assistant indicators
          const isAssistant = element.querySelector('[class*="assistant"]') !== null ||
                            element.querySelector('[alt*="ChatGPT"]') !== null ||
                            element.innerHTML.includes('ChatGPT');
          role = isAssistant ? 'assistant' : 'user';
        }

        // Extract text content
        // Look for the main content container
        let contentElement = element.querySelector('[class*="markdown"]') ||
                           element.querySelector('.prose') ||
                           element.querySelector('[class*="text-base"]') ||
                           element;

        let content = '';

        // Get text while preserving code blocks
        const codeBlocks: Array<{ language: string; code: string }> = [];
        const preElements = contentElement.querySelectorAll('pre');

        preElements.forEach((pre, index) => {
          const codeElement = pre.querySelector('code');
          if (codeElement) {
            const code = codeElement.textContent || '';
            const languageClass = codeElement.className.match(/language-(\w+)/);
            const language = languageClass ? languageClass[1] : 'plaintext';

            codeBlocks.push({ language, code });

            // Replace with placeholder
            const placeholder = `___CODE_BLOCK_${index}___`;
            pre.setAttribute('data-placeholder', placeholder);
          }
        });

        // Get text content
        content = contentElement.textContent?.trim() || '';

        // Clean up and reconstruct with markdown code blocks
        codeBlocks.forEach((block, index) => {
          const placeholder = `___CODE_BLOCK_${index}___`;
          const markdown = `\n\`\`\`${block.language}\n${block.code}\n\`\`\`\n`;
          content = content.replace(placeholder, markdown);
        });

        if (content) {
          messages.push({
            role,
            content: content.trim(),
            codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
          });
        }
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    });

    if (messages.length === 0) {
      return null;
    }

    return {
      id,
      title,
      url,
      messages,
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error parsing conversation:', error);
    return null;
  }
}

/**
 * Get all conversation links from sidebar
 * This function runs in the browser context
 */
export function getConversationLinks(): Array<{ id: string; title: string; url: string }> {
  const conversations: Array<{ id: string; title: string; url: string }> = [];

  try {
    // ChatGPT sidebar selectors
    const linkSelectors = [
      'nav a[href^="/c/"]',
      '[class*="sidebar"] a[href^="/c/"]',
      'aside a[href^="/c/"]'
    ];

    let links: Element[] = [];
    for (const selector of linkSelectors) {
      const elements = Array.from(document.querySelectorAll(selector));
      if (elements.length > 0) {
        links = elements;
        break;
      }
    }

    links.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;

      const idMatch = href.match(/\/c\/([a-f0-9-]+)/);
      if (!idMatch) return;

      const id = idMatch[1];
      const title = link.textContent?.trim() || 'Untitled';
      const url = href.startsWith('http') ? href : `https://chat.openai.com${href}`;

      conversations.push({ id, title, url });
    });

    // Remove duplicates
    const seen = new Set<string>();
    return conversations.filter(conv => {
      if (seen.has(conv.id)) return false;
      seen.add(conv.id);
      return true;
    });
  } catch (error) {
    console.error('Error getting conversation links:', error);
    return [];
  }
}

/**
 * Scroll to load all conversations in sidebar
 * This function runs in the browser context
 */
export async function scrollToLoadAll(): Promise<void> {
  const sidebar = document.querySelector('nav') ||
                 document.querySelector('[class*="sidebar"]') ||
                 document.querySelector('aside');

  if (!sidebar) {
    console.warn('Could not find sidebar element');
    return;
  }

  let previousHeight = 0;
  let currentHeight = sidebar.scrollHeight;
  let attempts = 0;
  const maxAttempts = 50; // Prevent infinite loop

  while (currentHeight > previousHeight && attempts < maxAttempts) {
    previousHeight = currentHeight;

    // Scroll to bottom
    sidebar.scrollTo(0, sidebar.scrollHeight);

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 500));

    currentHeight = sidebar.scrollHeight;
    attempts++;
  }
}
