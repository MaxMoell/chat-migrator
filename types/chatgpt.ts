/**
 * TypeScript types for ChatGPT Export Format
 * Complete type definitions including all content types and edge cases
 */

export interface ChatGPTExport {
  conversations: Conversation[];
}

export interface Conversation {
  id: string;
  title: string;
  create_time: number;
  update_time: number;
  mapping: Record<string, MessageNode>;
  moderation_results: unknown[];
  current_node: string | null;
  plugin_ids: string[] | null;
  conversation_id: string;
  conversation_template_id: string | null;
  gizmo_id: string | null;
  is_archived: boolean;
  safe_urls: string[];
}

export interface MessageNode {
  id: string;
  message: Message | null;
  parent: string | null;
  children: string[];
}

export interface Message {
  id: string;
  author: Author;
  create_time: number | null;
  update_time: number | null;
  content: Content;
  status: string;
  end_turn: boolean | null;
  weight: number;
  metadata: MessageMetadata;
  recipient: string;
}

export interface Author {
  role: 'user' | 'assistant' | 'system' | 'tool';
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface Content {
  content_type: ContentType;
  parts?: string[];
  text?: string;
  result?: string;
  language?: string;
  asset_pointer?: string;
  metadata?: Record<string, unknown>;
}

export type ContentType =
  | 'text'
  | 'code'
  | 'execution_output'
  | 'multimodal_text'
  | 'tether_browsing_display'
  | 'tether_quote'
  | 'system_error'
  | 'model_editable_context';

export interface MessageMetadata {
  finish_details?: {
    type?: string;
    stop_tokens?: number[];
  };
  citations?: Citation[];
  content_references?: ContentReference[];
  gizmo_id?: string;
  is_complete?: boolean;
  model_slug?: string;
  pad?: string;
  parent_id?: string;
  timestamp_?: string;
  [key: string]: unknown;
}

export interface Citation {
  start_ix: number;
  end_ix: number;
  citation_format_type: string;
  metadata?: Record<string, unknown>;
}

export interface ContentReference {
  content_reference_id: string;
  content_type: string;
  title?: string;
  url?: string;
}

/**
 * Processed conversation with linear message thread
 */
export interface ProcessedConversation {
  id: string;
  title: string;
  created: Date;
  updated: Date;
  messageCount: number;
  messages: ProcessedMessage[];
  branches?: ProcessedBranch[];
  metadata: ConversationMetadata;
}

export interface ProcessedMessage {
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

export interface CodeBlock {
  language: string;
  code: string;
  output?: string;
}

export interface ProcessedBranch {
  id: string;
  parentMessageId: string;
  messages: ProcessedMessage[];
}

export interface ConversationMetadata {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  hasCode: boolean;
  hasImages: boolean;
  hasBranches: boolean;
  models: string[];
}
