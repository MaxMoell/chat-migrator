/**
 * Markdown Converter
 * Converts ProcessedConversation to Claude-compatible Markdown format
 */

import { format } from 'date-fns';
import type { ProcessedConversation, ProcessedMessage, ProcessedBranch } from '@/types/chatgpt';

export interface MarkdownOptions {
  includeBranches?: boolean;
  includeMetadata?: boolean;
  includeTimestamps?: boolean;
  formatCodeBlocks?: boolean;
}

const DEFAULT_OPTIONS: MarkdownOptions = {
  includeBranches: true,
  includeMetadata: true,
  includeTimestamps: true,
  formatCodeBlocks: true,
};

/**
 * Convert a conversation to Markdown format
 */
export function convertToMarkdown(
  conversation: ProcessedConversation,
  options: MarkdownOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];

  // Add header with metadata
  lines.push('# ' + conversation.title);
  lines.push('');

  if (opts.includeMetadata) {
    lines.push('---');
    lines.push('');
    lines.push('**Conversation ID:** `' + conversation.id + '`');
    lines.push('**Created:** ' + format(conversation.created, 'PPpp'));
    lines.push('**Updated:** ' + format(conversation.updated, 'PPpp'));
    lines.push('**Messages:** ' + conversation.messageCount);

    if (conversation.metadata.models.length > 0) {
      lines.push('**Models:** ' + conversation.metadata.models.join(', '));
    }

    if (conversation.metadata.hasCode) {
      lines.push('**Contains Code:** Yes');
    }

    if (conversation.metadata.hasBranches) {
      lines.push('**Has Branches:** Yes (see end of document)');
    }

    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // Add main conversation thread
  lines.push('## Main Conversation');
  lines.push('');

  conversation.messages.forEach((message, index) => {
    lines.push(...formatMessage(message, index + 1, opts));
    lines.push('');
  });

  // Add branches if they exist and are requested
  if (opts.includeBranches && conversation.branches && conversation.branches.length > 0) {
    lines.push('---');
    lines.push('');
    lines.push('## Alternative Branches');
    lines.push('');
    lines.push('*The following are alternative regenerations that were not part of the main conversation thread.*');
    lines.push('');

    conversation.branches.forEach((branch, branchIndex) => {
      lines.push(...formatBranch(branch, branchIndex + 1, opts));
      lines.push('');
    });
  }

  return lines.join('\n');
}

/**
 * Format a single message
 */
function formatMessage(
  message: ProcessedMessage,
  messageNumber: number,
  options: MarkdownOptions
): string[] {
  const lines: string[] = [];

  // Message header
  const roleEmoji = getRoleEmoji(message.role);
  const roleLabel = message.role.charAt(0).toUpperCase() + message.role.slice(1);

  lines.push(`### ${roleEmoji} ${roleLabel} ${options.includeTimestamps ? `(${format(message.timestamp, 'PPpp')})` : ''}`);
  lines.push('');

  // Message content
  let content = message.content;

  // Format code blocks if requested and available
  if (options.formatCodeBlocks && message.metadata?.codeBlocks && message.metadata.codeBlocks.length > 0) {
    // Code blocks are already in markdown format in the content
    // Just ensure proper spacing
    content = content.trim();
  }

  lines.push(content);

  // Add citations if available
  if (message.metadata?.citations && message.metadata.citations.length > 0) {
    lines.push('');
    lines.push('*Citations: ' + message.metadata.citations.length + '*');
  }

  // Add model info if available
  if (message.metadata?.model && message.role === 'assistant') {
    lines.push('');
    lines.push('*Model: ' + message.metadata.model + '*');
  }

  return lines;
}

/**
 * Format a branch
 */
function formatBranch(
  branch: ProcessedBranch,
  branchNumber: number,
  options: MarkdownOptions
): string[] {
  const lines: string[] = [];

  lines.push(`### 🔀 Branch ${branchNumber}`);
  lines.push('');
  lines.push('*Alternative path from message: `' + branch.parentMessageId + '`*');
  lines.push('');

  branch.messages.forEach((message, index) => {
    lines.push(...formatMessage(message, index + 1, options));
    lines.push('');
  });

  return lines;
}

/**
 * Get emoji for role
 */
function getRoleEmoji(role: string): string {
  switch (role) {
    case 'user':
      return '👤';
    case 'assistant':
      return '🤖';
    case 'system':
      return '⚙️';
    default:
      return '💬';
  }
}

/**
 * Generate a safe filename from conversation title
 */
export function generateFilename(conversation: ProcessedConversation): string {
  const date = format(conversation.created, 'yyyy-MM-dd');
  const safeTitle = conversation.title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 50);

  return `${date}_${safeTitle}_${conversation.id.slice(0, 8)}.md`;
}

/**
 * Convert multiple conversations to markdown
 */
export function convertMultipleToMarkdown(
  conversations: ProcessedConversation[],
  options: MarkdownOptions = {}
): Map<string, string> {
  const results = new Map<string, string>();

  conversations.forEach(conversation => {
    const filename = generateFilename(conversation);
    const markdown = convertToMarkdown(conversation, options);
    results.set(filename, markdown);
  });

  return results;
}

/**
 * Generate an index/readme file for the export
 */
export function generateIndexMarkdown(conversations: ProcessedConversation[]): string {
  const lines: string[] = [];

  lines.push('# ChatGPT to Claude Export');
  lines.push('');
  lines.push('*Generated on ' + format(new Date(), 'PPpp') + '*');
  lines.push('');
  lines.push('---');
  lines.push('');

  // Summary statistics
  const totalMessages = conversations.reduce((sum, c) => sum + c.messageCount, 0);
  const withCode = conversations.filter(c => c.metadata.hasCode).length;
  const withBranches = conversations.filter(c => c.metadata.hasBranches).length;

  lines.push('## Summary');
  lines.push('');
  lines.push('- **Total Conversations:** ' + conversations.length);
  lines.push('- **Total Messages:** ' + totalMessages);
  lines.push('- **Conversations with Code:** ' + withCode);
  lines.push('- **Conversations with Branches:** ' + withBranches);
  lines.push('');

  // Date range
  if (conversations.length > 0) {
    const dates = conversations.map(c => c.created.getTime());
    const earliest = new Date(Math.min(...dates));
    const latest = new Date(Math.max(...dates));

    lines.push('**Date Range:** ' + format(earliest, 'PP') + ' to ' + format(latest, 'PP'));
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // Conversation list
  lines.push('## Conversations');
  lines.push('');

  // Sort by date (newest first)
  const sorted = [...conversations].sort(
    (a, b) => b.created.getTime() - a.created.getTime()
  );

  sorted.forEach((conv, index) => {
    const filename = generateFilename(conv);
    lines.push(`${index + 1}. **[${conv.title}](./${filename})** (${conv.messageCount} messages)`);
    lines.push(`   - Created: ${format(conv.created, 'PP')}`);

    if (conv.metadata.models.length > 0) {
      lines.push(`   - Models: ${conv.metadata.models.join(', ')}`);
    }

    const tags: string[] = [];
    if (conv.metadata.hasCode) tags.push('Code');
    if (conv.metadata.hasBranches) tags.push('Branches');
    if (conv.metadata.hasImages) tags.push('Images');

    if (tags.length > 0) {
      lines.push(`   - Tags: ${tags.join(', ')}`);
    }

    lines.push('');
  });

  lines.push('---');
  lines.push('');
  lines.push('## How to Use');
  lines.push('');
  lines.push('1. **Individual Conversations:** Open any `.md` file to view a specific conversation');
  lines.push('2. **Claude Projects:** Upload these files to a Claude Project for contextual access');
  lines.push('3. **Search:** Use your text editor\'s search to find specific topics across all conversations');
  lines.push('');
  lines.push('## Format Notes');
  lines.push('');
  lines.push('- Each conversation includes metadata, timestamps, and role indicators');
  lines.push('- Code blocks are preserved in markdown format');
  lines.push('- Alternative branches (regenerations) are included at the end of each file');
  lines.push('- Citations and model information are noted where available');
  lines.push('');

  return lines.join('\n');
}
