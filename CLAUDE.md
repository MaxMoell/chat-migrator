# CLAUDE.md - Project Documentation for AI Assistants

> **Purpose:** This document provides a comprehensive overview of the Chat Migrator project for AI assistants (like Claude) to quickly understand the codebase structure, functionality, and development status.

**Last Updated:** 2026-01-06

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Vision & Goals](#vision--goals)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Core Functionality](#core-functionality)
6. [Implementation Status](#implementation-status)
7. [Missing Features & Gaps](#missing-features--gaps)
8. [Data Flow](#data-flow)
9. [Type System](#type-system)
10. [Development Guide](#development-guide)
11. [Known Issues & Limitations](#known-issues--limitations)

---

## Project Overview

**Chat Migrator** is a Next.js web application that enables users to migrate their ChatGPT conversations to Claude. It provides both manual (JSON upload) and automated (Playwright scraping) methods for extracting conversations and converting them to Claude-compatible Markdown format.

**Key Features:**
- Privacy-first: All processing happens locally in the browser
- Multiple extraction methods: JSON upload or automated scraping
- Smart parsing: Handles ChatGPT's complex graph structure (branches, regenerations)
- Rich export: Preserves code blocks, timestamps, model info, and citations
- Bulk operations: Process hundreds of conversations efficiently

---

## Vision & Goals

### Current State (v1.0)
A functional tool for one-time migration of ChatGPT conversations to Claude via downloadable Markdown files.

### Ultimate Vision
A **universal AI conversation hub** that enables seamless, bidirectional synchronization between multiple AI platforms:
- ChatGPT ↔ Claude
- Gemini ↔ Claude
- Perplexity ↔ Claude
- Multi-platform ecosystem integration

Users should be able to start a conversation on any platform and continue it on another, leveraging the strengths of each AI assistant.

---

## Tech Stack

### Frontend
- **Framework:** Next.js 16 (App Router)
- **React:** v19.2.3
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Date Formatting:** date-fns v4.1.0

### Processing
- **ZIP Creation:** JSZip v3.10.1
- **Browser Automation:** Playwright v1.57.0 (for auto-scrape)

### Deployment
- **Runtime:** Node.js 18+
- **Rendering:** Client-side + Server-side (API routes)
- **Storage:** Browser localStorage (settings only)

---

## Project Structure

```
chat-migrator/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Main migration page
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   ├── settings/
│   │   └── page.tsx              # Settings page (API keys)
│   └── api/
│       └── scrape/
│           └── route.ts          # Playwright scraping endpoint
│
├── components/ui/                # React components
│   ├── FileUpload.tsx            # Drag & drop file upload
│   ├── ConversationList.tsx      # Conversation browser with filters
│   ├── ExportButton.tsx          # Export with progress tracking
│   ├── StatsCard.tsx             # Statistics display
│   └── AutoScrapeButton.tsx      # Auto-scrape trigger & progress
│
├── lib/                          # Core business logic
│   ├── parser/
│   │   ├── index.ts              # Re-exports
│   │   └── chatgpt-parser.ts    # Parse ChatGPT JSON format
│   ├── converter/
│   │   ├── index.ts              # Re-exports
│   │   └── markdown-converter.ts # Convert to Markdown
│   ├── exporter/
│   │   ├── index.ts              # Re-exports
│   │   └── zip-exporter.ts      # Create ZIP archives
│   ├── scraper/
│   │   ├── index.ts              # Re-exports
│   │   ├── browser-scraper.ts   # API client for scraping
│   │   ├── chatgpt-scraper.ts   # Scraper helpers
│   │   └── ...                  # (Additional scraper modules)
│   ├── storage/
│   │   └── local-storage.ts     # LocalStorage helpers
│   └── utils/
│       ├── index.ts              # Re-exports
│       └── file-helpers.ts      # File validation & reading
│
├── types/                        # TypeScript definitions
│   ├── chatgpt.ts                # ChatGPT data structures
│   ├── api.ts                    # API configuration types
│   └── scraper.ts                # Scraper types
│
├── public/                       # Static assets
├── node_modules/                 # Dependencies
│
├── README.md                     # User-facing documentation
├── QUICKSTART.md                 # Quick start guide
├── PLAYWRIGHT_SETUP.md           # Playwright installation guide
├── CLAUDE.md                     # This file (AI assistant guide)
│
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind configuration
├── next.config.ts                # Next.js configuration
└── eslint.config.mjs             # ESLint configuration
```

---

## Core Functionality

### 1. ChatGPT JSON Parsing (`lib/parser/chatgpt-parser.ts`)

**Purpose:** Parse ChatGPT's complex graph-based conversation structure.

**Key Functions:**
- `parseExport(jsonContent: string)` - Parse and validate JSON
- `processConversations(export)` - Process all conversations
- `processConversation(conversation)` - Process single conversation
- `extractMainThread(mapping, currentNode)` - Extract main conversation path
- `extractBranches(mapping, mainThread)` - Extract alternative regenerations
- `processMessage(message)` - Process individual message

**How it works:**
1. ChatGPT stores conversations as a **graph** (nodes with parent-child relationships)
2. Parser traverses the graph to find the main conversation thread
3. Identifies branch points where messages were regenerated
4. Extracts all alternative branches separately
5. Handles edge cases: circular references, missing nodes, malformed data

**Supported Content Types:**
- `text` - Regular text messages
- `code` - Code execution
- `execution_output` - Code results
- `multimodal_text` - Text with images
- `tether_browsing_display` - Web browsing results
- `tether_quote` - Citations
- `system_error` - Error messages
- `model_editable_context` - System context

### 2. Markdown Conversion (`lib/converter/markdown-converter.ts`)

**Purpose:** Convert parsed conversations to Claude-compatible Markdown.

**Key Functions:**
- `convertToMarkdown(conversation, options)` - Convert single conversation
- `convertMultipleToMarkdown(conversations)` - Batch conversion
- `generateFilename(conversation)` - Create safe filenames
- `generateIndexMarkdown(conversations)` - Create index/README

**Output Format:**
```markdown
# Conversation Title

---

**Conversation ID:** `abc123...`
**Created:** January 1, 2024 at 10:00 AM
**Updated:** January 2, 2024 at 3:30 PM
**Messages:** 42
**Models:** gpt-4, gpt-3.5-turbo
**Contains Code:** Yes
**Has Branches:** Yes (see end of document)

---

## Main Conversation

### 👤 User (January 1, 2024 at 10:00 AM)

How do I implement a binary search tree in Python?

### 🤖 Assistant (January 1, 2024 at 10:01 AM)

Here's an implementation of a binary search tree:

\`\`\`python
class Node:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None
\`\`\`

*Model: gpt-4*

---

## Alternative Branches

### 🔀 Branch 1

*Alternative path from message: `xyz789`*

[Alternative messages here...]
```

### 3. ZIP Export (`lib/exporter/zip-exporter.ts`)

**Purpose:** Package multiple Markdown files into a downloadable ZIP archive.

**Key Functions:**
- `exportConversationsAsZip(conversations, options)` - Create ZIP
- Includes individual conversation files
- Generates index.md with conversation list and statistics
- Returns blob for download

### 4. Auto-Scrape (`app/api/scrape/route.ts`)

**Purpose:** Automatically extract conversations directly from ChatGPT using Playwright.

**How it works:**
1. Launch Chromium browser (headless: false for user login)
2. Navigate to `https://chat.openai.com`
3. Wait for user to log in (detects conversation links in sidebar)
4. Scroll sidebar to load all conversations
5. Extract conversation metadata (ID, title, URL)
6. Visit each conversation and extract messages via DOM parsing
7. Return scraped data as JSON

**Limitations:**
- Requires user to log in manually
- Can be slow for many conversations
- Fragile to ChatGPT UI changes
- No resume capability (if it fails, start over)
- No selective scraping (all or nothing)

### 5. Settings & Storage (`lib/storage/local-storage.ts`)

**Purpose:** Store API keys locally in browser.

**Security Note:** Uses basic base64 encoding (NOT encryption, just obfuscation).

**Functions:**
- `saveConfig(config)` - Save to localStorage
- `loadConfig()` - Load from localStorage
- `clearConfig()` - Clear all settings
- `hasConfig()` - Check if config exists

---

## Implementation Status

### ✅ Fully Implemented

**Core Features:**
- [x] ChatGPT JSON parsing (all content types, branches, metadata)
- [x] Markdown conversion with full formatting
- [x] ZIP export with index generation
- [x] File upload UI with drag & drop
- [x] Conversation list with filtering & search
- [x] Bulk selection & export
- [x] Statistics dashboard
- [x] Dark mode support
- [x] Auto-scrape with Playwright
- [x] Settings page UI
- [x] Local storage for API keys
- [x] Error handling & validation
- [x] TypeScript types for all data structures

**Documentation:**
- [x] README.md (user guide)
- [x] PLAYWRIGHT_SETUP.md (setup guide)
- [x] QUICKSTART.md (quick start)
- [x] CLAUDE.md (this file)

### 🚧 Partially Implemented

**Settings Page:**
- ✅ UI for entering API keys
- ✅ Local storage of keys
- ❌ No actual API integration (keys are stored but not used)
- ❌ No API connection testing
- ❌ No key validation

**Auto-Scrape:**
- ✅ Basic scraping functionality
- ✅ Progress tracking
- ❌ No retry logic
- ❌ No selective scraping
- ❌ No resume capability
- ❌ No rate limiting
- ❌ Fragile to UI changes

### ❌ Not Implemented (Roadmap)

**Phase 2 - Automation:**
- [ ] ChatGPT API integration (blocked: OpenAI doesn't provide export API)
- [ ] Claude/Anthropic API integration (blocked: waiting for Projects API)
- [ ] One-click migration workflow
- [ ] Interactive tutorial/onboarding
- [ ] API connection status indicators
- [ ] Automatic sync scheduling

**Phase 3 - Advanced Features:**
- [ ] Image embedding support (types exist, no implementation)
- [ ] Bi-directional migration (Claude → ChatGPT)
- [ ] Support for other platforms (Gemini, Perplexity, etc.)
- [ ] Conversation analytics & insights
- [ ] Custom export templates
- [ ] Scheduled automatic backups
- [ ] Migration history tracking
- [ ] Conversation search across exports

**Technical Gaps:**
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] CI/CD pipeline
- [ ] Deployment configuration (Vercel, etc.)
- [ ] Error monitoring (Sentry, etc.)
- [ ] Performance monitoring
- [ ] User authentication
- [ ] Backend database
- [ ] API documentation

---

## Missing Features & Gaps

### Critical Gaps

1. **No API Integration Logic**
   - Settings page UI exists but API keys aren't used anywhere
   - Need to implement ChatGPT API client (when available)
   - Need to implement Claude API client (when Projects API available)

2. **No Testing**
   - Zero unit tests
   - Zero integration tests
   - Zero E2E tests
   - High risk of regressions

3. **Security Issues**
   - API keys stored with base64 (not encryption)
   - No secure key management
   - No HTTPS enforcement
   - No CSP headers

4. **Limited Error Handling**
   - Parser crashes on some edge cases
   - Scraper doesn't handle network failures
   - No error recovery mechanisms

### Feature Gaps

1. **Image Support**
   - Types defined but not implemented
   - ChatGPT exports don't include image data (URLs only)
   - Need to decide: embed as base64 or reference URLs?

2. **Bi-directional Sync**
   - Only ChatGPT → Claude currently
   - Need Claude export format parser
   - Need bidirectional conversion logic

3. **Multi-Platform Support**
   - Only ChatGPT currently
   - Need parsers for Gemini, Perplexity, etc.
   - Need to abstract platform-specific logic

4. **Analytics**
   - No insights on conversation content
   - No statistics on usage patterns
   - No visualization of conversation history

### UX Gaps

1. **No Onboarding**
   - New users don't know where to start
   - No tutorial or guided flow
   - No tooltips or help text

2. **Limited Feedback**
   - Progress bars only during export
   - No detailed error messages
   - No success confirmations

3. **No Search**
   - Can't search within conversations before export
   - Can't filter by content type
   - Can't sort by various criteria

---

## Data Flow

### Manual Upload Flow

```
1. User uploads conversations.json
   ↓
2. FileUpload component reads file
   ↓
3. validateChatGPTExport() validates structure
   ↓
4. parseExport() parses JSON
   ↓
5. processConversations() processes all conversations
   ├─ extractMainThread() - gets main conversation
   ├─ extractBranches() - gets alternative paths
   └─ generateMetadata() - creates metadata
   ↓
6. State updated with ProcessedConversation[]
   ↓
7. ConversationList displays conversations
   ↓
8. User selects conversations to export
   ↓
9. ExportButton triggers conversion
   ├─ convertToMarkdown() for each conversation
   ├─ generateIndexMarkdown() for index
   └─ exportConversationsAsZip() creates ZIP
   ↓
10. Browser downloads ZIP file
```

### Auto-Scrape Flow

```
1. User clicks "Auto-Scrape from ChatGPT"
   ↓
2. AutoScrapeButton shows instructions
   ↓
3. User confirms start
   ↓
4. POST /api/scrape triggered
   ↓
5. Server launches Playwright browser
   ├─ Navigate to chat.openai.com
   ├─ Wait for user login
   ├─ Scroll sidebar to load conversations
   ├─ Extract conversation metadata
   └─ Visit each conversation and scrape
   ↓
6. Server returns ScrapedConversation[]
   ↓
7. convertScrapedToProcessed() converts to standard format
   ↓
8. State updated with ProcessedConversation[]
   ↓
9. [Same as steps 7-10 in manual flow]
```

### Settings Flow (Planned)

```
1. User enters API keys in Settings page
   ↓
2. saveConfig() stores in localStorage (base64)
   ↓
3. [MISSING] Validate API keys
   ↓
4. [MISSING] Test API connection
   ↓
5. [MISSING] Use keys for automated export/upload
```

---

## Type System

### Core Types (`types/chatgpt.ts`)

```typescript
// ChatGPT Export Structure
interface ChatGPTExport {
  conversations: Conversation[];
}

interface Conversation {
  id: string;
  title: string;
  create_time: number;
  update_time: number;
  mapping: Record<string, MessageNode>;  // Graph structure
  current_node: string | null;
  // ... other fields
}

interface MessageNode {
  id: string;
  message: Message | null;
  parent: string | null;  // Parent node ID
  children: string[];     // Child node IDs
}

// Processed (Linear) Structure
interface ProcessedConversation {
  id: string;
  title: string;
  created: Date;
  updated: Date;
  messageCount: number;
  messages: ProcessedMessage[];      // Main thread
  branches?: ProcessedBranch[];      // Alternative paths
  metadata: ConversationMetadata;
}

interface ProcessedMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  contentType: ContentType;
  metadata?: {
    model?: string;
    citations?: Citation[];
    codeBlocks?: CodeBlock[];
    images?: string[];
  };
}
```

### API Types (`types/api.ts`)

```typescript
interface APIConfig {
  chatgpt?: ChatGPTConfig;
  claude?: ClaudeConfig;
}

interface ChatGPTConfig {
  apiKey: string;
  enabled: boolean;
  lastSync?: Date;
}

interface ClaudeConfig {
  apiKey: string;
  organizationId?: string;
  projectId?: string;
  enabled: boolean;
  lastSync?: Date;
}
```

### Scraper Types (`types/scraper.ts`)

```typescript
interface ScraperProgress {
  phase: 'initializing' | 'logging-in' | 'loading-chats' | 'scraping' | 'processing' | 'completed' | 'error';
  conversationsFound: number;
  conversationsScraped: number;
  currentConversation?: string;
  error?: string;
}

interface ScrapedConversation {
  id: string;
  title: string;
  url: string;
  messages: ScrapedMessage[];
  createdAt?: Date;
  updatedAt?: Date;
}
```

---

## Development Guide

### Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Key Files to Modify

**Adding a new export format:**
1. Create new converter in `lib/converter/`
2. Add format option to `MarkdownOptions` type
3. Update `ExportButton` to support new format

**Adding a new platform:**
1. Create parser in `lib/parser/[platform]-parser.ts`
2. Define types in `types/[platform].ts`
3. Update `FileUpload` to accept new format
4. Add conversion logic to common `ProcessedConversation` format

**Adding API integration:**
1. Create API client in `lib/api/[platform]-client.ts`
2. Add API route in `app/api/[endpoint]/route.ts`
3. Update `settings/page.tsx` to use API keys
4. Implement export/upload logic

### Conventions

**File naming:**
- Components: PascalCase (`FileUpload.tsx`)
- Utilities: kebab-case (`chatgpt-parser.ts`)
- Types: kebab-case (`chatgpt.ts`)

**Code style:**
- Use TypeScript strict mode
- Prefer functional components
- Use `const` over `let`
- Export types separately from values

**Git workflow:**
- Main branch: `main`
- Feature branches: `feature/[name]`
- Bug fixes: `fix/[name]`

---

## Known Issues & Limitations

### ChatGPT Parser

1. **Image URLs only:** Images aren't embedded, only URLs are stored
2. **Code execution limited:** May not capture all execution output
3. **Citation formatting:** Some citation formats not fully supported
4. **Large conversations:** Very large conversations (1000+ messages) may be slow

### Auto-Scrape

1. **Login required:** User must log in manually every time
2. **UI changes:** Breaks if ChatGPT changes their DOM structure
3. **Rate limiting:** No delays between requests, may trigger rate limits
4. **No resume:** If scrape fails, must start from beginning
5. **All or nothing:** Can't select which conversations to scrape
6. **Slow:** Takes 1-2 seconds per conversation

### Settings

1. **Keys not used:** API keys are stored but not actually used anywhere
2. **No validation:** Keys aren't validated or tested
3. **Insecure storage:** Base64 encoding is not encryption
4. **No key rotation:** Can't rotate or update keys easily

### Export

1. **No image embedding:** Images aren't embedded in Markdown
2. **Large files:** Very large exports may crash the browser
3. **No progress save:** Can't pause and resume exports
4. **Fixed format:** Can't customize Markdown format

### General

1. **No tests:** Zero test coverage
2. **No error tracking:** No Sentry or error monitoring
3. **No analytics:** Can't track usage or errors
4. **No deployment:** No production deployment configured
5. **Single user:** No authentication or multi-user support

---

## Quick Reference

### Important Entry Points

- **Main Page:** `app/page.tsx` - Upload and export UI
- **Settings:** `app/settings/page.tsx` - API key configuration
- **Scrape API:** `app/api/scrape/route.ts` - Playwright automation
- **Parser:** `lib/parser/chatgpt-parser.ts` - Core parsing logic
- **Converter:** `lib/converter/markdown-converter.ts` - Markdown generation

### Key State Management

The app uses React `useState` for state management:
- `conversations: ProcessedConversation[]` - Loaded conversations
- `selectedIds: Set<string>` - Selected conversation IDs
- `error: string | null` - Current error message
- `fileName: string | null` - Uploaded file name

### External Dependencies

- **Next.js:** Framework and routing
- **React:** UI library
- **date-fns:** Date formatting
- **JSZip:** ZIP file creation
- **Playwright:** Browser automation
- **Tailwind CSS:** Styling

### API Endpoints

- `POST /api/scrape` - Scrape conversations with Playwright
  - Request: `{ maxConversations?: number }`
  - Response: `{ success: boolean, conversations: ScrapedConversation[], statistics: {...} }`

---

## Future Development Priorities

### High Priority

1. **Implement API Integration**
   - ChatGPT API client (when available)
   - Claude Projects API client (when available)
   - Automatic upload/download functionality

2. **Add Testing**
   - Unit tests for parser and converter
   - Integration tests for API routes
   - E2E tests with Playwright

3. **Improve Security**
   - Proper encryption for API keys
   - Secure key storage
   - HTTPS enforcement

### Medium Priority

1. **Enhance Auto-Scrape**
   - Add retry logic
   - Selective scraping
   - Resume capability
   - Better error handling

2. **Add Onboarding**
   - First-run tutorial
   - Help tooltips
   - Documentation links

3. **Improve UX**
   - Better progress indicators
   - More detailed error messages
   - Search and filter improvements

### Low Priority

1. **Multi-Platform Support**
   - Gemini parser
   - Perplexity parser
   - Bi-directional sync

2. **Analytics**
   - Conversation insights
   - Usage statistics
   - Export history

3. **Advanced Features**
   - Custom templates
   - Scheduled backups
   - Image embedding

---

## Contact & Contributing

This is an open-source project aimed at helping users maintain their AI conversation history.

**Repository:** (GitHub URL here)
**Issues:** (GitHub Issues URL here)
**License:** MIT

When contributing:
1. Read this document thoroughly
2. Check existing issues
3. Create feature branch
4. Write tests (when test infrastructure exists)
5. Submit PR with clear description

---

**Document Version:** 1.0.0
**Last Updated:** 2026-01-06
**Project Version:** 0.1.0
