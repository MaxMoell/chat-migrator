/**
 * API Types and Interfaces
 * For ChatGPT and Claude API integrations
 */

export interface APIConfig {
  chatgpt?: ChatGPTConfig;
  claude?: ClaudeConfig;
}

export interface ChatGPTConfig {
  apiKey: string;
  enabled: boolean;
  lastSync?: Date;
}

export interface ClaudeConfig {
  apiKey: string;
  organizationId?: string;
  projectId?: string;
  enabled: boolean;
  lastSync?: Date;
}

export interface APIStatus {
  connected: boolean;
  lastChecked?: Date;
  error?: string;
}

export interface MigrationProgress {
  total: number;
  completed: number;
  failed: number;
  currentConversation?: string;
  status: 'idle' | 'exporting' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface ConversationMetadata {
  id: string;
  title: string;
  messageCount: number;
  created: Date;
  updated: Date;
}

// ChatGPT API Response Types
export interface ChatGPTConversation {
  id: string;
  title: string;
  create_time: number;
  update_time: number;
  mapping: Record<string, any>;
  current_node: string | null;
}

// Claude API Types
export interface ClaudeProject {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface ClaudeDocument {
  type: 'document';
  content: string;
  name: string;
}
