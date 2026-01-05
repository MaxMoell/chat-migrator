/**
 * Types for Playwright-based ChatGPT scraping
 */

export interface ScraperConfig {
  headless?: boolean;
  waitForLogin?: boolean;
  maxConversations?: number;
  delay?: number; // Delay between requests to avoid rate limiting
}

export interface ScraperProgress {
  phase: 'initializing' | 'logging-in' | 'loading-chats' | 'scraping' | 'processing' | 'completed' | 'error';
  conversationsFound: number;
  conversationsScraped: number;
  currentConversation?: string;
  error?: string;
}

export interface ScrapedMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  codeBlocks?: Array<{
    language: string;
    code: string;
  }>;
}

export interface ScrapedConversation {
  id: string;
  title: string;
  url: string;
  messages: ScrapedMessage[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ScrapeResult {
  success: boolean;
  conversations: ScrapedConversation[];
  error?: string;
  statistics: {
    totalConversations: number;
    totalMessages: number;
    duration: number; // in milliseconds
  };
}
