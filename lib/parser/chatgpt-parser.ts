/**
 * ChatGPT Parser
 * Parses ChatGPT export JSON and converts graph structure to linear conversations
 */

import type {
  ChatGPTExport,
  Conversation,
  MessageNode,
  Message,
  ProcessedConversation,
  ProcessedMessage,
  ProcessedBranch,
  ConversationMetadata,
  CodeBlock,
} from '@/types/chatgpt';

/**
 * Parse ChatGPT export JSON file
 */
export function parseExport(jsonContent: string): ChatGPTExport {
  try {
    const data = JSON.parse(jsonContent);

    // Validate basic structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid JSON structure');
    }

    // Handle different export formats
    if (Array.isArray(data)) {
      // Direct array of conversations
      return { conversations: data };
    } else if (data.conversations && Array.isArray(data.conversations)) {
      // Wrapped in conversations property
      return data as ChatGPTExport;
    } else {
      throw new Error('No conversations array found in export');
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON file: ' + error.message);
    }
    throw error;
  }
}

/**
 * Process all conversations from export
 */
export function processConversations(
  chatGPTExport: ChatGPTExport
): ProcessedConversation[] {
  return chatGPTExport.conversations
    .map(conversation => {
      try {
        return processConversation(conversation);
      } catch (error) {
        console.error(`Failed to process conversation ${conversation.id}:`, error);
        return null;
      }
    })
    .filter((conv): conv is ProcessedConversation => conv !== null);
}

/**
 * Process a single conversation
 */
export function processConversation(
  conversation: Conversation
): ProcessedConversation {
  const { id, title, create_time, update_time, mapping, current_node } = conversation;

  // Find the main conversation thread
  const mainThread = extractMainThread(mapping, current_node);

  // Extract all branches (alternative regenerations)
  const branches = extractBranches(mapping, mainThread);

  // Generate metadata
  const metadata = generateMetadata(mainThread, branches);

  return {
    id,
    title: title || 'Untitled Conversation',
    created: new Date(create_time * 1000),
    updated: new Date(update_time * 1000),
    messageCount: mainThread.length,
    messages: mainThread,
    branches: branches.length > 0 ? branches : undefined,
    metadata,
  };
}

/**
 * Extract the main conversation thread from the graph structure
 */
function extractMainThread(
  mapping: Record<string, MessageNode>,
  currentNode: string | null
): ProcessedMessage[] {
  const messages: ProcessedMessage[] = [];
  const nodes = Object.values(mapping);

  // Find the root node (node with no parent)
  let node = nodes.find(n => n.parent === null);

  if (!node) {
    // Fallback: use current_node if available
    if (currentNode && mapping[currentNode]) {
      node = mapping[currentNode];
      // Walk back to root
      while (node.parent && mapping[node.parent]) {
        node = mapping[node.parent];
      }
    } else {
      // Last resort: use first node
      node = nodes[0];
    }
  }

  // Traverse the main branch (first child path)
  const visited = new Set<string>();

  while (node) {
    // Prevent infinite loops
    if (visited.has(node.id)) {
      break;
    }
    visited.add(node.id);

    // Process the message if it exists
    if (node.message) {
      const processedMessage = processMessage(node.message);
      if (processedMessage) {
        messages.push(processedMessage);
      }
    }

    // Follow the first child (main branch)
    if (node.children && node.children.length > 0) {
      const nextNodeId: string = node.children[0];
      node = mapping[nextNodeId];
    } else {
      break;
    }
  }

  return messages;
}

/**
 * Extract alternative branches (regenerations)
 */
function extractBranches(
  mapping: Record<string, MessageNode>,
  mainThread: ProcessedMessage[]
): ProcessedBranch[] {
  const branches: ProcessedBranch[] = [];
  const mainThreadIds = new Set(mainThread.map(m => m.id));

  // Find nodes with multiple children (branch points)
  Object.values(mapping).forEach(node => {
    if (node.children && node.children.length > 1) {
      // Skip the first child (that's the main thread)
      node.children.slice(1).forEach(childId => {
        const branchMessages = extractBranchThread(mapping, childId, mainThreadIds);
        if (branchMessages.length > 0) {
          branches.push({
            id: childId,
            parentMessageId: node.id,
            messages: branchMessages,
          });
        }
      });
    }
  });

  return branches;
}

/**
 * Extract a single branch thread
 */
function extractBranchThread(
  mapping: Record<string, MessageNode>,
  startNodeId: string,
  mainThreadIds: Set<string>
): ProcessedMessage[] {
  const messages: ProcessedMessage[] = [];
  let node = mapping[startNodeId];
  const visited = new Set<string>();

  while (node && !mainThreadIds.has(node.id)) {
    if (visited.has(node.id)) break;
    visited.add(node.id);

    if (node.message) {
      const processedMessage = processMessage(node.message);
      if (processedMessage) {
        messages.push(processedMessage);
      }
    }

    if (node.children && node.children.length > 0) {
      node = mapping[node.children[0]];
    } else {
      break;
    }
  }

  return messages;
}

/**
 * Process a single message
 */
function processMessage(message: Message): ProcessedMessage | null {
  const { id, author, create_time, content } = message;

  // Skip system messages or messages without content
  if (!content || author.role === 'system') {
    return null;
  }

  // Extract text content
  const textContent = extractTextContent(content);
  if (!textContent) {
    return null;
  }

  // Extract code blocks
  const codeBlocks = extractCodeBlocks(textContent);

  // Build processed message
  const processed: ProcessedMessage = {
    id,
    role: author.role === 'tool' ? 'assistant' : author.role,
    content: textContent,
    timestamp: create_time ? new Date(create_time * 1000) : new Date(),
    contentType: content.content_type,
    metadata: {
      model: message.metadata.model_slug,
      citations: message.metadata.citations,
      codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined,
    },
  };

  return processed;
}

/**
 * Extract text content from various content types
 */
function extractTextContent(content: any): string {
  // Handle different content structures
  if (content.parts && Array.isArray(content.parts)) {
    return content.parts.filter((p: any) => typeof p === 'string').join('\n');
  }

  if (content.text && typeof content.text === 'string') {
    return content.text;
  }

  if (content.result && typeof content.result === 'string') {
    return content.result;
  }

  if (typeof content === 'string') {
    return content;
  }

  return '';
}

/**
 * Extract code blocks from message content
 */
function extractCodeBlocks(content: string): CodeBlock[] {
  const codeBlocks: CodeBlock[] = [];
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    codeBlocks.push({
      language: match[1] || 'plaintext',
      code: match[2].trim(),
    });
  }

  return codeBlocks;
}

/**
 * Generate conversation metadata
 */
function generateMetadata(
  messages: ProcessedMessage[],
  branches: ProcessedBranch[]
): ConversationMetadata {
  const userMessages = messages.filter(m => m.role === 'user').length;
  const assistantMessages = messages.filter(m => m.role === 'assistant').length;

  const hasCode = messages.some(m =>
    m.metadata?.codeBlocks && m.metadata.codeBlocks.length > 0
  );

  const hasImages = messages.some(m =>
    m.contentType === 'multimodal_text' || m.metadata?.images
  );

  const models = Array.from(
    new Set(
      messages
        .map(m => m.metadata?.model)
        .filter((m): m is string => Boolean(m))
    )
  );

  return {
    totalMessages: messages.length,
    userMessages,
    assistantMessages,
    hasCode,
    hasImages,
    hasBranches: branches.length > 0,
    models,
  };
}

/**
 * Get conversation summary statistics
 */
export function getExportStats(conversations: ProcessedConversation[]) {
  const totalConversations = conversations.length;
  const totalMessages = conversations.reduce((sum, c) => sum + c.messageCount, 0);
  const conversationsWithCode = conversations.filter(c => c.metadata.hasCode).length;
  const conversationsWithBranches = conversations.filter(c => c.metadata.hasBranches).length;

  const dateRange = conversations.length > 0 ? {
    earliest: new Date(Math.min(...conversations.map(c => c.created.getTime()))),
    latest: new Date(Math.max(...conversations.map(c => c.updated.getTime()))),
  } : null;

  return {
    totalConversations,
    totalMessages,
    conversationsWithCode,
    conversationsWithBranches,
    dateRange,
  };
}
